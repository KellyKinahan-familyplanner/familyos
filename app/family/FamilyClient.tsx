'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { FamilyMember } from './page'

const MEMBER_COLOURS = [
  { bg: '#E8F7F2', fg: '#1D9E75' },
  { bg: '#FFF3E0', fg: '#F57C00' },
  { bg: '#E3F2FD', fg: '#1976D2' },
  { bg: '#F3F0FF', fg: '#7F77DD' },
  { bg: '#FEE2E2', fg: '#DC2626' },
  { bg: '#FEF9C3', fg: '#A16207' },
]

type Props = {
  displayName: string
  familyName: string
  familySlug: string
  initials: string
  isAdmin: boolean
  members: FamilyMember[]
}

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --green:#1D9E75;--green-lt:#E8F7F2;
  --text-1:#1A1714;--text-2:#4A4540;--text-3:#A09893;
  --bg:#F5F2EF;--surface:#FFFFFF;--border:#E8E4DF;--border-lt:#F0EDE9;
  --r-sm:6px;--r-md:10px;--r-lg:14px;--r-xl:18px;
  --amber:#D97706;--amber-lt:#FEF3C7;
  --red:#DC2626;--red-lt:#FEE2E2;
  --lilac:#7F77DD;--lilac-lt:#F2F1FD;
}
html,body{min-height:100%;background:var(--bg);font-family:'Inter',sans-serif;color:var(--text-1);font-size:14px;}
button{font-family:inherit;cursor:pointer;border:none;background:none;}
input,select,textarea{font-family:inherit;}
.topbar{position:sticky;top:0;z-index:80;background:rgba(245,242,239,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:0 20px;}
.topbar-inner{max-width:860px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:56px;gap:12px;}
.tb-logo{display:flex;align-items:center;text-decoration:none;}
.tb-nav{display:flex;align-items:center;gap:4px;}
.tb-nav-btn{padding:6px 12px;border-radius:var(--r-sm);font-size:13px;font-weight:600;color:var(--text-2);transition:background .12s,color .12s;display:flex;align-items:center;gap:6px;text-decoration:none;}
.tb-nav-btn:hover{background:var(--border-lt);color:var(--text-1);}
.tb-nav-btn.active{background:var(--text-1);color:#fff;}
.tb-nav-btn i{font-size:15px;}
.tb-right{display:flex;align-items:center;gap:8px;}
.tb-avatar{width:32px;height:32px;border-radius:50%;background:var(--green-lt);color:var(--green);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;}
.page{max-width:860px;margin:0 auto;padding:28px 20px 60px;}
.page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;gap:12px;flex-wrap:wrap;}
.page-title{font-size:22px;font-weight:700;}
.page-sub{font-size:13px;color:var(--text-3);margin-top:3px;}
.add-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:var(--r-md);font-size:13px;font-weight:600;background:var(--green);color:#fff;transition:background .15s;}
.add-btn:hover{background:#178a64;}
.add-btn i{font-size:15px;}
.section{margin-bottom:32px;}
.section-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);margin-bottom:12px;}
.member-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;}
.member-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:18px 16px;display:flex;align-items:center;gap:14px;position:relative;}
.member-avatar{width:48px;height:48px;border-radius:50%;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.member-info{flex:1;min-width:0;}
.member-name{font-size:15px;font-weight:700;color:var(--text-1);}
.member-role{font-size:12px;color:var(--text-3);margin-top:2px;}
.member-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;margin-top:5px;}
.member-badge.admin   {background:var(--green-lt);color:var(--green);}
.member-badge.member  {background:var(--border-lt);color:var(--text-2);}
.member-badge.child   {background:var(--lilac-lt);color:var(--lilac);}
.member-badge.pending {background:var(--amber-lt);color:var(--amber);}
.member-pin{font-size:11px;color:var(--text-3);margin-top:4px;display:flex;align-items:center;gap:4px;}
.member-actions{display:flex;gap:4px;position:absolute;top:10px;right:10px;}
.member-action-btn{width:26px;height:26px;border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--text-3);transition:all .15s;}
.member-action-btn:hover{background:var(--bg);color:var(--text-1);}
.member-action-btn.danger:hover{background:var(--red-lt);color:var(--red);}
.family-info-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:18px 20px;margin-bottom:28px;}
.family-info-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-lt);}
.family-info-row:last-child{border-bottom:none;padding-bottom:0;}
.family-info-row:first-child{padding-top:0;}
.family-info-label{font-size:12px;color:var(--text-3);}
.family-info-value{font-size:13px;font-weight:600;color:var(--text-1);}
.copy-btn{padding:4px 10px;border-radius:var(--r-sm);font-size:11px;font-weight:600;background:var(--bg);color:var(--text-2);transition:all .15s;}
.copy-btn:hover{background:var(--border);}
.modal-backdrop{position:fixed;inset:0;background:rgba(26,23,20,.45);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;}
.modal{background:var(--surface);border-radius:var(--r-xl);width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,.18);}
.modal-head{padding:20px 20px 0;display:flex;align-items:flex-start;justify-content:space-between;}
.modal-title{font-size:17px;font-weight:700;}
.modal-close{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--text-3);font-size:16px;transition:background .12s;}
.modal-close:hover{background:var(--bg);}
.modal-body{padding:16px 20px;}
.modal-kync-logo{height:18px;display:block;margin-bottom:10px;opacity:.9;}
.modal-tabs{display:flex;gap:0;margin-bottom:18px;border:1.5px solid var(--border);border-radius:var(--r-md);overflow:hidden;}
.modal-tab{flex:1;padding:9px;font-size:13px;font-weight:600;color:var(--text-2);background:var(--surface);transition:all .15s;text-align:center;}
.modal-tab.active{background:var(--text-1);color:#fff;}
.form-row{margin-bottom:14px;}
.form-label{font-size:12px;font-weight:600;color:var(--text-2);margin-bottom:5px;display:block;}
.form-input{width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--r-md);font-size:13px;color:var(--text-1);outline:none;transition:border .15s;background:var(--surface);}
.form-input:focus{border-color:var(--green);}
.form-hint{font-size:11px;color:var(--text-3);margin-top:4px;}
.pin-inputs{display:flex;gap:10px;justify-content:center;margin-top:6px;}
.pin-input{width:52px;height:60px;border:2px solid var(--border);border-radius:var(--r-md);font-size:24px;font-weight:700;text-align:center;outline:none;background:var(--surface);color:var(--text-1);transition:border .15s;}
.pin-input:focus{border-color:var(--green);}
.modal-actions{display:flex;gap:8px;justify-content:flex-end;padding:16px 20px;border-top:1px solid var(--border-lt);}
.modal-btn{padding:9px 20px;border-radius:var(--r-md);font-size:13px;font-weight:600;transition:all .15s;}
.modal-btn-secondary{background:var(--bg);color:var(--text-2);}
.modal-btn-secondary:hover{background:var(--border);}
.modal-btn-primary{background:var(--green);color:#fff;}
.modal-btn-primary:hover{background:#178a64;}
.info-box{background:var(--amber-lt);border-radius:var(--r-md);padding:10px 12px;font-size:12px;color:#92400E;margin-bottom:14px;line-height:1.5;}
.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(10px);background:var(--text-1);color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;font-weight:600;opacity:0;transition:all .25s;z-index:200;pointer-events:none;white-space:nowrap;}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
.empty-state{text-align:center;padding:32px;color:var(--text-3);}
.empty-state i{font-size:28px;display:block;margin-bottom:8px;}
@media(max-width:580px){.member-grid{grid-template-columns:1fr;}}
`

export default function FamilyClient({ displayName, familyName, familySlug, initials, isAdmin, members: initialMembers }: Props) {
  const [members, setMembers]     = useState<FamilyMember[]>(initialMembers)
  const [modal, setModal]         = useState<'add' | null>(null)
  const [tab, setTab]             = useState<'child' | 'adult'>('child')
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  // Child form
  const [childName, setChildName] = useState('')
  const [pin, setPin]             = useState(['', '', '', ''])

  // Adult form
  const [adultName, setAdultName] = useState('')
  const [adultEmail, setAdultEmail] = useState('')

  useEffect(() => {
    const s = document.createElement('style')
    s.id = 'kync-family-css'
    s.textContent = CSS
    if (!document.getElementById('kync-family-css')) document.head.appendChild(s)
    return () => document.getElementById('kync-family-css')?.remove()
  }, [])

  useEffect(() => {
    if (!toastVisible) return
    const t = setTimeout(() => setToastVisible(false), 2600)
    return () => clearTimeout(t)
  }, [toastVisible])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const showToast = (msg: string) => { setToast(msg); setToastVisible(true) }

  const resetForms = () => {
    setChildName(''); setPin(['', '', '', ''])
    setAdultName(''); setAdultEmail('')
  }

  const handlePinInput = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...pin]
    next[i] = val.slice(-1)
    setPin(next)
    if (val && i < 3) {
      document.getElementById(`pin-${i + 1}`)?.focus()
    }
  }

  const handlePinKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[i] && i > 0) {
      document.getElementById(`pin-${i - 1}`)?.focus()
    }
  }

  const addChild = async () => {
    if (!childName.trim()) { showToast('Enter a name'); return }
    const pinStr = pin.join('')
    if (pinStr.length !== 4) { showToast('Enter a 4-digit PIN'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/members/add-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: childName.trim(), pin: pinStr }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Failed'); return }
      setMembers(prev => [...prev, data])
      setModal(null); resetForms()
      showToast(`${childName.trim()} added ✓`)
    } finally { setSaving(false) }
  }

  const inviteAdult = async () => {
    if (!adultName.trim()) { showToast('Enter a name'); return }
    if (!adultEmail.trim()) { showToast('Enter an email'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/members/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: adultName.trim(), email: adultEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Failed'); return }
      setMembers(prev => [...prev, data.member])
      setModal(null); resetForms()
      showToast(`Invite sent to ${adultEmail.trim()} ✓`)
    } finally { setSaving(false) }
  }

  const removeMember = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the family?`)) return
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMembers(prev => prev.filter(m => m.id !== id))
      showToast(`${name} removed`)
    }
  }

  const copySlug = () => {
    navigator.clipboard.writeText(familySlug)
    showToast('Family username copied ✓')
  }

  const admins   = members.filter(m => m.role === 'admin')
  const adults   = members.filter(m => m.role === 'member')
  const children = members.filter(m => m.role === 'child')
  const pending  = members.filter(m => m.invite_status === 'pending')

  const renderMember = (m: FamilyMember, i: number) => {
    const col = MEMBER_COLOURS[i % MEMBER_COLOURS.length]
    const isPending = m.invite_status === 'pending'
    return (
      <div key={m.id} className="member-card">
        <div className="member-avatar" style={{ background: col.bg, color: col.fg }}>
          {m.avatar_initials}
        </div>
        <div className="member-info">
          <div className="member-name">{m.display_name}</div>
          {m.role === 'admin' && <span className="member-badge admin"><i className="ti ti-shield-check" style={{ fontSize: 10 }} />Admin</span>}
          {m.role === 'member' && !isPending && <span className="member-badge member"><i className="ti ti-user" style={{ fontSize: 10 }} />Adult</span>}
          {isPending && <span className="member-badge pending"><i className="ti ti-mail" style={{ fontSize: 10 }} />Invite pending</span>}
          {m.role === 'child' && <span className="member-badge child"><i className="ti ti-star" style={{ fontSize: 10 }} />Child</span>}
          {m.role === 'child' && m.child_username && (
            <div className="member-pin"><i className="ti ti-lock" style={{ fontSize: 10 }} />@{m.child_username}</div>
          )}
          {isPending && m.invite_email && (
            <div className="member-pin"><i className="ti ti-at" style={{ fontSize: 10 }} />{m.invite_email}</div>
          )}
        </div>
        {isAdmin && m.role !== 'admin' && (
          <div className="member-actions">
            <button className="member-action-btn danger" onClick={() => removeMember(m.id, m.display_name)} title="Remove">
              <i className="ti ti-trash" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <nav className="topbar">
        <div className="topbar-inner">
          <Link href="/dashboard" className="tb-logo">
            <Image src="/Kync_logo.png" alt="KYNC" width={60} height={22} />
          </Link>
          <div className="tb-nav">
            <Link href="/dashboard" className="tb-nav-btn"><i className="ti ti-layout-dashboard" />Dashboard</Link>
            <Link href="/calendar" className="tb-nav-btn"><i className="ti ti-calendar" />Calendar</Link>
            <Link href="/tasks" className="tb-nav-btn"><i className="ti ti-circle-check" />Tasks</Link>
            <Link href="/family" className="tb-nav-btn active"><i className="ti ti-users" />Family</Link>
          </div>
          <div className="tb-right">
            <div className="tb-avatar">{initials}</div>
          </div>
        </div>
      </nav>

      <main className="page">
        <div className="page-header">
          <div>
            <div className="page-title">Family members</div>
            <div className="page-sub">{familyName} · {members.length} member{members.length !== 1 ? 's' : ''}</div>
          </div>
          {isAdmin && (
            <button className="add-btn" onClick={() => { resetForms(); setModal('add') }}>
              <i className="ti ti-user-plus" />Add member
            </button>
          )}
        </div>

        {/* Family info */}
        <div className="family-info-card">
          <div className="family-info-row">
            <span className="family-info-label">Family name</span>
            <span className="family-info-value">{familyName}</span>
          </div>
          <div className="family-info-row">
            <span className="family-info-label">Family username</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="family-info-value">{familySlug}</span>
              <button className="copy-btn" onClick={copySlug}>Copy</button>
            </div>
          </div>
          <div className="family-info-row">
            <span className="family-info-label">Members</span>
            <span className="family-info-value">{members.length} · {pending.length > 0 ? `${pending.length} invite pending` : 'all active'}</span>
          </div>
        </div>

        {/* Admin */}
        {admins.length > 0 && (
          <div className="section">
            <div className="section-label">Admin</div>
            <div className="member-grid">{admins.map((m, i) => renderMember(m, i))}</div>
          </div>
        )}

        {/* Adults */}
        {(adults.length > 0 || isAdmin) && (
          <div className="section">
            <div className="section-label">Adults</div>
            {adults.length === 0
              ? <div className="empty-state"><i className="ti ti-user-plus" /><p>No adult members yet — invite a partner or family member above.</p></div>
              : <div className="member-grid">{adults.map((m, i) => renderMember(m, admins.length + i))}</div>
            }
          </div>
        )}

        {/* Children */}
        <div className="section">
          <div className="section-label">Children</div>
          {children.length === 0
            ? <div className="empty-state"><i className="ti ti-star" /><p>No children added yet — use Add member above.</p></div>
            : <div className="member-grid">{children.map((m, i) => renderMember(m, admins.length + adults.length + i))}</div>
          }
        </div>
      </main>

      {/* Add member modal */}
      {modal === 'add' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <Image src="/Kync_logo.png" alt="KYNC" width={48} height={18} className="modal-kync-logo" />
                <div className="modal-title">Add family member</div>
              </div>
              <button className="modal-close" onClick={() => setModal(null)}><i className="ti ti-x" /></button>
            </div>
            <div className="modal-body">
              <div className="modal-tabs">
                <div className={`modal-tab${tab === 'child' ? ' active' : ''}`} onClick={() => setTab('child')}>
                  Child (PIN login)
                </div>
                <div className={`modal-tab${tab === 'adult' ? ' active' : ''}`} onClick={() => setTab('adult')}>
                  Adult (email invite)
                </div>
              </div>

              {tab === 'child' ? (
                <>
                  <div className="form-row">
                    <label className="form-label">Child&apos;s name</label>
                    <input className="form-input" placeholder="e.g. Emma" autoFocus
                      value={childName} onChange={e => setChildName(e.target.value)} />
                  </div>
                  <div className="form-row">
                    <label className="form-label">4-digit PIN</label>
                    <div className="pin-inputs">
                      {pin.map((digit, i) => (
                        <input
                          key={i}
                          id={`pin-${i}`}
                          className="pin-input"
                          type="password"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handlePinInput(i, e.target.value)}
                          onKeyDown={e => handlePinKeyDown(i, e)}
                        />
                      ))}
                    </div>
                    <p className="form-hint" style={{ textAlign: 'center', marginTop: 8 }}>
                      They&apos;ll use this PIN along with the family username to log in.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="info-box">
                    <strong>Heads up:</strong> the invited person will receive an email from Supabase with a link to set their password and join {familyName}.
                  </div>
                  <div className="form-row">
                    <label className="form-label">Their name</label>
                    <input className="form-input" placeholder="e.g. Alex" autoFocus
                      value={adultName} onChange={e => setAdultName(e.target.value)} />
                  </div>
                  <div className="form-row">
                    <label className="form-label">Email address</label>
                    <input className="form-input" type="email" placeholder="alex@example.com"
                      value={adultEmail} onChange={e => setAdultEmail(e.target.value)} />
                  </div>
                </>
              )}
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="modal-btn modal-btn-primary" disabled={saving}
                onClick={tab === 'child' ? addChild : inviteAdult}>
                {saving ? 'Saving…' : tab === 'child' ? 'Add child' : 'Send invite'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toastVisible ? ' show' : ''}`}>{toast}</div>
    </>
  )
}
