export const runtime = 'nodejs'

import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { family_slug, child_username, pin } = await request.json()

    if (!family_slug || !child_username || !pin) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Look up family by slug
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('id, name')
      .eq('slug', family_slug.trim().toLowerCase())
      .maybeSingle()

    if (familyError || !family) {
      return NextResponse.json({ error: 'Family not found. Check your family username.' }, { status: 404 })
    }

    // Look up child member by child_username + PIN
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('id, display_name, child_username, role, avatar_initials')
      .eq('family_id', family.id)
      .eq('child_username', child_username.trim().toLowerCase())
      .eq('pin_hash', pin.trim())
      .eq('role', 'child')
      .maybeSingle()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Incorrect PIN. Please try again.' }, { status: 401 })
    }

    // Set a secure child session cookie
    const session = JSON.stringify({
      family_id: family.id,
      family_name: family.name,
      member_id: member.id,
      display_name: member.display_name,
      child_username: member.child_username,
      avatar_initials: member.avatar_initials,
      role: 'child',
    })

    const response = NextResponse.json({ success: true, display_name: member.display_name })
    response.cookies.set('kync-child-session', session, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
    return response
  } catch (err) {
    console.error('Child login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
