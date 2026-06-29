import { createServerSideClient, createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// Supabase redirects here after the user clicks the invite email link.
// The URL contains a code param which we exchange for a session, then
// link the new user's auth.uid() to their pending family_member row.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) return NextResponse.redirect(`${origin}/login?error=missing_code`)

  const supabase = await createServerSideClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) return NextResponse.redirect(`${origin}/login?error=invite_expired`)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login?error=no_user`)

  const admin = createAdminClient()

  // Find the pending family_member created when the invite was sent
  const memberId  = user.user_metadata?.member_id as string | undefined
  const familyId  = user.user_metadata?.family_id as string | undefined
  const givenName = (user.user_metadata?.given_name as string | undefined) || user.email || 'Member'

  if (memberId) {
    await admin
      .from('family_members')
      .update({ user_id: user.id, invite_status: 'accepted' })
      .eq('id', memberId)
  } else if (familyId) {
    // Fallback: match by invite_email
    const { data: pending } = await admin
      .from('family_members')
      .select('id')
      .eq('family_id', familyId)
      .eq('invite_email', user.email!)
      .eq('invite_status', 'pending')
      .maybeSingle()
    if (pending) {
      await admin
        .from('family_members')
        .update({ user_id: user.id, invite_status: 'accepted' })
        .eq('id', pending.id)
    } else {
      // No pending row — create a fresh member record
      const initials = givenName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
      await admin.from('family_members').insert({
        family_id: familyId, user_id: user.id,
        display_name: givenName, role: 'member',
        avatar_initials: initials, invite_status: 'accepted',
      })
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
