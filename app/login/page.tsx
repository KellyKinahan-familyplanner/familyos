'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Check if user has a family record
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: member } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!member) {
        // No family yet — go to onboarding
        router.push('/onboarding')
      } else {
        // Has family — go to dashboard
        router.push('/dashboard')
      }
    }
    router.refresh()
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

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

    setSuccess('Account created successfully! Signing you in…')

    // Email confirmation is off for testing — sign straight in
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError('Account created — please sign in below.')
      setLoading(false)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid #E8E4DF',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#1A1714',
    background: '#F7F5F2',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color .15s',
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#F7F5F2',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{
          background: '#fff',
          border: '1px solid #E8E4DF',
          borderRadius: '28px',
          padding: '44px 40px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 8px 40px rgba(0,0,0,.07)',
        }}>

          {/* KYNC Logo */}
          <div style={{ marginBottom: '32px' }}>
            <Image
              src="/Kync_logo.png"
              alt="KYNC — One Hub. Total Sync."
              width={160}
              height={72}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>

          <div style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px', color: '#1A1714' }}>
            {mode === 'login' ? 'Welcome back' : 'Create your family'}
          </div>
          <div style={{ fontSize: '14px', color: '#6B6561', marginBottom: '28px', lineHeight: 1.5 }}>
            {mode === 'login'
              ? "Sign in to manage your family's calendar, tasks, and more."
              : 'Set up your KYNC account and get your family organised.'}
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              background: '#FEF0F0',
              border: '1px solid #F09595',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#A32D2D',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div style={{
              background: '#E3F5EF',
              border: '1px solid #86efbd',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#085041',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              ✅ {success}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleSignUp}>

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#6B6561',
                marginBottom: '6px',
                letterSpacing: '0.02em',
              }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="sarah@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#6B6561',
                marginBottom: '6px',
                letterSpacing: '0.02em',
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
              {mode === 'signup' && (
                <div style={{ fontSize: '11px', color: '#A09893', marginTop: '5px' }}>
                  Minimum 6 characters
                </div>
              )}
            </div>

            {/* Primary button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                background: loading ? '#6B6561' : '#1A1714',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '10px',
                fontFamily: "'Inter', sans-serif",
                transition: 'background .15s',
              }}
            >
              {loading
                ? mode === 'login' ? 'Signing in…' : 'Creating account…'
                : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>

          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '16px 0',
            color: '#A09893',
            fontSize: '12px',
          }}>
            <div style={{ flex: 1, height: '1px', background: '#E8E4DF' }}></div>
            or
            <div style={{ flex: 1, height: '1px', background: '#E8E4DF' }}></div>
          </div>

          {/* Toggle mode button */}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null); }}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '12px',
              border: '1.5px solid #E8E4DF',
              background: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              color: '#6B6561',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {mode === 'login' ? 'Create a new family account' : 'Already have an account? Sign in'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#A09893' }}>
            By continuing you agree to KYNC&apos;s terms of service.
          </div>

        </div>
      </div>
    </>
  )
}
