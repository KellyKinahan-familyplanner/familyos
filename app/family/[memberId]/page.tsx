import { createServerSideClient, createAdminClient } from '@/lib/supabase'
import { redirect, notFound } from 'next/navigation'
import MemberProfileClient from './MemberProfileClient'

export const dynamic = 'force-dynamic'

export default async function MemberProfilePage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: self } = await supabase
    .from('family_members')
    .select('role, family_id, display_name, id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!self) redirect('/onboarding')

  const admin = createAdminClient()
  const { data: target } = await admin
    .from('family_members')
    .select('id, family_id, display_name, role, avatar_initials, avatar_colour_bg, avatar_colour_fg, avatar_url, points_total, points_target, reward_description, bedtime, wake_time, screen_time_mins, child_username, guest_permissions')
    .eq('id', memberId)
    .maybeSingle()

  if (!target || target.family_id !== self.family_id) notFound()

  // Fetch this member's personal calendar feeds
  const { data: feeds } = await supabase
    .from('calendar_feeds')
    .select('id, name, url, colour, last_synced')
    .eq('family_id', self.family_id)
    .eq('member_id', memberId)
    .order('created_at')

  // For guests: fetch all family members so the admin can pick which ones the guest can see
  const { data: allMembers } = target.role === 'guest'
    ? await admin.from('family_members').select('id, display_name, role').eq('family_id', self.family_id)
    : { data: null }

  const isAdmin = self.role === 'admin'
  const isSelf = self.id === target.id

  return (
    <MemberProfileClient
      member={target}
      isAdmin={isAdmin}
      isSelf={isSelf}
      initialFeeds={feeds ?? []}
      allMembers={allMembers ?? []}
    />
  )
}
