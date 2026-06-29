'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type Member = {
  display_name: string
  child_username: string
  role: 'member' | 'child' | 'guest'
  email?: string
  pin?: string
}

const STEPS = [
  {
    msg: "Hi there! Welcome to KYNC — the all-in-one solution for syncing your kin! I'm KYNCy, your very own KYNC wizard, and I'm SO excited to help get your family set up! This will only take a couple of minutes and then the magic begins. Let's go! 🧙✨",
  },
  {
    msg: "Wonderful! First things first — let me get to know your family. What's your name, and what should I call your family? I'll also set your location and currency so bills and reports are spot on for you!",
  },
  {
    msg: "Now for the fun part — let's meet the whole family! Adult members will get their own email login, and I'll send them an invite once we're done. For your little ones, no email needed — I'll set them up with a simple 4-digit PIN. They just tap their name and type their PIN to get into their very own Kids View. Easy peasy! 🎉",
  },
  {
    msg: "Almost there — just a few quick settings and we're done! Don't worry, you can change any of these any time from your Family Settings page. I'll always be close by if you need me!",
  },
  {
    msg: "Ta-da! 🎉 Your family is all set up and ready to go! I've noted down everything below. Make sure you keep your Family Username somewhere handy — your kids will need it to log in!",
  },
]

function generateFamilySlug(familyName: string): string {
  const words = familyName.replace(/^the\s+/i, '').replace(/\s+family$/i, '').trim().split(/\s+/)
  const surname = words[words.length - 1].toLowerCase().replace(/[^a-z0-9]/g, '')
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `${surname}-family-${digits}`
}

