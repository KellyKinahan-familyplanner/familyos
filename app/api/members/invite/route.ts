import { createServerSideClient, createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

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
  const { name, email } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  if (!email?.trim()) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const admin = createAdminClient()
  const initials = name.trim().split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  // Create a pending family_member row — user_id filled in when they accept
  const { data: pendingMember, error: insertError } = await admin
    .from('family_members')
    .insert({
      family_id:       member.family_id,
      display_name:    name.trim(),
      role:            'member',
      avatar_initials: initials,
      invite_email:    email.trim().toLowerCase(),
      invite_status:   'pending',
    })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Send Supabase invite email with family context in metadata
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email.trim().toLowerCase(), {
    redirectTo: `${siteUrl}/api/auth/accept-invite`,
    data: {
      family_id:  member.family_id,
      member_id:  pendingMember.id,
      given_name: name.trim(),
    },
  })

  if (inviteError) {
    // Roll back the pending member row
    await admin.from('family_members').delete().eq('id', pendingMember.id)
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, member: pendingMember }, { status: 201 })
}
