import { createServerSideClient, createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params
  const admin = createAdminClient()

  // Safety: never delete the admin themselves
  const { data: target } = await admin
    .from('family_members')
    .select('role, family_id')
    .eq('id', id)
    .maybeSingle()

  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (target.family_id !== member.family_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (target.role === 'admin') return NextResponse.json({ error: 'Cannot remove admin' }, { status: 400 })

  const { error } = await admin.from('family_members').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
