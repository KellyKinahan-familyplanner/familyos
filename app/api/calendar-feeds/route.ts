import { createServerSideClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('family_members').select('family_id').eq('user_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'No family' }, { status: 404 })

  const { data, error } = await supabase
    .from('calendar_feeds')
    .select('*, family_members(display_name, avatar_initials)')
    .eq('family_id', member.family_id)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('family_members').select('family_id, role').eq('user_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'No family' }, { status: 404 })
  if (member.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { name, url, colour, member_id } = await request.json()
  if (!name?.trim() || !url?.trim()) return NextResponse.json({ error: 'Name and URL required' }, { status: 400 })

  // Normalise webcal:// → https://
  const normUrl = url.trim().replace(/^webcal:\/\//i, 'https://')

  const { data, error } = await supabase
    .from('calendar_feeds')
    .insert({ family_id: member.family_id, name: name.trim(), url: normUrl, colour: colour || '#378ADD', member_id: member_id || null })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('family_members').select('family_id, role').eq('user_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'No family' }, { status: 404 })
  if (member.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { id } = await request.json()

  // Remove entries that came from this feed
  await supabase.from('calendar_entries').delete().eq('feed_id', id)

  const { error } = await supabase
    .from('calendar_feeds').delete().eq('id', id).eq('family_id', member.family_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
