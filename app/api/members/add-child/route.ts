import { createServerSideClient, createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

function toChildUsername(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export async function POST(request: NextRequest) {
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
  const { name, pin } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  if (!pin || !/^\d{4}$/.test(pin)) return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 })

  const admin = createAdminClient()
  const initials = name.trim().split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
  const child_username = toChildUsername(name)

  // Check username isn't already taken in this family
  const { data: existing } = await admin
    .from('family_members')
    .select('id')
    .eq('family_id', member.family_id)
    .eq('child_username', child_username)
    .maybeSingle()

  const finalUsername = existing ? `${child_username}-${Date.now().toString().slice(-4)}` : child_username

  const { data: newMember, error } = await admin
    .from('family_members')
    .insert({
      family_id:       member.family_id,
      display_name:    name.trim(),
      role:            'child',
      child_username:  finalUsername,
      pin_hash:        pin,           // plain 4-digit PIN (matches existing schema)
      avatar_initials: initials,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(newMember, { status: 201 })
}
