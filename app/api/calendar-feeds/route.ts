import { createServerSideClient, createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: self } = await supabase
    .from('family_members').select('family_id, id').eq('user_id', user.id).maybeSingle()
  if (!self) return NextResponse.json({ error: 'No family' }, { status: 404 })

  // Optional ?member_id= filter
  const memberId = new URL(request.url).searchParams.get('member_id')

  const query = supabase
    .from('calendar_feeds')
    .select('*, family_members(display_name, avatar_initials)')
    .eq('family_id', self.family_id)
    .order('created_at')

  if (memberId) query.eq('member_id', memberId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: self } = await supabase
    .from('family_members').select('family_id, role, id').eq('user_id', user.id).maybeSingle()
  if (!self) return NextResponse.json({ error: 'No family' }, { status: 404 })

  const { name, url, colour, member_id } = await request.json()
  if (!name?.trim() || !url?.trim()) return NextResponse.json({ error: 'Name and URL required' }, { status: 400 })

  // Admins can add feeds for any member; regular members can only add for themselves
  if (self.role !== 'admin' && member_id && member_id !== self.id) {
    return NextResponse.json({ error: 'You can only add feeds for yourself' }, { status: 403 })
  }

  // Verify member_id belongs to the same family
  if (member_id) {
    const admin = createAdminClient()
    const { data: target } = await admin
      .from('family_members').select('family_id').eq('id', member_id).maybeSingle()
    if (!target || target.family_id !== self.family_id) {
      return NextResponse.json({ error: 'Member not in family' }, { status: 403 })
    }
  }

  const normUrl = url.trim().replace(/^webcal:\/\//i, 'https://')

  const { data, error } = await supabase
    .from('calendar_feeds')
    .insert({ family_id: self.family_id, name: name.trim(), url: normUrl, colour: colour || '#378ADD', member_id: member_id || null })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: self } = await supabase
    .from('family_members').select('family_id, role, id').eq('user_id', user.id).maybeSingle()
  if (!self) return NextResponse.json({ error: 'No family' }, { status: 404 })

  const { id } = await request.json()

  // Check the feed belongs to this family and (if not admin) to the current member
  const { data: feed } = await supabase
    .from('calendar_feeds').select('family_id, member_id').eq('id', id).maybeSingle()
  if (!feed || feed.family_id !== self.family_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (self.role !== 'admin' && feed.member_id !== self.id) {
    return NextResponse.json({ error: 'Not your feed' }, { status: 403 })
  }

  await supabase.from('calendar_entries').delete().eq('feed_id', id)
  const { error } = await supabase.from('calendar_feeds').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
