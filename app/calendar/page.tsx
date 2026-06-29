import { createServerSideClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import CalendarClient from './CalendarClient'

export const dynamic = 'force-dynamic'

const MEMBER_COLOURS = [
  { bg: '#E8F7F2', fg: '#1D9E75' },
  { bg: '#FFF3E0', fg: '#F57C00' },
  { bg: '#E3F2FD', fg: '#1976D2' },
  { bg: '#F3F0FF', fg: '#7F77DD' },
  { bg: '#FEE2E2', fg: '#DC2626' },
  { bg: '#FEF9C3', fg: '#A16207' },
]

export default async function CalendarPage() {
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
    .select('name')
    .eq('id', member.family_id)
    .maybeSingle()

  // Fetch all members of this family
  const { data: allMembers } = await supabase
    .from('family_members')
    .select('id, display_name, role, avatar_initials')
    .eq('family_id', member.family_id)
    .order('created_at', { ascending: true })

  const displayName = member?.display_name ?? user.email ?? 'there'
  const familyName  = family?.name ?? ''
  const initials    = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  // Map DB rows to the Member shape CalendarClient expects
  const familyMembers = (allMembers ?? []).map((m, i) => {
    const col = MEMBER_COLOURS[i % MEMBER_COLOURS.length]
    const name = m.display_name ?? 'Member'
    const ini  = m.avatar_initials || name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    return { id: m.id, name, initials: ini, colour: `m${i}`, bg: col.bg, fg: col.fg }
  })

  return (
    <CalendarClient
      displayName={displayName}
      familyName={familyName}
      initials={initials}
      userEmail={user.email ?? ''}
      familyMembers={familyMembers}
    />
  )
}
