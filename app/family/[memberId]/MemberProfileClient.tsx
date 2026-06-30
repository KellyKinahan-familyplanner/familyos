'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'

type Feed = { id: string; name: string; url: string; colour: string; last_synced: string | null }

const AVATAR_PRESETS = [
  { bg: '#E8F7F2', fg: '#1D9E75' },
  { bg: '#FFF3E0', fg: '#F57C00' },
  { bg: '#E3F2FD', fg: '#1976D2' },
  { bg: '#F3F0FF', fg: '#7F77DD' },
  { bg: '#FEE2E2', fg: '#DC2626' },
  { bg: '#FEF9C3', fg: '#A16207' },
  { bg: '#FCE7F3', fg: '#BE185D' },
  { bg: '#ECFDF5', fg: '#059669' },
]

type Member = {
  id: string
  display_name: string
  role: string
  avatar_initials: string | null
  avatar_colour_bg: string | null
  avatar_colour_fg: string | null
  avatar_url: string | null
  points_total: number
  points_target: number | null
  reward_description: string | null
  bedtime: string | null
  wake_time: string | null
  screen_time_mins: number | null
  child_username: string | null
}

export default function MemberProfileClient({ member: initial, isAdmin, isSelf, initialFeeds }: {
  member: Member
  isAdmin: boolean
  isSelf: boolean
  initialFeeds: Feed[]
}) {
  const [member, setMember] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinSaving, setPinSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Calendar feeds
  const [feeds, setFeeds] = useState<Feed[]>(initialFeeds)
  const [feedName, setFeedName] = useState('')
  const [feedUrl, setFeedUrl] = useState('')
  const [feedColour, setFeedColour] = useState('#378ADD')
  const [feedSaving, setFeedSaving] = useState(false)
  const [feedSyncing, setFeedSyncing] = useState(false)

  const addFeed = async () => {
    if (!feedName.trim() || !feedUrl.trim()) { showToast('Enter a name and URL'); return }
    setFeedSaving(true)
    const res = await fetch('/api/calendar-feeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: feedName.trim(), url: feedUrl.trim(), colour: feedColour, member_id: member.id }),
    })
    setFeedSaving(false)
    if (!res.ok) { showToast('Could not add feed'); return }
    const data = await res.json()
    setFeeds(prev => [...prev, data])
    setFeedName(''); setFeedUrl(''); setFeedColour('#378ADD')
    showToast('Calendar connected')
  }

  const removeFeed = async (id: string) => {
    if (!confirm('Remove this calendar and its imported events?')) return
    await fetch('/api/calendar-feeds', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setFeeds(prev => prev.filter(f => f.id !== id))
    showToast('Calendar removed')
  }

  const syncFeed = async (id?: string) => {
    setFeedSyncing(true)
    await fetch('/api/calendar-feeds/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(id ? { feed_id: id } : { member_id: member.id }) })
    setFeedSyncing(false)
    // Refresh feed list to update last_synced
    const res = await fetch(`/api/calendar-feeds?member_id=${member.id}`)
    if (res.ok) setFeeds(await res.json())
    showToast('Synced')
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const patch = async (updates: Record<string, unknown>) => {
    setSaving(true)
    const res = await fetch(`/api/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setSaving(false)
    if (!res.ok) { showToast('Save failed'); return false }
    const data = await res.json()
    setMember(prev => ({ ...prev, ...data }))
    showToast('Saved')
    return true
  }

  const uploadAvatar = async (file: File) => {
    setUploading(true)
    const fd = new FormData()
    fd.append('avatar', file)
    const res = await fetch(`/api/members/${member.id}/avatar`, { method: 'POST', body: fd })
    setUploading(false)
    if (!res.ok) { showToast('Upload failed'); return }
    const { avatar_url } = await res.json()
    setMember(prev => ({ ...prev, avatar_url }))
    showToast('Photo updated')
  }

  const removeAvatar = async () => {
    if (!confirm('Remove photo and go back to initials?')) return
    const res = await fetch(`/api/members/${member.id}/avatar`, { method: 'DELETE' })
    if (!res.ok) { showToast('Could not remove photo'); return }
    setMember(prev => ({ ...prev, avatar_url: null }))
    showToast('Photo removed')
  }

  const resetPin = async () => {
    if (newPin.length < 4) { showToast('PIN must be at least 4 digits'); return }
    if (newPin !== confirmPin) { showToast('PINs do not match'); return }
    setPinSaving(true)
    const res = await fetch(`/api/members/${member.id}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: newPin }),
    })
    setPinSaving(false)
    if (!res.ok) { showToast('PIN reset failed'); return }
    setNewPin(''); setConfirmPin('')
    showToast('PIN updated')
  }

  const deleteMember = async () => {
    if (!confirm(`Remove ${member.display_name} from the family? This cannot be undone.`)) return
    const res = await fetch(`/api/members/${member.id}`, { method: 'DELETE' })
    if (res.ok) window.location.href = '/family'
    else showToast('Could not remove member')
  }

  const isChild = member.role === 'child'
  const av = member.avatar_initials || member.display_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const bg = member.avatar_colour_bg || '#E8F7F2'
  const fg = member.avatar_colour_fg || '#1D9E75'

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg,#F5F4F0);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1714;}
        :root{--surface:#fff;--bg:#F5F4F0;--border:#E8E6E1;--border-lt:#F0EDE8;--text-1:#1a1714;--text-2:#6b6560;--text-3:#9e9994;--green:#1D9E75;--green-lt:#E8F7F2;--red:#DC2626;--red-lt:#FEE2E2;--r-md:10px;--r-lg:14px;--r-xl:18px;}
        .topbar{background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50;}
        .topbar-inner{max-width:600px;margin:0 auto;padding:0 16px;height:56px;display:flex;align-items:center;gap:12px;}
        .back-btn{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--text-2);font-size:18px;cursor:pointer;transition:background .12s;}
        .back-btn:hover{background:var(--bg);}
        .topbar-title{font-weight:700;font-size:16px;flex:1;}
        .page{max-width:600px;margin:0 auto;padding:20px 16px 60px;}
        .profile-header{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);padding:24px 20px;display:flex;align-items:center;gap:16px;margin-bottom:20px;}
        .av-wrap{position:relative;flex-shrink:0;width:72px;height:72px;}
        .profile-av{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;object-fit:cover;}
        .av-upload-btn{position:absolute;bottom:0;right:0;width:22px;height:22px;background:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;cursor:pointer;border:2px solid var(--surface);}
        .av-upload-btn:hover{background:#178a64;}
        .profile-name{font-size:20px;font-weight:800;line-height:1.2;}
        .profile-sub{font-size:13px;color:var(--text-2);margin-top:4px;}
        .role-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:700;margin-top:6px;}
        .role-badge.admin{background:var(--green-lt);color:var(--green);}
        .role-badge.child{background:#FFF3E0;color:#F57C00;}
        .role-badge.member{background:#E3F2FD;color:#1976D2;}
        .remove-photo-btn{font-size:11px;color:var(--text-3);background:none;border:none;cursor:pointer;margin-top:4px;display:block;text-decoration:underline;}
        .section{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);margin-bottom:16px;overflow:hidden;}
        .section-title{font-size:11px;font-weight:800;color:var(--text-3);letter-spacing:.06em;padding:16px 18px 0;}
        .field-row{padding:14px 18px;border-bottom:1px solid var(--border-lt);display:flex;align-items:center;gap:12px;}
        .field-row:last-child{border-bottom:none;}
        .field-label{font-size:13px;color:var(--text-2);width:130px;flex-shrink:0;}
        .field-input{flex:1;font-size:14px;font-weight:600;border:none;outline:none;background:transparent;color:var(--text-1);}
        .field-input:focus{color:var(--green);}
        .field-unit{font-size:13px;color:var(--text-3);}
        .save-btn{padding:8px 16px;background:var(--green);color:#fff;border:none;border-radius:var(--r-md);font-size:13px;font-weight:700;cursor:pointer;transition:opacity .15s;}
        .save-btn:disabled{opacity:.5;cursor:not-allowed;}
        .colour-grid{display:flex;flex-wrap:wrap;gap:10px;padding:14px 18px;}
        .colour-swatch{width:36px;height:36px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;border:3px solid transparent;transition:all .12s;}
        .colour-swatch.sel{border-color:var(--text-1);}
        .points-bar-wrap{padding:14px 18px;}
        .points-bar-bg{height:8px;background:var(--border);border-radius:4px;overflow:hidden;margin-top:8px;}
        .points-bar-fill{height:100%;background:var(--green);border-radius:4px;transition:width .4s;}
        .points-label{display:flex;justify-content:space-between;font-size:12px;color:var(--text-2);margin-top:6px;}
        .danger-zone{background:var(--surface);border:1px solid #fecaca;border-radius:var(--r-xl);padding:16px 18px;margin-top:24px;}
        .danger-title{font-size:11px;font-weight:800;color:var(--red);letter-spacing:.06em;margin-bottom:12px;}
        .danger-btn{padding:10px 18px;background:var(--red-lt);color:var(--red);border:none;border-radius:var(--r-md);font-size:13px;font-weight:700;cursor:pointer;}
        .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1714;color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;font-weight:600;z-index:999;pointer-events:none;opacity:0;transition:opacity .2s;}
        .toast.show{opacity:1;}
        .pin-inputs{display:flex;gap:10px;padding:14px 18px;}
        .pin-input{flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:var(--r-md);font-size:16px;letter-spacing:4px;text-align:center;outline:none;}
        .pin-input:focus{border-color:var(--green);}
        .initials-input{width:80px;padding:10px;border:1.5px solid var(--border);border-radius:var(--r-md);font-size:16px;font-weight:800;text-align:center;outline:none;text-transform:uppercase;}
        .initials-input:focus{border-color:var(--green);}
        .uploading-overlay{position:absolute;inset:0;border-radius:50%;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;}
      `}</style>

      <nav className="topbar">
        <div className="topbar-inner">
          <div className="back-btn" onClick={() => window.history.back()}><i className="ti ti-arrow-left" /></div>
          <div className="topbar-title">{member.display_name}</div>
        </div>
      </nav>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = '' }} />

      <div className="page">
        {/* Profile header */}
        <div className="profile-header">
          <div style={{ flexShrink: 0 }}>
            <div className="av-wrap">
              {member.avatar_url ? (
                <Image src={member.avatar_url} alt={member.display_name} width={72} height={72}
                  className="profile-av" style={{ borderRadius: '50%' }} unoptimized />
              ) : (
                <div className="profile-av" style={{ background: bg, color: fg }}>{av}</div>
              )}
              {isAdmin && (
                <div className="av-upload-btn" onClick={() => fileRef.current?.click()} title="Upload photo">
                  {uploading ? <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} /> : <i className="ti ti-camera" />}
                </div>
              )}
              {uploading && <div className="uploading-overlay">...</div>}
            </div>
            {isAdmin && member.avatar_url && (
              <button className="remove-photo-btn" onClick={removeAvatar}>Remove photo</button>
            )}
          </div>
          <div>
            <div className="profile-name">{member.display_name}</div>
            {isChild && member.child_username && <div className="profile-sub">@{member.child_username} · PIN login</div>}
            <div className={`role-badge ${member.role}`}>{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</div>
          </div>
        </div>

        {/* Points & Rewards */}
        <div className="section">
          <div className="section-title">POINTS & REWARDS</div>
          <div className="points-bar-wrap">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 28, fontWeight: 800 }}>{member.points_total ?? 0}</span>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                {member.points_target ? `/ ${member.points_target} pts target` : 'pts earned'}
              </span>
            </div>
            {member.points_target && member.points_target > 0 && (
              <div className="points-bar-bg">
                <div className="points-bar-fill" style={{ width: `${Math.min(100, ((member.points_total ?? 0) / member.points_target) * 100)}%` }} />
              </div>
            )}
            {member.points_target && member.points_target > 0 && (
              <div className="points-label">
                <span>{Math.round(((member.points_total ?? 0) / member.points_target) * 100)}% to reward</span>
                <span>{Math.max(0, member.points_target - (member.points_total ?? 0))} pts to go</span>
              </div>
            )}
          </div>
          {isAdmin && (
            <>
              <div className="field-row">
                <span className="field-label">Points target</span>
                <input className="field-input" type="number" min={0} placeholder="e.g. 100"
                  defaultValue={member.points_target ?? ''} id="pts-target" />
                <span className="field-unit">pts</span>
              </div>
              <div className="field-row">
                <span className="field-label">Reward</span>
                <input className="field-input" type="text" placeholder="e.g. Movie night"
                  defaultValue={member.reward_description ?? ''} id="reward-desc" />
              </div>
              <div className="field-row" style={{ justifyContent: 'flex-end' }}>
                <button className="save-btn" disabled={saving} onClick={() => patch({
                  points_target: parseInt((document.getElementById('pts-target') as HTMLInputElement).value) || null,
                  reward_description: (document.getElementById('reward-desc') as HTMLInputElement).value.trim() || null,
                })}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Display name, initials & avatar colour */}
        {isAdmin && (
          <div className="section">
            <div className="section-title">PROFILE</div>
            <div className="field-row">
              <span className="field-label">Display name</span>
              <input className="field-input" type="text" defaultValue={member.display_name} id="disp-name" />
            </div>
            {!member.avatar_url && (
              <>
                <div className="field-row">
                  <span className="field-label">Initials</span>
                  <input className="initials-input" type="text" maxLength={2} defaultValue={member.avatar_initials ?? av} id="av-initials" />
                </div>
                <div style={{ padding: '12px 18px 4px', fontSize: 13, color: 'var(--text-2)' }}>Avatar colour</div>
                <div className="colour-grid">
                  {AVATAR_PRESETS.map((p, i) => (
                    <div key={i} className={`colour-swatch${bg === p.bg ? ' sel' : ''}`}
                      style={{ background: p.bg, color: p.fg }}
                      onClick={() => patch({ avatar_colour_bg: p.bg, avatar_colour_fg: p.fg })}>
                      {av}
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="field-row" style={{ justifyContent: 'flex-end' }}>
              <button className="save-btn" disabled={saving} onClick={() => patch({
                display_name: (document.getElementById('disp-name') as HTMLInputElement).value.trim() || member.display_name,
                avatar_initials: !member.avatar_url
                  ? ((document.getElementById('av-initials') as HTMLInputElement)?.value.trim().toUpperCase().slice(0, 2) || av)
                  : undefined,
              })}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Schedule */}
        {isAdmin && (
          <div className="section">
            <div className="section-title">SCHEDULE</div>
            <div className="field-row">
              <span className="field-label">Bedtime</span>
              <input className="field-input" type="time" defaultValue={member.bedtime ?? ''} id="bedtime" />
            </div>
            <div className="field-row">
              <span className="field-label">Wake time</span>
              <input className="field-input" type="time" defaultValue={member.wake_time ?? ''} id="wake-time" />
            </div>
            <div className="field-row" style={{ justifyContent: 'flex-end' }}>
              <button className="save-btn" disabled={saving} onClick={() => patch({
                bedtime: (document.getElementById('bedtime') as HTMLInputElement).value || null,
                wake_time: (document.getElementById('wake-time') as HTMLInputElement).value || null,
              })}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Screen time */}
        {isAdmin && (
          <div className="section">
            <div className="section-title">SCREEN TIME</div>
            <div className="field-row">
              <span className="field-label">Daily limit</span>
              <input className="field-input" type="number" min={0} max={1440} placeholder="e.g. 120"
                defaultValue={member.screen_time_mins ?? ''} id="screen-mins" />
              <span className="field-unit">mins/day</span>
            </div>
            <div className="field-row" style={{ justifyContent: 'flex-end' }}>
              <button className="save-btn" disabled={saving} onClick={() => patch({
                screen_time_mins: parseInt((document.getElementById('screen-mins') as HTMLInputElement).value) || null,
              })}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* PIN reset — children only */}
        {isChild && isAdmin && (
          <div className="section">
            <div className="section-title">RESET PIN</div>
            <div className="pin-inputs">
              <input className="pin-input" type="password" inputMode="numeric" maxLength={8} placeholder="New PIN"
                value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} />
              <input className="pin-input" type="password" inputMode="numeric" maxLength={8} placeholder="Confirm"
                value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className="field-row" style={{ justifyContent: 'flex-end' }}>
              <button className="save-btn" disabled={pinSaving || newPin.length < 4} onClick={resetPin}>
                {pinSaving ? 'Resetting...' : 'Reset PIN'}
              </button>
            </div>
          </div>
        )}

        {/* Personal Calendar Sync — visible to admin or the member themselves */}
        {(isAdmin || isSelf) && (
          <div className="section">
            <div className="section-title">PERSONAL CALENDARS</div>
            <div style={{ padding: '10px 18px 4px', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
              Connect {member.display_name}&apos;s personal Google Calendar, Outlook, Apple or other iCal feed. Events will appear on the family calendar filtered to this member.
            </div>

            {/* Provider hint cards */}
            <div style={{ display: 'flex', gap: 8, padding: '10px 18px', overflowX: 'auto' }}>
              {[
                { icon: '📅', label: 'Google', hint: 'Settings → calendar → Secret iCal address', color: '#4285F4' },
                { icon: '📆', label: 'Outlook', hint: 'Calendar settings → Shared calendars → ICS link', color: '#0078D4' },
                { icon: '🍎', label: 'Apple', hint: 'iCloud.com → Calendar → share → Public Calendar', color: '#555' },
                { icon: '🟦', label: 'Square', hint: 'Appointments → Calendar → Share → iCal link', color: '#006AFF' },
              ].map(p => (
                <div key={p.label} title={p.hint}
                  style={{ flexShrink: 0, background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 12px', cursor: 'pointer', textAlign: 'center', minWidth: 70 }}
                  onClick={() => !feedName && setFeedName(`${member.display_name.split(' ')[0]}'s ${p.label}`)}>
                  <div style={{ fontSize: 20 }}>{p.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: p.color, marginTop: 3 }}>{p.label}</div>
                </div>
              ))}
            </div>

            {/* Existing feeds */}
            {feeds.length > 0 && (
              <div style={{ padding: '4px 18px 0' }}>
                {feeds.map(f => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-lt)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: f.colour, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {f.last_synced ? `Synced ${new Date(f.last_synced).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}` : 'Never synced'}
                      </div>
                    </div>
                    <button disabled={feedSyncing} onClick={() => syncFeed(f.id)}
                      style={{ background: 'var(--green-lt)', border: 'none', color: 'var(--green)', borderRadius: 'var(--r-md)', padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {feedSyncing ? '…' : '↻'}
                    </button>
                    <button onClick={() => removeFeed(f.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: 4 }}>
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add feed form */}
            <div className="field-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
              <input style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 13, outline: 'none', background: 'var(--bg)' }}
                type="text" placeholder={`e.g. ${member.display_name.split(' ')[0]}'s Google Calendar`}
                value={feedName} onChange={e => setFeedName(e.target.value)} />
              <input style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 12, outline: 'none', background: 'var(--bg)', fontFamily: 'monospace' }}
                type="url" placeholder="https://calendar.google.com/calendar/ical/..."
                value={feedUrl} onChange={e => setFeedUrl(e.target.value)} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="color" value={feedColour} onChange={e => setFeedColour(e.target.value)}
                  style={{ width: 44, height: 36, padding: 2, border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', cursor: 'pointer' }} />
                <span style={{ fontSize: 12, color: 'var(--text-3)', flex: 1 }}>Calendar colour</span>
                <button className="save-btn" disabled={feedSaving || !feedName.trim() || !feedUrl.trim()} onClick={addFeed}>
                  {feedSaving ? 'Adding...' : '+ Connect'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Danger zone */}
        {isAdmin && member.role !== 'admin' && (
          <div className="danger-zone">
            <div className="danger-title">DANGER ZONE</div>
            <button className="danger-btn" onClick={deleteMember}>
              <i className="ti ti-trash" style={{ marginRight: 6 }} />Remove {member.display_name} from family
            </button>
          </div>
        )}
      </div>

      <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  )
}
