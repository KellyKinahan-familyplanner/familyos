import { createServerSideClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

function periodBounds(period: string): { start: string; end: string; label: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() // 0-indexed

  if (period === 'month') {
    const start = new Date(y, m, 1).toISOString().slice(0, 10)
    const end   = new Date(y, m + 1, 0).toISOString().slice(0, 10)
    return { start, end, label: now.toLocaleString('en-AU', { month: 'long', year: 'numeric' }) }
  }
  if (period === 'quarter') {
    const q     = Math.floor(m / 3)
    const start = new Date(y, q * 3, 1).toISOString().slice(0, 10)
    const end   = new Date(y, q * 3 + 3, 0).toISOString().slice(0, 10)
    const qNum  = q + 1
    return { start, end, label: `Q${qNum} ${y}` }
  }
  // year
  return {
    start: `${y}-01-01`,
    end:   `${y}-12-31`,
    label: `Full year ${y}`,
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('family_members').select('family_id').eq('user_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'No family' }, { status: 404 })

  const period = request.nextUrl.searchParams.get('period') || 'month'
  const { start, end, label } = periodBounds(period)

  // Fetch bills (calendar entries with bill_amount set, or type=event + colour=amber)
  const { data: bills } = await supabase
    .from('calendar_entries')
    .select('*')
    .eq('family_id', member.family_id)
    .gte('date', start)
    .lte('date', end)
    .not('bill_amount', 'is', null)
    .order('date', { ascending: false })

  const rows = bills ?? []

  const total    = rows.reduce((s, r) => s + (Number(r.bill_amount) || 0), 0)
  const paid     = rows.filter(r => r.bill_status === 'paid').reduce((s, r) => s + (Number(r.bill_amount) || 0), 0)
  const overdue  = rows.filter(r => r.bill_status === 'overdue').reduce((s, r) => s + (Number(r.bill_amount) || 0), 0)
  const upcoming = total - paid - overdue

  // Category breakdown
  const catMap: Record<string, number> = {}
  rows.forEach(r => {
    const cat = r.bill_category || 'Other'
    catMap[cat] = (catMap[cat] || 0) + (Number(r.bill_amount) || 0)
  })
  const categories = Object.entries(catMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)

  // Monthly breakdown (for chart — 6 buckets)
  const monthlyMap: Record<string, number> = {}
  rows.forEach(r => {
    const key = r.date.slice(0, 7) // YYYY-MM
    monthlyMap[key] = (monthlyMap[key] || 0) + (Number(r.bill_amount) || 0)
  })

  return NextResponse.json({
    period, label, start, end,
    summary: { total, paid, overdue, upcoming },
    categories,
    monthly: monthlyMap,
    bills: rows,
  })
}
