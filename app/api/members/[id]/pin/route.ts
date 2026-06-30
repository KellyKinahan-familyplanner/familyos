import { createServerSideClient, createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: self } = await supabase
    .from('family_members').select('family_id, role').eq('user_id', user.id).maybeSingle()
  if (!self || self.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()

  const { data: target } = await admin
    .from('family_members').select('family_id, role').eq('id', id).maybeSingle()
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target.family_id !== self.family_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (target.role !== 'child') return NextResponse.json({ error: 'PIN only for children' }, { status: 400 })

  const { pin } = await request.json()
  if (!pin || pin.length < 4) return NextResponse.json({ error: 'PIN too short' }, { status: 400 })

  const pin_hash = createHash('sha256').update(pin).digest('hex')

  const { error } = await admin.from('family_members').update({ pin_hash }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
