import { createServerSideClient, createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: self } = await supabase
    .from('family_members').select('family_id, role, id').eq('user_id', user.id).maybeSingle()
  if (!self) return NextResponse.json({ error: 'No family' }, { status: 404 })

  const { id } = await params

  // Admins can edit anyone; members can only edit themselves
  const { data: target } = await supabase
    .from('family_members').select('family_id').eq('id', id).maybeSingle()
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target.family_id !== self.family_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (self.role !== 'admin' && self.id !== id) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (body.display_name?.trim()) updates.display_name = body.display_name.trim()
  if (body.avatar_initials?.trim()) updates.avatar_initials = body.avatar_initials.trim().slice(0, 2).toUpperCase()
  if (body.avatar_colour_bg !== undefined) updates.avatar_colour_bg = body.avatar_colour_bg
  if (body.avatar_colour_fg !== undefined) updates.avatar_colour_fg = body.avatar_colour_fg
  if (body.points_target !== undefined) updates.points_target = body.points_target
  if (body.reward_description !== undefined) updates.reward_description = body.reward_description
  if (body.bedtime !== undefined) updates.bedtime = body.bedtime
  if (body.wake_time !== undefined) updates.wake_time = body.wake_time
  if (body.screen_time_mins !== undefined) updates.screen_time_mins = body.screen_time_mins

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const { data, error } = await supabase.from('family_members').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('family_members')
    .select('family_id, role')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!member) return NextResponse.json({ error: 'No family' }, { status: 404 })
  if (member.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()

  // Safety: never delete the admin themselves
  const { data: target } = await admin
    .from('family_members')
    .select('role, family_id')
    .eq('id', id)
    .maybeSingle()

  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (target.family_id !== member.family_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (target.role === 'admin') return NextResponse.json({ error: 'Cannot remove admin' }, { status: 400 })

  const { error } = await admin.from('family_members').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
