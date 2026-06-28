'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Since email confirmation is off for testing, log straight in
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError('Account created — please sign in.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
      background: '#F7F5F2', fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: '#fff', border: '1px solid #E8E4DF',
        borderRadius: '28px', padding: '44px 40px',
        width: '100%', maxWidth: '420px',
        boxShadow: '0 8px 40px rgba(0,0,0,.07)'
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: '#1A1714', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ color: '#fff', fontSize: '22px' }}>🏠</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>
            KY<span style={{ color: '#1D9E75' }}>NC</span>
          </div>
        </div>

        <div style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px' }}>
          Welcome back
        </div>
        <div style={{ fontSize: '14px', color: '#6B6561', marginBottom: '28px', lineHeight: 1.5 }}>
          Sign in to manage your family&apos;s calendar, tasks, and more.
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: '#FEF0F0', border: '1px solid #F09595',
            borderRadius: '10px', padding: '10px 14px',
            fontSize: '13px', color: '#A32D2D', marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', fontSize: '12px', fontWeight: 600,
              color: '#6B6561', marginBottom: '6px', letterSpacing: '0.02em'
            }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="sarah@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '11px 14px',
                border: '1.5px solid #E8E4DF', borderRadius: '12px',
                fontSize: '14px', color: '#1A1714', background: '#F7F5F2',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block', fontSize: '12px', fontWeight: 600,
              color: '#6B6561', marginBottom: '6px', letterSpacing: '0.02em'
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '11px 14px',
                border: '1.5px solid #E8E4DF', borderRadius: '12px',
                fontSize: '14px', color: '#1A1714', background: '#F7F5F2',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Sign in button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              borderRadius: '12px', background: loading ? '#6B6561' : '#1A1714',
              color: '#fff', fontSize: '14px', fontWeight: 700,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '12px'
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          {/* Sign up button */}
          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            style={{
              width: '100%', padding: '11px',
              borderRadius: '12px', border: '1.5px solid #E8E4DF',
              background: '#fff', fontSize: '13px', fontWeight: 600,
              color: '#6B6561', cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Create a new family account
          </button>
        </form>

        <div style={{
          textAlign: 'center', marginTop: '24px',
          fontSize: '12px', color: '#A09893'
        }}>
          By signing in you agree to KYNC&apos;s terms of service.
        </div>
      </div>
    </div>
  )
}
