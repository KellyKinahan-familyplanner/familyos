import { createServerSideClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!member) return NextResponse.json({ error: 'No family' }, { status: 404 })

  const { data: family } = await supabase
    .from('families')
    .select('bedtime_enabled, bedtime_start, bedtime_end, notifications_enabled, timezone')
    .eq('id', member.family_id)
    .maybeSingle()

  return NextResponse.json(family ?? {
    bedtime_enabled: false,
    bedtime_start: '20:30',
    bedtime_end: '07:00',
    notifications_enabled: true,
    timezone: 'Australia/Sydney',
  })
}

export async function PATCH(request: NextRequest) {
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

  const body = await request.json()
  const update: Record<string, unknown> = {}
  if (body.bedtime_enabled  !== undefined) update.bedtime_enabled  = body.bedtime_enabled
  if (body.bedtime_start    !== undefined) update.bedtime_start    = body.bedtime_start
  if (body.bedtime_end      !== undefined) update.bedtime_end      = body.bedtime_end
  if (body.notifications_enabled !== undefined) update.notifications_enabled = body.notifications_enabled
  if (body.timezone         !== undefined) update.timezone         = body.timezone

  const { data, error } = await supabase
    .from('families')
    .update(update)
    .eq('id', member.family_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
