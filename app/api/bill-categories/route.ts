import { createServerSideClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_CATEGORIES = [
  { name: 'Utilities',      colour: '#1D9E75' },
  { name: 'Insurance',      colour: '#1976D2' },
  { name: 'Mortgage / Rent',colour: '#7F77DD' },
  { name: 'Subscription',   colour: '#D85A30' },
  { name: 'School',         colour: '#D97706' },
  { name: 'Medical',        colour: '#DC2626' },
  { name: 'Other',          colour: '#A09893' },
]

export async function GET() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('family_members').select('family_id').eq('user_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'No family' }, { status: 404 })

  const { data: existing } = await supabase
    .from('bill_categories').select('*').eq('family_id', member.family_id).order('created_at')

  // Seed defaults if none exist
  if (!existing || existing.length === 0) {
    const { data: seeded } = await supabase
      .from('bill_categories')
      .insert(DEFAULT_CATEGORIES.map(c => ({ ...c, family_id: member.family_id, is_default: true })))
      .select()
    return NextResponse.json(seeded ?? [])
  }

  return NextResponse.json(existing)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('family_members').select('family_id, role').eq('user_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'No family' }, { status: 404 })
  if (member.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { name, colour } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { data, error } = await supabase
    .from('bill_categories')
    .insert({ family_id: member.family_id, name: name.trim(), colour: colour || '#1D9E75' })
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
  const { error } = await supabase
    .from('bill_categories').delete().eq('id', id).eq('family_id', member.family_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
