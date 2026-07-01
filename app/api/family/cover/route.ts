import { createServerSideClient, createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: self } = await supabase
    .from('family_members').select('family_id, role').eq('user_id', user.id).maybeSingle()
  if (!self) return NextResponse.json({ error: 'No family' }, { status: 404 })
  if (self.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('cover') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${self.family_id}/cover.${ext}`
  const admin = createAdminClient()

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)
  const coverUrl = `${publicUrl}?t=${Date.now()}`

  const { error: dbError } = await admin
    .from('families').update({ cover_url: coverUrl }).eq('id', self.family_id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ cover_url: coverUrl })
}

export async function DELETE(_request: NextRequest) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: self } = await supabase
    .from('family_members').select('family_id, role').eq('user_id', user.id).maybeSingle()
  if (!self || self.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const admin = createAdminClient()
  await admin.storage.from('avatars').remove([
    `${self.family_id}/cover.jpg`,
    `${self.family_id}/cover.png`,
    `${self.family_id}/cover.webp`,
  ])
  await admin.from('families').update({ cover_url: null }).eq('id', self.family_id)
  return NextResponse.json({ ok: true })
}
