'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [view, setView] = useState<'adult' | 'kid'>('adult')

  // Kid login state
  const [familySlug, setFamilySlug] = useState('')
  const [childUsername, setChildUsername] = useState('')
  const [pin, setPin] = useState('')

  const supabase = createClient()

  async function handleKidLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/auth/child-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        family_slug: familySlug.trim().toLowerCase(),
        child_username: childUsername.trim().toLowerCase().replace(/\s+/g, '-'),
        pin: pin.trim(),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Login failed. Please try again.')
      setLoading(false)
      return
    }

    setSuccess(`Hi ${data.display_name}! Taking you to your dashboard… 🏠`)
    setTimeout(() => { window.location.href = '/dashboard' }, 1000)
  }

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

    setSuccess('Welcome back! Taking you to your dashboard… 🏠')

    // Check if user has a family record
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: member } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      setTimeout(() => {
        if (!member) {
          window.location.href = '/onboarding'
        } else {
          window.location.href = '/dashboard'
        }
      }, 1000)
    } else {
      setError('Could not get user session. Please try again.')
      setLoading(false)
    }
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

    // Sign straight in since email confirmation is off
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError('Account created — please sign in below.')
      setLoading(false)
      return
    }

    // Check if this account already completed onboarding
    const { data: { user: newUser } } = await supabase.auth.getUser()
    if (newUser) {
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', newUser.id)
        .maybeSingle()

      setSuccess(existingMember
        ? 'Welcome back! Taking you to your dashboard… 🏠'
        : 'Account created! Setting things up… ✨'
      )
      setTimeout(() => {
        window.location.href = existingMember ? '/dashboard' : '/onboarding'
      }, 1000)
    } else {
      setSuccess('Account created! Setting things up… ✨')
      setTimeout(() => { window.location.href = '/onboarding' }, 1000)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #E8E4DF',
    borderRadius: '12px', fontSize: '14px', color: '#1A1714',
    background: '#F7F5F2', outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '24px',
        background: '#F7F5F2', fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{
          background: '#fff', border: '1px solid #E8E4DF', borderRadius: '28px',
          padding: '44px 40px', width: '100%', maxWidth: '420px',
          boxShadow: '0 8px 40px rgba(0,0,0,.07)',
        }}>

          <div style={{ marginBottom: '32px' }}>
            <Image src="/Kync_logo.png" alt="KYNC" width={160} height={72} style={{ objectFit: 'contain' }} priority />
          </div>

          {/* Adult / Kid toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#F7F5F2', borderRadius: '14px', padding: '4px' }}>
            <button onClick={() => { setView('adult'); setError(null); setSuccess(null) }} style={{
              flex: 1, padding: '9px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700,
              background: view === 'adult' ? '#1A1714' : 'transparent',
              color: view === 'adult' ? '#fff' : '#6B6561', transition: 'all .15s',
            }}>👤 I&apos;m an adult</button>
            <button onClick={() => { setView('kid'); setError(null); setSuccess(null) }} style={{
              flex: 1, padding: '9px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700,
              background: view === 'kid' ? '#378ADD' : 'transparent',
              color: view === 'kid' ? '#fff' : '#6B6561', transition: 'all .15s',
            }}>🧒 I&apos;m a kid</button>
          </div>

          <div style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px', color: '#1A1714' }}>
            {view === 'kid' ? 'Kids login' : mode === 'login' ? 'Welcome back' : 'Create your family'}
          </div>
          <div style={{ fontSize: '14px', color: '#6B6561', marginBottom: '28px', lineHeight: 1.5 }}>
            {view === 'kid'
              ? 'Enter your family username, your name and your PIN.'
              : mode === 'login'
                ? "Sign in to manage your family's calendar, tasks, and more."
                : 'Set up your KYNC account and get your family organised.'}
          </div>

          {success && (
            <div style={{
              background: '#E3F5EF', border: '1.5px solid #86efbd',
              borderRadius: '12px', padding: '12px 16px',
              fontSize: '14px', fontWeight: 600, color: '#085041',
              marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '20px' }}>✅</span>
              {success}
            </div>
          )}

          {error && (
            <div style={{
              background: '#FEF0F0', border: '1px solid #F09595',
              borderRadius: '10px', padding: '10px 14px',
              fontSize: '13px', color: '#A32D2D', marginBottom: '16px',
            }}>
              ⚠️ {error}
            </div>
          )}

          {!success && view === 'kid' && (
            <form onSubmit={handleKidLogin}>
              <div style={{ background: '#EBF4FD', border: '1.5px solid #B5D4F4', borderRadius: '12px', padding: '12px 14px', marginBottom: '20px', fontSize: '12px', color: '#0C447C', lineHeight: 1.6 }}>
                🔑 Ask a parent for your <strong>family username</strong> if you don&apos;t know it.
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B6561', marginBottom: '6px', letterSpacing: '0.02em' }}>Family username</label>
                <input type="text" placeholder="e.g. jones-family-4821" value={familySlug} onChange={e => setFamilySlug(e.target.value)} required style={inputStyle} autoCapitalize="none" autoCorrect="off" />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B6561', marginBottom: '6px', letterSpacing: '0.02em' }}>Your name</label>
                <input type="text" placeholder="e.g. Olivia or olivia-jones" value={childUsername} onChange={e => setChildUsername(e.target.value)} required style={inputStyle} autoCapitalize="none" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B6561', marginBottom: '6px', letterSpacing: '0.02em' }}>Your PIN</label>
                <input type="password" placeholder="••••" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} inputMode="numeric" required style={{ ...inputStyle, fontSize: '24px', letterSpacing: '0.5em', textAlign: 'center' }} />
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px', borderRadius: '12px',
                background: loading ? '#6B6561' : '#378ADD', color: '#fff',
                fontSize: '14px', fontWeight: 700, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}>
                {loading ? 'Checking…' : 'Log in 🧒'}
              </button>
            </form>
          )}

          {!success && view === 'adult' && (
            <form onSubmit={mode === 'login' ? handleLogin : handleSignUp}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B6561', marginBottom: '6px', letterSpacing: '0.02em' }}>
                  Email address
                </label>
                <input type="email" placeholder="sarah@example.com" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B6561', marginBottom: '6px', letterSpacing: '0.02em' }}>
                  Password
                </label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
                {mode === 'signup' && (
                  <div style={{ fontSize: '11px', color: '#A09893', marginTop: '5px' }}>Minimum 6 characters</div>
                )}
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px', borderRadius: '12px',
                background: loading ? '#6B6561' : '#1A1714', color: '#fff',
                fontSize: '14px', fontWeight: 700, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '10px',
                fontFamily: "'Inter', sans-serif",
              }}>
                {loading
                  ? mode === 'login' ? 'Signing in…' : 'Creating account…'
                  : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0', color: '#A09893', fontSize: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: '#E8E4DF' }}></div>
                or
                <div style={{ flex: 1, height: '1px', background: '#E8E4DF' }}></div>
              </div>

              <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null) }} style={{
                width: '100%', padding: '11px', borderRadius: '12px',
                border: '1.5px solid #E8E4DF', background: '#fff',
                fontSize: '13px', fontWeight: 600, color: '#6B6561',
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}>
                {mode === 'login' ? 'Create a new family account' : 'Already have an account? Sign in'}
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#A09893' }}>
            By continuing you agree to KYNC&apos;s terms of service.
          </div>

        </div>
      </div>
    </>
  )
}
