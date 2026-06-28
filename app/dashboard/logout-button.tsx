'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '6px 14px', borderRadius: '8px',
        border: '1.5px solid #E8E4DF', background: '#fff',
        fontSize: '12px', fontWeight: 600, color: '#6B6561',
        cursor: 'pointer', transition: 'all .15s'
      }}
    >
      Sign out
    </button>
  )
}
