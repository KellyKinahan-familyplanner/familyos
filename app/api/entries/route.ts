import { createServerSideClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/entries — fetch all entries for the authenticated user's family
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

  const { data, error } = await supabase
    .from('calendar_entries')
    .select('*')
    .eq('family_id', member.family_id)
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/entries — create a new entry
export async function POST(request: NextRequest) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!member) return NextResponse.json({ error: 'No family' }, { status: 404 })

  const body = await request.json()

  const { data, error } = await supabase
    .from('calendar_entries')
    .insert({
      family_id:          member.family_id,
      created_by:         user.id,
      title:              body.title,
      date:               body.date,
      time_start:         body.time        || null,
      time_end:           body.endTime     || null,
      type:               body.type        || 'event',
      colour:             body.colour      || 'green',
      assignees:          body.assignees   || ['Everyone'],
      notes:              body.notes       || null,
      completed:          body.completed   ?? false,
      points:             body.points      ?? 0,
      subject:            body.subject     || null,
      recur:              body.recur       || 'none',
      recur_days:         body.recurDays   || null,
      recur_month_type:   body.recurMonthType    || null,
      recur_month_date:   body.recurMonthDate    || null,
      recur_month_ordinal:body.recurMonthOrdinal || null,
      recur_month_day:    body.recurMonthDay     || null,
      recur_end:          body.recurEnd          || 'never',
      recur_end_date:     body.recurEndDate      || null,
      recur_end_count:    body.recurEndCount     || null,
      bill_amount:        body.bill_amount       ?? null,
      bill_category:      body.bill_category     || null,
      bill_status:        body.bill_status       || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
