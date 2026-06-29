import { createServerSideClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const supabase = await createServerSideClient()
  await supabase.auth.signOut()

  // Also clear child PIN session
  const cookieStore = await cookies()
  cookieStore.delete('kync-child-session')

  return NextResponse.json({ ok: true })
}
