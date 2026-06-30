import { createServerSideClient, createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: self } = await supabase
    .from('family_members').select('family_id, role').eq('user_id', user.id).maybeSingle()
  if (!self) return NextResponse.json({ error: 'No family' }, { status: 404 })
  if (self.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()

  const { data: target } = await admin
    .from('family_members').select('family_id, avatar_url').eq('id', id).maybeSingle()
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target.family_id !== self.family_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('avatar') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${self.family_id}/${id}.${ext}`

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)

  // Append cache-buster so browsers reload the image even if path is the same
  const avatarUrl = `${publicUrl}?t=${Date.now()}`

  const { error: dbError } = await admin
    .from('family_members').update({ avatar_url: avatarUrl }).eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ avatar_url: avatarUrl })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: self } = await supabase
    .from('family_members').select('family_id, role').eq('user_id', user.id).maybeSingle()
  if (!self || self.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()

  const { data: target } = await admin
    .from('family_members').select('family_id').eq('id', id).maybeSingle()
  if (!target || target.family_id !== self.family_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Remove from storage (try both jpg and png)
  await admin.storage.from('avatars').remove([
    `${self.family_id}/${id}.jpg`,
    `${self.family_id}/${id}.png`,
    `${self.family_id}/${id}.webp`,
  ])

  await admin.from('family_members').update({ avatar_url: null }).eq('id', id)
  return NextResponse.json({ ok: true })
}
