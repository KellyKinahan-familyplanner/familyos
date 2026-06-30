import { createServerSideClient, createAdminClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: member } = await supabase
    .from('family_members')
    .select('display_name, role, family_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) {
    redirect('/onboarding')
  }

  const { data: family } = await supabase
    .from('families')
    .select('name')
    .eq('id', member.family_id)
    .maybeSingle()

  const { data: allMembers } = await createAdminClient()
    .from('family_members')
    .select('id, display_name, role, avatar_initials')
    .eq('family_id', member.family_id)

  const displayName = member?.display_name ?? user.email ?? 'there'
  const familyName = family?.name ?? ''
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <DashboardClient
      displayName={displayName}
      familyName={familyName}
      initials={initials}
      userEmail={user.email}
      members={allMembers ?? []}
    />
  )
}
