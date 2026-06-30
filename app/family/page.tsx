import { createServerSideClient, createAdminClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import FamilyClient from './FamilyClient'

export default async function FamilyPage() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('family_members')
    .select('display_name, role, family_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!member) redirect('/onboarding')

  const { data: family } = await supabase
    .from('families')
    .select('name, slug')
    .eq('id', member.family_id)
    .maybeSingle()

  const { data: allMembers } = await createAdminClient()
    .from('family_members')
    .select('id, display_name, role, avatar_initials, avatar_colour_bg, avatar_colour_fg, avatar_url, child_username, invite_email, invite_status')
    .eq('family_id', member.family_id)

  const displayName = member?.display_name ?? user.email ?? 'there'
  const initials    = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
  const isAdmin     = member.role === 'admin'

  return (
    <FamilyClient
      displayName={displayName}
      familyName={family?.name ?? ''}
      familySlug={family?.slug ?? ''}
      initials={initials}
      isAdmin={isAdmin}
      members={(allMembers ?? []) as FamilyMember[]}
    />
  )
}

export type FamilyMember = {
  id: string
  display_name: string
  role: 'admin' | 'member' | 'child' | 'guest'
  avatar_initials: string
  avatar_colour_bg?: string | null
  avatar_colour_fg?: string | null
  avatar_url?: string | null
  child_username?: string
  invite_email?: string
  invite_status?: 'pending' | 'accepted'
}
