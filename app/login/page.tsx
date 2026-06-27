'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const text = await res.text()
      console.log('Status:', res.status)
      console.log('Body:', text)
      if (!res.ok) {
        const data = text ? JSON.parse(text) : { error: 'Something went wrong' }
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }
      router.push('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F2', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', border: '1px solid #E8E4DF', borderRadius: 24, padding: '44px 40px', width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#1A1714' }}>Welcome back</h1>
        <p style={{ fontSize: 14, color: '#6B6561', marginBottom: 28 }}>Sign in to manage your family</p>

        {error && (
          <p style={{ background: '#FEF0F0', color: '#E24B4A', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {error}
          </p>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B6561', display: 'block', marginBottom: 6 }}>Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="sarah@example.com"
            style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E8E4DF', borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B6561', display: 'block', marginBottom: 6 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E8E4DF', borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', padding: 13, background: '#1A1714', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </main>
  )
}