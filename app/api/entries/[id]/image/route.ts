import { createServerSideClient, createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
    const path = `entries/${self.family_id}/${id}.${ext}`
    const admin = createAdminClient()

    console.log('[image/POST] uploading to path:', path, '| size:', file.size, '| type:', file.type || 'unknown')

    const { error: uploadError } = await admin.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' })

    if (uploadError) {
      console.error('[image/POST] storage upload error:', uploadError.message, '| path:', path)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)
    const imageUrl = `${publicUrl}?t=${Date.now()}`

    const { error: dbError } = await admin
      .from('calendar_entries').update({ image_url: imageUrl }).eq('id', id)
    if (dbError) {
      console.error('[image/POST] db update error:', dbError.message, '| id:', id)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    console.log('[image/POST] success, imageUrl:', imageUrl)
    return NextResponse.json({ image_url: imageUrl })
  } catch (err) {
    console.error('[image/POST] unhandled exception:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
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

  // Get current image_url so we can derive the storage path
  const { data: entry } = await admin
    .from('calendar_entries').select('image_url').eq('id', id).maybeSingle()
  if (entry?.image_url) {
    // Extract storage path from public URL: everything after /object/public/avatars/
    const match = entry.image_url.match(/\/object\/public\/avatars\/(.+?)(\?|$)/)
    if (match) await admin.storage.from('avatars').remove([decodeURIComponent(match[1])])
  }
  await admin.from('calendar_entries').update({ image_url: null }).eq('id', id)
  return NextResponse.json({ ok: true })
}
