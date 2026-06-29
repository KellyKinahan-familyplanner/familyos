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
.form-input{width:100%;padding:14px;min-height:52px;border:1.5px solid var(--border);border-radius:var(--r-md);font-size:15px;color:var(--text-1);outline:none;transition:border .15s;background:var(--surface);}
.form-input:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(29,158,117,.12);}
.form-hint{font-size:11px;color:var(--text-3);margin-top:4px;}
.pin-inputs{display:flex;gap:12px;justify-content:center;margin-top:6px;}
.pin-input{width:64px;height:72px;border:2px solid var(--border);border-radius:var(--r-md);font-size:28px;font-weight:700;text-align:center;outline:none;background:var(--surface);color:var(--text-1);transition:border .15s;font-size:16px !important;}
.pin-input:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(29,158,117,.12);}
/* Override global font-size rule for PIN display — show large digit visually */
.pin-input{font-size:28px !important;}
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
@media(max-width:580px){
  .member-grid{grid-template-columns:1fr;}
  .topbar{padding:0 14px;}
  .tb-nav{display:none;}
  .page{padding:20px 14px 100px;}
  .page-header{flex-direction:column;align-items:flex-start;}
  .add-btn{width:100%;}
  .member-card{padding:14px;}
  .family-info-row{flex-direction:column;align-items:flex-start;gap:4px;}
}
`

export default function FamilyClient({ displayName, familyName, familySlug, initials, isAdmin, members: initialMembers }: Props) {
  const [members, setMembers]     = useState<FamilyMember[]>(initialMembers)
  const [modal, setModal]         = useState<'add' | null>(null)
  const [editMember, setEditMember] = useState<FamilyMember | null>(null)
  const [editName, setEditName]   = useState('')
  const [editFeedUrl, setEditFeedUrl] = useState('')
  const [editFeedName, setEditFeedName] = useState('')
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

  // Calendar feeds
  const [feeds, setFeeds]               = useState<any[]>([])
  const [feedName, setFeedName]         = useState('')
  const [feedUrl, setFeedUrl]           = useState('')
  const [feedColour, setFeedColour]     = useState('#378ADD')
  const [feedSyncing, setFeedSyncing]   = useState(false)

  // Special events
  const [specials, setSpecials]         = useState<any[]>([])
  const [specTitle, setSpecTitle]       = useState('')
  const [specType, setSpecType]         = useState('birthday')
  const [specDate, setSpecDate]         = useState('')
  const [specEndDate, setSpecEndDate]   = useState('')
  const [specRecur, setSpecRecur]       = useState('none')

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
    fetch('/api/calendar-feeds').then(r => r.json()).then(d => { if (Array.isArray(d)) setFeeds(d) }).catch(() => {})
    fetch('/api/entries').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setSpecials(d.filter((e: any) => ['birthday','school-holiday','family-holiday','public-holiday'].includes(e.type)))
    }).catch(() => {})
  }, [])

  async function addFeed() {
    if (!feedName.trim() || !feedUrl.trim()) { showToast('Enter a name and URL'); return }
    setSaving(true)
    const res = await fetch('/api/calendar-feeds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: feedName.trim(), url: feedUrl.trim(), colour: feedColour }) })
    const data = await res.json()
    if (!res.ok) { showToast(data.error || 'Failed'); setSaving(false); return }
    setFeeds(f => [...f, data])
    setFeedName(''); setFeedUrl(''); setFeedColour('#378ADD')
    showToast('Feed added — syncing now…')
    setSaving(false)
    syncFeed(data.id)
  }

  async function removeFeed(id: string) {
    if (!confirm('Remove this calendar feed and its imported events?')) return
    await fetch('/api/calendar-feeds', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setFeeds(f => f.filter(x => x.id !== id))
    showToast('Feed removed')
  }

  async function syncFeed(id?: string) {
    setFeedSyncing(true)
    const res = await fetch('/api/calendar-feeds/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(id ? { feed_id: id } : {}) })
    const data = await res.json()
    showToast(data.synced > 0 ? `Synced ${data.synced} events ✓` : 'No new events found')
    setFeedSyncing(false)
    if (id) setFeeds(f => f.map(x => x.id === id ? { ...x, last_synced: new Date().toISOString() } : x))
  }

  async function addSpecialEvent() {
    if (!specTitle.trim() || !specDate) { showToast('Enter a title and date'); return }
    setSaving(true)
    const body: any = { title: specTitle.trim(), date: specDate, type: specType, colour: specType === 'birthday' ? 'pink' : specType === 'school-holiday' ? 'blue' : specType === 'family-holiday' ? 'green' : 'amber', assignees: ['Everyone'], recur: specRecur === 'yearly' ? 'yearly' : 'none', notes: specEndDate ? `Until ${specEndDate}` : undefined }
    const res = await fetch('/api/entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) { showToast(data.error || 'Failed'); setSaving(false); return }
    setSpecials(s => [...s, data])
    setSpecTitle(''); setSpecDate(''); setSpecEndDate(''); setSpecRecur('none')
    showToast(`${specType === 'birthday' ? '🎂' : specType === 'school-holiday' ? '🏫' : '🌴'} ${specTitle} added`)
    setSaving(false)
  }

  async function removeSpecial(id: string | number) {
    await fetch(`/api/entries/${id}`, { method: 'DELETE' })
    setSpecials(s => s.filter(x => x.id !== id))
    showToast('Removed')
  }

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

  const openEdit = (m: FamilyMember) => {
    setEditMember(m)
    setEditName(m.display_name)
    setEditFeedUrl('')
    setEditFeedName(m.display_name + "'s Calendar")
  }

  const saveMemberName = async () => {
    if (!editMember || !editName.trim()) return
    setSaving(true)
    const res = await fetch(`/api/members/${editMember.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: editName.trim(),
        avatar_initials: editName.trim().split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase(),
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { showToast(data.error || 'Failed to save'); return }
    setMembers(prev => prev.map(m => m.id === editMember.id ? { ...m, display_name: data.display_name, avatar_initials: data.avatar_initials } : m))
    showToast(`${data.display_name} updated ✓`)
    setEditMember(null)
  }

  const addPersonalFeed = async () => {
    if (!editMember || !editFeedUrl.trim()) { showToast('Enter a calendar URL'); return }
    setSaving(true)
    const res = await fetch('/api/calendar-feeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editFeedName.trim() || editMember.display_name + "'s Calendar", url: editFeedUrl.trim(), colour: '#378ADD', member_id: editMember.id }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { showToast(data.error || 'Failed'); return }
    setFeeds(f => [...f, data])
    setEditFeedUrl('')
    showToast('Calendar feed added ✓')
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
        <div className="member-actions">
          {isAdmin && (
            <button className="member-action-btn" onClick={() => openEdit(m)} title="Edit">
              <i className="ti ti-pencil" />
            </button>
          )}
          {isAdmin && m.role !== 'admin' && (
            <button className="member-action-btn danger" onClick={() => removeMember(m.id, m.display_name)} title="Remove">
              <i className="ti ti-trash" />
            </button>
          )}
        </div>
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

        {/* ── Special Events & Holidays ── */}
        <div className="section" style={{ marginTop: 28 }}>
          <div className="section-label">✨ Special Events &amp; Holidays</div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.5 }}>
            Birthdays, school holidays, and family holidays appear as emoji icons on the calendar with a soft background shade.
          </p>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr', marginBottom: 12 }}>
            <div className="modal-field" style={{ margin: 0 }}>
              <label>Title</label>
              <input type="text" placeholder="e.g. Mia's Birthday" value={specTitle} onChange={e => setSpecTitle(e.target.value)} />
            </div>
            <div className="modal-field" style={{ margin: 0 }}>
              <label>Type</label>
              <select value={specType} onChange={e => setSpecType(e.target.value)}>
                <option value="birthday">🎂 Birthday</option>
                <option value="school-holiday">🏫 School holiday</option>
                <option value="family-holiday">🌴 Family holiday</option>
                <option value="public-holiday">🎉 Public holiday</option>
              </select>
            </div>
            <div className="modal-field" style={{ margin: 0 }}>
              <label>Start date</label>
              <input type="date" value={specDate} onChange={e => setSpecDate(e.target.value)} />
            </div>
            <div className="modal-field" style={{ margin: 0 }}>
              <label>End date <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>(optional)</span></label>
              <input type="date" value={specEndDate} onChange={e => setSpecEndDate(e.target.value)} />
            </div>
            <div className="modal-field" style={{ margin: 0 }}>
              <label>Repeat</label>
              <select value={specRecur} onChange={e => setSpecRecur(e.target.value)}>
                <option value="none">One-off</option>
                <option value="yearly">Every year</option>
              </select>
            </div>
          </div>
          <button className="modal-btn modal-btn-primary" style={{ marginBottom: 16 }} onClick={addSpecialEvent} disabled={saving}>
            {saving ? 'Adding…' : '+ Add special event'}
          </button>
          {specials.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {specials.map(s => {
                const emoji = s.type === 'birthday' ? '🎂' : s.type === 'school-holiday' ? '🏫' : s.type === 'family-holiday' ? '🌴' : '🎉'
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg)', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)' }}>
                    <span style={{ fontSize: 18 }}>{emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.date}{s.recur !== 'none' ? ' · Repeats yearly' : ''}</div>
                    </div>
                    {isAdmin && <button onClick={() => removeSpecial(s.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: 4 }}><i className="ti ti-trash" /></button>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Connected Calendars ── */}
        <div className="section" style={{ marginTop: 28, marginBottom: 40 }}>
          <div className="section-label">🔗 Connected Calendars</div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.5 }}>
            Paste an iCal URL from Google Calendar, Outlook, or Square Appointments. Events sync automatically each time you open the calendar.
          </p>
          <div style={{ background: 'var(--amber-lt)', borderRadius: 'var(--r-md)', padding: '10px 12px', fontSize: 12, color: '#92400E', marginBottom: 14, lineHeight: 1.5 }}>
            <strong>How to get your iCal URL:</strong><br />
            <b>Google Calendar:</b> Settings → your calendar → "Secret address in iCal format"<br />
            <b>Outlook:</b> Calendar settings → Shared calendars → Publish → ICS link<br />
            <b>Square Appointments:</b> Dashboard → Appointments → Calendar → Share → Copy iCal link
          </div>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr', marginBottom: 8 }}>
            <div className="modal-field" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <label>Calendar name</label>
              <input type="text" placeholder="e.g. Kelly's Google Calendar" value={feedName} onChange={e => setFeedName(e.target.value)} />
            </div>
            <div className="modal-field" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <label>iCal URL</label>
              <input type="url" placeholder="https://calendar.google.com/calendar/ical/..." value={feedUrl} onChange={e => setFeedUrl(e.target.value)} style={{ fontFamily: 'monospace', fontSize: 11 }} />
            </div>
            <div className="modal-field" style={{ margin: 0 }}>
              <label>Colour</label>
              <input type="color" value={feedColour} onChange={e => setFeedColour(e.target.value)} style={{ height: 44, padding: 4 }} />
            </div>
          </div>
          <button className="modal-btn modal-btn-primary" style={{ marginBottom: 16 }} onClick={addFeed} disabled={saving || feedSyncing}>
            {saving ? 'Adding…' : '+ Connect calendar'}
          </button>
          {feeds.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {feeds.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg)', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: f.colour, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{f.last_synced ? `Last synced ${new Date(f.last_synced).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}` : 'Never synced'}</div>
                  </div>
                  <button onClick={() => syncFeed(f.id)} disabled={feedSyncing} style={{ background: 'var(--green-lt)', border: 'none', color: 'var(--green)', borderRadius: 'var(--r-md)', padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {feedSyncing ? '…' : '↻ Sync'}
                  </button>
                  {isAdmin && <button onClick={() => removeFeed(f.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: 4 }}><i className="ti ti-trash" /></button>}
                </div>
              ))}
              <button onClick={() => syncFeed()} disabled={feedSyncing} style={{ alignSelf: 'flex-start', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--text-2)' }}>
                {feedSyncing ? 'Syncing all…' : '↻ Sync all feeds'}
              </button>
            </div>
          )}
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

      {/* Edit member modal */}
      {editMember && (
        <div className="modal-backdrop" onClick={() => setEditMember(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <Image src="/Kync_logo.png" alt="KYNC" width={48} height={18} className="modal-kync-logo" />
                <div className="modal-title">Edit — {editMember.display_name}</div>
              </div>
              <button className="modal-close" onClick={() => setEditMember(null)}><i className="ti ti-x" /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label className="form-label">Display name</label>
                <input className="form-input" autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                  placeholder={editMember.display_name} />
              </div>
              <div className="modal-actions" style={{ padding: '0 0 16px 0', border: 'none', justifyContent: 'flex-start' }}>
                <button className="modal-btn modal-btn-secondary" onClick={() => setEditMember(null)}>Cancel</button>
                <button className="modal-btn modal-btn-primary" disabled={saving || !editName.trim()} onClick={saveMemberName}>
                  {saving ? 'Saving…' : 'Save name'}
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--border-lt)', paddingTop: 16, marginTop: 4 }}>
                <div className="section-label" style={{ marginBottom: 10 }}>Personal calendar sync</div>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.5 }}>
                  Paste a personal iCal / Google Calendar URL to sync {editMember.display_name}&apos;s events into KYNC.
                </p>
                {feeds.filter(f => f.member_id === editMember.id).map(f => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg)', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: f.colour, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{f.last_synced ? `Synced ${new Date(f.last_synced).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}` : 'Never synced'}</div>
                    </div>
                    <button onClick={() => syncFeed(f.id)} disabled={feedSyncing} style={{ background: 'var(--green-lt)', border: 'none', color: 'var(--green)', borderRadius: 'var(--r-md)', padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {feedSyncing ? '…' : '↻ Sync'}
                    </button>
                    <button onClick={() => removeFeed(f.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: 4 }}><i className="ti ti-trash" /></button>
                  </div>
                ))}
                <div className="form-row" style={{ marginBottom: 8 }}>
                  <label className="form-label">Feed name</label>
                  <input className="form-input" value={editFeedName} onChange={e => setEditFeedName(e.target.value)} placeholder={`${editMember.display_name}'s Calendar`} />
                </div>
                <div className="form-row" style={{ marginBottom: 12 }}>
                  <label className="form-label">iCal URL</label>
                  <input className="form-input" value={editFeedUrl} onChange={e => setEditFeedUrl(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/ical/..." />
                </div>
                <button className="modal-btn modal-btn-primary" disabled={saving || !editFeedUrl.trim()} onClick={addPersonalFeed}>
                  {saving ? 'Adding…' : '+ Connect calendar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toastVisible ? ' show' : ''}`}>{toast}</div>
    </>
  )
}
