import { createServerSideClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/entries/[id] — update an entry (e.g. mark complete, edit fields)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  // Build update payload — only include fields that were sent
  const update: Record<string, unknown> = {}
  if (body.title       !== undefined) update.title              = body.title
  if (body.date        !== undefined) update.date               = body.date
  if (body.time        !== undefined) update.time_start         = body.time || null
  if (body.endTime     !== undefined) update.time_end           = body.endTime || null
  if (body.colour      !== undefined) update.colour             = body.colour
  if (body.assignees   !== undefined) update.assignees          = body.assignees
  if (body.notes       !== undefined) update.notes              = body.notes
  if (body.completed   !== undefined) update.completed          = body.completed
  if (body.points      !== undefined) update.points             = body.points
  if (body.subject     !== undefined) update.subject            = body.subject
  if (body.recur       !== undefined) update.recur              = body.recur
  if (body.recurDays   !== undefined) update.recur_days         = body.recurDays
  if (body.recurMonthType !== undefined) update.recur_month_type = body.recurMonthType
  if (body.recurMonthDate !== undefined) update.recur_month_date = body.recurMonthDate
  if (body.recurMonthOrdinal !== undefined) update.recur_month_ordinal = body.recurMonthOrdinal
  if (body.recurMonthDay !== undefined) update.recur_month_day  = body.recurMonthDay
  if (body.recurEnd    !== undefined) update.recur_end          = body.recurEnd
  if (body.recurEndDate !== undefined) update.recur_end_date    = body.recurEndDate
  if (body.recurEndCount !== undefined) update.recur_end_count  = body.recurEndCount

  const { data, error } = await supabase
    .from('calendar_entries')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/entries/[id] — remove an entry
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { error } = await supabase
    .from('calendar_entries')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
