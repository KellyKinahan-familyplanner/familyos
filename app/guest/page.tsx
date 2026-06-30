import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase'
import GuestClient from './GuestClient'

export const dynamic = 'force-dynamic'

type GuestPerms = {
  can_view_calendar?: boolean
  can_view_tasks?: boolean
  can_view_bills?: boolean
  member_ids?: string[]
}

export default async function GuestPage() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('kync-child-session')?.value
  if (!raw) redirect('/login')

  let session: { member_id: string; family_id: string; display_name: string; role: string; family_name: string }
  try { session = JSON.parse(raw) } catch { redirect('/login') }

  if (session.role !== 'guest') redirect('/login')

  const admin = createAdminClient()

  const { data: member } = await admin
    .from('family_members')
    .select('id, display_name, family_id, guest_permissions')
    .eq('id', session.member_id)
    .maybeSingle()
  if (!member) redirect('/login')

  const perms: GuestPerms = (member.guest_permissions as GuestPerms) ?? {
    can_view_calendar: true,
    can_view_tasks: true,
    can_view_bills: false,
    member_ids: [],
  }

  // Fetch all entries for this family
  const { data: allEntries } = await admin
    .from('calendar_entries')
    .select('*')
    .eq('family_id', member.family_id)
    .order('date', { ascending: true })

  // Apply permission filters
  const allowedTypes = new Set<string>()
  if (perms.can_view_calendar !== false) { allowedTypes.add('event'); allowedTypes.add('special') }
  if (perms.can_view_tasks !== false) { allowedTypes.add('task'); allowedTypes.add('chore'); allowedTypes.add('homework'); allowedTypes.add('exam'); allowedTypes.add('revision') }
  if (perms.can_view_bills === true) { allowedTypes.add('bill') }

  let entries = (allEntries ?? []).filter((e: { type: string }) => allowedTypes.has(e.type))

  if (perms.member_ids && perms.member_ids.length > 0) {
    const { data: allowedMembers } = await admin
      .from('family_members')
      .select('display_name')
      .in('id', perms.member_ids)
    const allowedNames = new Set((allowedMembers ?? []).map((m: { display_name: string }) => m.display_name))
    entries = entries.filter((e: { assignees?: string[] }) =>
      (e.assignees ?? []).includes('Everyone') ||
      (e.assignees ?? []).some((a: string) => allowedNames.has(a))
    )
  }

  const { data: family } = await admin
    .from('families')
    .select('name')
    .eq('id', member.family_id)
    .maybeSingle()

  return (
    <GuestClient
      displayName={session.display_name}
      familyName={family?.name ?? ''}
      entries={entries}
      canViewCalendar={perms.can_view_calendar !== false}
      canViewTasks={perms.can_view_tasks !== false}
    />
  )
}
