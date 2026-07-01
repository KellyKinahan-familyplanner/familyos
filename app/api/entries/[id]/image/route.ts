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
    .from('family_members').select('family_id').eq('user_id', user.id).maybeSingle()
  if (!self) return NextResponse.json({ error: 'No family' }, { status: 404 })

  const { id } = await params
  const formData = await request.formData()
  const file = formData.get('image') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `entries/${self.family_id}/${id}.${ext}`
  const admin = createAdminClient()

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)
  const imageUrl = `${publicUrl}?t=${Date.now()}`

  const { error: dbError } = await admin
    .from('calendar_entries').update({ image_url: imageUrl }).eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ image_url: imageUrl })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: self } = await supabase
    .from('family_members').select('family_id').eq('user_id', user.id).maybeSingle()
  if (!self) return NextResponse.json({ error: 'No family' }, { status: 404 })

  const { id } = await params
  const admin = createAdminClient()

  await admin.storage.from('avatars').remove([
    `entries/${self.family_id}/${id}.jpg`,
    `entries/${self.family_id}/${id}.png`,
    `entries/${self.family_id}/${id}.webp`,
  ])
  await admin.from('calendar_entries').update({ image_url: null }).eq('id', id)
  return NextResponse.json({ ok: true })
}