function toChildUsername(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  const [adminName, setAdminName] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [location, setLocation] = useState('')
  const [currency, setCurrency] = useState('AUD')
  const [familySlug, setFamilySlug] = useState('')

  const [members, setMembers] = useState<Member[]>([])
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'member' | 'child' | 'guest'>('member')
  const [newPin, setNewPin] = useState('')

  const [notifications, setNotifications] = useState(true)
  const [pointsSystem, setPointsSystem] = useState(true)
  const [kioskMode, setKioskMode] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (familyName.trim().length > 2) {
      setFamilySlug(generateFamilySlug(familyName))
    }
  }, [familyName])

  function addMember() {
    if (!newName.trim()) { setError('Please enter a name.'); return }
    if (newRole === 'child') {
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        setError('Please enter a 4-digit PIN for ' + newName.trim())
        return
      }
    } else {
      if (!newEmail.trim() || !newEmail.includes('@')) {
        setError('Please enter a valid email address for ' + newName.trim())
        return
      }
    }
    setMembers([...members, {
      display_name: newName.trim(),
      child_username: toChildUsername(newName.trim()),
      role: newRole,
      email: newRole !== 'child' ? newEmail.trim() : undefined,
      pin: newRole === 'child' ? newPin : undefined,
    }])
    setNewName('')
    setNewEmail('')
    setNewPin('')
    setNewRole('member')
    setError(null)
  }

  function removeMember(i: number) {
    setMembers(members.filter((_, idx) => idx !== i))
  }

  async function handleFinish() {
    setLoading(true)
    setError(null)
    setDebugInfo(null)

    // Step 1: Check session
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    
    if (userErr || !user) {
      setError('Your session has expired. Please sign in again.')
      setLoading(false)
      return
    }

    setDebugInfo(`✓ Logged in as: ${user.email} (${user.id.slice(0,8)}...)`)

    // Step 2: Create family via RPC
    const { data: familyId, error: familyError } = await supabase.rpc('create_family_with_admin', {
      p_user_id: user.id,
      p_family_name: familyName,
      p_slug: familySlug,
      p_currency: currency,
    })

    if (familyError) {
      // Slug collision — regenerate and retry
      if (familyError.code === '23505') {
        const newSlug = generateFamilySlug(familyName)
        setFamilySlug(newSlug)
        const { data: retryId, error: retryError } = await supabase.rpc('create_family_with_admin', {
          p_user_id: user.id,
          p_family_name: familyName,
          p_slug: newSlug,
          p_currency: currency,
        })
        if (retryError) {
          setError(`Family creation failed: ${retryError.message} (code: ${retryError.code})`)
          setLoading(false)
          return
        }
        await finishSetup(user.id, retryId)
      } else {
        setError(`Family creation failed: ${familyError.message} (code: ${familyError.code})`)
        setLoading(false)
        return
      }
    } else {
      if (!familyId) {
        setError('Family creation returned no ID — RPC may have failed silently. Check Supabase logs.')
        setLoading(false)
        return
      }
      setDebugInfo(prev => prev + `\n✓ Family created: ${familyId.toString().slice(0,8)}...`)
      await finishSetup(user.id, familyId)
    }
  }

  async function finishSetup(userId: string, familyId: string) {
    // Update admin display name
    if (adminName.trim()) {
      const { error: updateErr } = await supabase
        .from('family_members')
        .update({ display_name: adminName.trim() })
        .eq('user_id', userId)
        .eq('family_id', familyId)
      
      if (updateErr) {
        setDebugInfo(prev => (prev ?? '') + `\n⚠ Name update error: ${updateErr.message}`)
      } else {
        setDebugInfo(prev => (prev ?? '') + `\n✓ Admin name updated`)
      }
    }

    // Add child members
    for (const m of members) {
      if (m.role === 'child') {
        const childUserId = crypto.randomUUID()
        const { error: childErr } = await supabase.from('family_members').insert({
          family_id: familyId,
          user_id: childUserId,
          display_name: m.display_name,
          child_username: m.child_username,
          avatar_initials: m.display_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
          role: 'child',
          pin_hash: m.pin,
          can_add_tasks: false,
          can_delete_tasks: false,
          can_edit_tasks: false,
          can_complete_tasks: true,
        })
        if (childErr) {
          setDebugInfo(prev => (prev ?? '') + `\n⚠ Child insert error: ${childErr.message}`)
        } else {
          setDebugInfo(prev => (prev ?? '') + `\n✓ Child added: ${m.display_name}`)
        }
      }
    }

    // Mark onboarding complete
    const { error: onboardErr } = await supabase
      .from('families')
      .update({ onboarding_completed: true } as never)
      .eq('id', familyId)

    if (onboardErr) {
      setDebugInfo(prev => (prev ?? '') + `\n⚠ Onboarding flag error: ${onboardErr.message}`)
    } else {
      setDebugInfo(prev => (prev ?? '') + `\n✓ Onboarding complete!`)
    }

    setLoading(false)
    setStep(4)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #E8E4DF',
    borderRadius: '12px', fontSize: '14px', color: '#1A1714',
    background: '#F7F5F2', outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Inter',sans-serif",
  }
  const btnP: React.CSSProperties = {
    flex: 1, padding: '12px 20px', borderRadius: '12px', background: '#1A1714',
    color: '#fff', fontSize: '14px', fontWeight: 700, border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Inter',sans-serif",
  }
  const btnS: React.CSSProperties = {
    flex: 1, padding: '12px 20px', borderRadius: '12px', background: '#F7F5F2',
    color: '#6B6561', fontSize: '14px', fontWeight: 600,
    border: '1.5px solid #E8E4DF', cursor: 'pointer', fontFamily: "'Inter',sans-serif",
  }
  const ROLE_BG: Record<string, string> = { member: '#F5C4B3', child: '#B5D4F4', guest: '#CECBF6' }
  const ROLE_FG: Record<string, string> = { member: '#712B13', child: '#0C447C', guest: '#3C3489' }

  const Toggle = ({ on, onToggle, label, sub }: { on: boolean; onToggle: () => void; label: string; sub: string }) => (
    <div onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
      border: `1.5px solid ${on ? '#1D9E75' : '#E8E4DF'}`,
      background: on ? '#E3F5EF' : '#F7F5F2', marginBottom: '8px', transition: 'all .15s',
    }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: on ? '#1D9E75' : '#1A1714' }}>{label}</div>
        <div style={{ fontSize: '11px', color: on ? '#1D9E75' : '#A09893', marginTop: '2px', opacity: on ? .8 : 1 }}>{sub}</div>
      </div>
      <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: on ? '#1D9E75' : '#E8E4DF', position: 'relative', transition: 'background .15s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '3px', left: on ? '19px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
      </div>
    </div>
  )

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#F7F5F2', fontFamily: "'Inter',sans-serif" }}>
        <div style={{ background: '#fff', border: '1px solid #E8E4DF', borderRadius: '28px', padding: '40px', width: '100%', maxWidth: '520px', boxShadow: '0 8px 40px rgba(0,0,0,.07)' }}>

          <div style={{ marginBottom: '20px' }}>
            <Image src="/Kync_logo.png" alt="KYNC" width={110} height={50} style={{ objectFit: 'contain' }} priority />
          </div>

          {step < 4 && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ height: '6px', borderRadius: '3px', transition: 'all .2s', background: i <= step ? '#1D9E75' : '#E8E4DF', width: i === step ? '24px' : '6px', opacity: i < step ? 0.45 : 1 }} />
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '24px', background: '#F2F1FD', borderRadius: '16px', padding: '16px', border: '1.5px solid #C4BFFE' }}>
            <div style={{ flexShrink: 0 }}>
              <Image src="/KYNCy headshot.png" alt="KYNCy" width={60} height={60} style={{ borderRadius: '50%', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(127,119,221,.25)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>
                KYNCy · Your KYNC Wizard ✨
              </div>
              <div style={{ fontSize: '13px', color: '#3C3489', lineHeight: 1.65, fontWeight: 500 }}>
                {STEPS[step].msg}
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEF0F0', border: '1px solid #F09595', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#A32D2D', marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}

          {debugInfo && (
            <div style={{ background: '#F2F1FD', border: '1px solid #C4BFFE', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#3C3489', marginBottom: '16px', fontFamily: 'monospace', whiteSpace: 'pre-line' }}>
              {debugInfo}
            </div>
          )}

          {/* STEP 0 */}
          {step === 0 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Image src="/KYNCy AI fullsize.png" alt="KYNCy wizard" width={200} height={200} style={{ objectFit: 'contain' }} />
              </div>
              <button onClick={() => setStep(1)} style={{ ...btnP, width: '100%', padding: '14px', fontSize: '15px' }}>
                Let&apos;s get started! 🧙
              </button>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, marginBottom: '18px', letterSpacing: '-0.02em' }}>Tell me about your family!</div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6B6561', marginBottom: '5px' }}>Your name *</label>
                <input type="text" placeholder="e.g. Sarah Jones" value={adminName} onChange={e => setAdminName(e.target.value)} style={inp} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6B6561', marginBottom: '5px' }}>Family name *</label>
                <input type="text" placeholder="e.g. The Jones Family" value={familyName} onChange={e => setFamilyName(e.target.value)} style={inp} />
              </div>
              {familySlug && (
                <div style={{ background: '#F2F1FD', border: '1.5px solid #C4BFFE', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    🏷️ Your family username (auto-generated)
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#3C3489', letterSpacing: '0.02em', marginBottom: '4px' }}>
                    {familySlug}
                  </div>
                  <div style={{ fontSize: '11px', color: '#7F77DD', lineHeight: 1.5 }}>
                    Your kids will use this to log in. Make a note of it!
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6B6561', marginBottom: '5px' }}>Location (optional)</label>
                  <input type="text" placeholder="e.g. Perth, WA" value={location} onChange={e => setLocation(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6B6561', marginBottom: '5px' }}>Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} style={inp}>
                    <option value="AUD">AUD — Australian Dollar</option>
                    <option value="NZD">NZD — New Zealand Dollar</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="CAD">CAD — Canadian Dollar</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button onClick={() => setStep(0)} style={btnS}>Back</button>
                <button onClick={() => {
                  if (!adminName.trim()) { setError('Please enter your name.'); return }
                  if (!familyName.trim()) { setError('Please enter your family name.'); return }
                  setError(null); setStep(2)
                }} style={btnP}>Next →</button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, marginBottom: '18px', letterSpacing: '-0.02em' }}>Now let&apos;s meet the family!</div>
              <div style={{ background: '#F7F5F2', border: '1.5px solid #E8E4DF', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderBottom: members.length > 0 ? '1px solid #E8E4DF' : 'none' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#9FE1CB', color: '#085041', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                    {adminName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ME'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{adminName}</div>
                    <div style={{ fontSize: '11px', color: '#1D9E75', fontWeight: 700 }}>Admin · Email login</div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: '#1A1714', color: '#fff' }}>YOU</span>
                </div>
                {members.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderBottom: i < members.length - 1 ? '1px solid #F0EDE9' : 'none' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: ROLE_BG[m.role], color: ROLE_FG[m.role], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      {m.display_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>{m.display_name}</div>
                      <div style={{ fontSize: '11px', color: ROLE_FG[m.role], fontWeight: 600 }}>
                        {m.role === 'child' ? '🔐 PIN login · ' + familySlug : '📧 ' + (m.email || 'Email invite pending')}
                      </div>
                    </div>
                    <button onClick={() => removeMember(i)} style={{ background: 'none', border: 'none', color: '#A09893', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '4px' }}>×</button>
                  </div>
                ))}
                <div style={{ padding: '12px 14px', borderTop: members.length > 0 ? '1px solid #F0EDE9' : 'none' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginBottom: '8px' }}>
                    <input type="text" placeholder="Full name…" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMember()} style={{ ...inp, padding: '8px 12px', fontSize: '13px' }} />
                    <select value={newRole} onChange={e => { setNewRole(e.target.value as 'member' | 'child' | 'guest'); setNewPin(''); setNewEmail('') }} style={{ ...inp, width: 'auto', padding: '8px 10px', fontSize: '13px' }}>
                      <option value="member">Member</option>
                      <option value="child">Child</option>
                      <option value="guest">Guest</option>
                    </select>
                  </div>
                  {newRole !== 'child' && (
                    <div style={{ marginBottom: '8px' }}>
                      <input type="email" placeholder="Email address (they'll get an invite)" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{ ...inp, padding: '8px 12px', fontSize: '13px' }} />
                      <div style={{ fontSize: '11px', color: '#6B6561', marginTop: '4px' }}>📧 They&apos;ll receive an email invite to create their own login</div>
                    </div>
                  )}
                  {newRole === 'child' && (
                    <div style={{ marginBottom: '8px' }}>
                      <input type="password" placeholder="4-digit PIN (e.g. 1234)" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} inputMode="numeric" style={{ ...inp, padding: '8px 12px', fontSize: '15px', letterSpacing: '0.3em' }} />
                      <div style={{ fontSize: '11px', color: '#7F77DD', marginTop: '4px' }}>🔐 They&apos;ll tap their name on the login screen then enter this PIN</div>
                    </div>
                  )}
                  <button onClick={addMember} style={{ width: '100%', padding: '9px', borderRadius: '10px', border: '1.5px dashed #C4BFFE', background: '#F2F1FD', fontSize: '12px', fontWeight: 700, color: '#7F77DD', cursor: 'pointer' }}>
                    + Add family member
                  </button>
                </div>
              </div>
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#92400E', marginBottom: '20px', lineHeight: 1.6 }}>
                ℹ️ <strong>Adult members</strong> will get an email invite to create their own login.<br />
                🔐 <strong>Children</strong> log in using the family username <strong>{familySlug}</strong> + their name + their 4-digit PIN.
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setStep(1)} style={btnS}>Back</button>
                <button onClick={() => { setError(null); setStep(3) }} style={btnP}>Next →</button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em' }}>A few quick settings!</div>
              <div style={{ fontSize: '13px', color: '#6B6561', marginBottom: '18px', lineHeight: 1.5 }}>Everything can be changed any time from Family Settings.</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#A09893', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Notifications</div>
              <Toggle on={notifications} onToggle={() => setNotifications(!notifications)} label="Event &amp; task reminders" sub="Push notifications before events and when tasks are due" />
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#A09893', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px', marginTop: '16px' }}>Kids dashboard</div>
              <Toggle on={pointsSystem} onToggle={() => setPointsSystem(!pointsSystem)} label="Points &amp; rewards system" sub="Kids earn points for completing chores — set targets and rewards" />
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#A09893', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px', marginTop: '16px' }}>Bills &amp; finances</div>
              <div style={{ background: '#F7F5F2', border: '1.5px solid #E8E4DF', borderRadius: '12px', padding: '12px 14px', marginBottom: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1A1714', marginBottom: '4px' }}>Bill categories</div>
                <div style={{ fontSize: '12px', color: '#6B6561', lineHeight: 1.6 }}>
                  KYNC comes ready with: <strong>Utilities, Insurance, Mortgage/Rent, Subscriptions, School, Medical</strong> and <strong>Other</strong>. You can customise these any time from the Bills section. 💡
                </div>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#A09893', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px', marginTop: '16px' }}>Device &amp; kiosk</div>
              <Toggle on={kioskMode} onToggle={() => setKioskMode(!kioskMode)} label="Wall tablet / kiosk mode" sub="Turn any tablet into a shared family hub — setup guide in Settings" />
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button onClick={() => setStep(2)} style={btnS}>Back</button>
                <button onClick={handleFinish} disabled={loading} style={{ ...btnP, background: loading ? '#6B6561' : '#1D9E75' }}>
                  {loading ? 'Setting up your family…' : 'Finish setup! ✨'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div style={{ textAlign: 'center' }}>
              <Image src="/KYNCy AI fullsize.png" alt="KYNCy" width={180} height={180} style={{ objectFit: 'contain', marginBottom: '8px' }} />
              <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                {familyName} is all set! 🎉
              </div>
              <div style={{ fontSize: '14px', color: '#6B6561', lineHeight: 1.6, marginBottom: '20px' }}>
                I&apos;ve worked my magic! Welcome to KYNC — I&apos;ll always be here when you need me. 🧙✨
              </div>
              <div style={{ background: '#F2F1FD', border: '2px solid #C4BFFE', borderRadius: '16px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                  📌 Keep this safe — your family username
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#3C3489', letterSpacing: '0.02em', marginBottom: '6px' }}>
                  {familySlug}
                </div>
                <div style={{ fontSize: '12px', color: '#7F77DD', lineHeight: 1.5 }}>
                  Your children will need this to log in. It&apos;s also saved in your Family Settings.
                </div>
              </div>
              <div style={{ background: '#F7F5F2', border: '1.5px solid #E8E4DF', borderRadius: '16px', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#A09893', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Setup complete</div>
                {[
                  { show: true, text: `Family "${familyName}" created` },
                  { show: true, text: `Currency set to ${currency}` },
                  { show: members.filter(m => m.role === 'child').length > 0, text: `${members.filter(m => m.role === 'child').length} child${members.filter(m => m.role === 'child').length > 1 ? 'ren' : ''} with PIN login` },
                  { show: members.filter(m => m.role !== 'child').length > 0, text: `${members.filter(m => m.role !== 'child').length} adult invite${members.filter(m => m.role !== 'child').length > 1 ? 's' : ''} pending` },
                  { show: true, text: 'Default bill categories ready' },
                  { show: notifications, text: 'Notifications enabled' },
                  { show: pointsSystem, text: 'Points & rewards system on' },
                  { show: kioskMode, text: 'Kiosk mode noted — setup guide in Settings' },
                ].filter(i => i.show).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid #F0EDE9', fontSize: '13px', fontWeight: 600 }}>
                    <span>✅</span> {item.text}
                  </div>
                ))}
              </div>
              {debugInfo && (
                <div style={{ background: '#F2F1FD', border: '1px solid #C4BFFE', borderRadius: '10px', padding: '10px 14px', fontSize: '11px', color: '#3C3489', marginBottom: '16px', fontFamily: 'monospace', whiteSpace: 'pre-line', textAlign: 'left' }}>
                  {debugInfo}
                </div>
              )}
              <button onClick={() => { window.location.href = '/dashboard' }} style={{ ...btnP, width: '100%', padding: '14px', fontSize: '15px', background: '#1D9E75', flex: 'none' }}>
                Take me to my dashboard! 🏠
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
