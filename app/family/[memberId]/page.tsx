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
    .select('role, family_id, display_name')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!self) redirect('/onboarding')

  const admin = createAdminClient()
  const { data: target } = await admin
    .from('family_members')
    .select('id, family_id, display_name, role, avatar_initials, avatar_colour_bg, avatar_colour_fg, avatar_url, points_total, points_target, reward_description, bedtime, wake_time, screen_time_mins, child_username')
    .eq('id', memberId)
    .maybeSingle()

  if (!target || target.family_id !== self.family_id) notFound()

  const isAdmin = self.role === 'admin'

  return (
    <MemberProfileClient
      member={target}
      isAdmin={isAdmin}
      isSelf={target.role !== 'child' && self.display_name === target.display_name}
    />
  )
}
