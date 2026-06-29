'use client'
import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'

/* ─── Types ─────────────────────────────────────────────────── */
type EntryType = 'task' | 'chore' | 'homework' | 'exam' | 'revision'

type Entry = {
  id: string
  title: string
  date: string
  time?: string
  type: EntryType
  assignees: string[]
  colour: string
  notes?: string
  subject?: string
  completed: boolean
  recur: string
  recurDays?: string[]
  recurEnd?: string
  recurEndDate?: string
}

type Member = {
  id: string
  name: string
  initials: string
  bg: string
  fg: string
}

type Props = {
  displayName: string
  familyName: string
  initials: string
  userEmail: string
  familyMembers: Member[]
}

/* ─── CSS ────────────────────────────────────────────────────── */
const TASKS_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --green:#1D9E75;--green-lt:#E8F7F2;
  --text-1:#1A1714;--text-2:#4A4540;--text-3:#A09893;
  --bg:#F5F2EF;--surface:#FFFFFF;--border:#E8E4DF;--border-lt:#F0EDE9;
  --r-sm:6px;--r-md:10px;--r-lg:14px;--r-xl:18px;
  --amber:#D97706;--amber-lt:#FEF3C7;
  --red:#DC2626;--red-lt:#FEE2E2;
  --lilac:#7F77DD;--lilac-lt:#F2F1FD;
  --blue:#1976D2;--blue-lt:#E3F2FD;
}
html,body{height:100%;background:var(--bg);font-family:'Inter',sans-serif;color:var(--text-1);font-size:14px;}
button{font-family:inherit;cursor:pointer;border:none;background:none;}
input,select,textarea{font-family:inherit;}

/* Topbar */
.topbar{position:sticky;top:0;z-index:80;background:rgba(245,242,239,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:0 20px;}
.topbar-inner{max-width:1080px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:56px;gap:12px;}
.tb-logo{display:flex;align-items:center;text-decoration:none;}
.tb-nav{display:flex;align-items:center;gap:4px;}
.tb-nav-btn{padding:6px 12px;border-radius:var(--r-sm);font-size:13px;font-weight:600;color:var(--text-2);transition:background .12s,color .12s;display:flex;align-items:center;gap:6px;text-decoration:none;}
.tb-nav-btn:hover{background:var(--border-lt);color:var(--text-1);}
.tb-nav-btn.active{background:var(--text-1);color:#fff;}
.tb-nav-btn i{font-size:15px;}
.tb-right{display:flex;align-items:center;gap:8px;}
.tb-avatar{width:32px;height:32px;border-radius:50%;background:var(--green-lt);color:var(--green);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;}

/* Page layout */
.page{max-width:1080px;margin:0 auto;padding:24px 20px 80px;}
.page-header{margin-bottom:24px;}
.page-title{font-size:22px;font-weight:700;color:var(--text-1);}
.page-sub{font-size:13px;color:var(--text-3);margin-top:2px;}

/* Filter bar */
.filter-bar{display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap;}
.filter-pill{padding:5px 14px;border-radius:20px;font-size:12px;font-weight:600;border:1.5px solid var(--border);background:var(--surface);color:var(--text-2);cursor:pointer;transition:all .15s;}
.filter-pill:hover{border-color:var(--text-3);}
.filter-pill.active{background:var(--text-1);color:#fff;border-color:var(--text-1);}
.filter-pill.type-task.active{background:#1976D2;border-color:#1976D2;}
.filter-pill.type-chore.active{background:#1D9E75;border-color:#1D9E75;}
.filter-pill.type-homework.active{background:#7F77DD;border-color:#7F77DD;}
.filter-pill.type-exam.active{background:#DC2626;border-color:#DC2626;}
.filter-pill.type-revision.active{background:#D97706;border-color:#D97706;}
.filter-sep{width:1px;height:20px;background:var(--border);}
.member-pill-filter{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;cursor:pointer;border:2.5px solid transparent;transition:all .15s;}
.member-pill-filter.active{border-color:var(--text-1);}

/* Search */
.search-wrap{position:relative;margin-bottom:20px;}
.search-wrap i{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-3);font-size:15px;}
.search-input{width:100%;padding:9px 12px 9px 36px;border:1.5px solid var(--border);border-radius:var(--r-md);font-size:13px;background:var(--surface);color:var(--text-1);outline:none;transition:border .15s;}
.search-input:focus{border-color:var(--green);}

/* Section */
.section{margin-bottom:28px;}
.section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.section-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);}
.section-count{font-size:11px;color:var(--text-3);}

/* Task card */
.task-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;display:flex;align-items:flex-start;gap:12px;margin-bottom:8px;transition:box-shadow .15s;}
.task-card:hover{box-shadow:0 2px 8px rgba(0,0,0,.06);}
.task-card.done{opacity:.55;}
.task-check{width:20px;height:20px;border-radius:50%;border:2px solid var(--border);flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;margin-top:1px;}
.task-check:hover{border-color:var(--green);}
.task-check.checked{background:var(--green);border-color:var(--green);}
.task-check.checked i{color:#fff;font-size:10px;}
.task-body{flex:1;min-width:0;}
.task-title{font-size:14px;font-weight:600;color:var(--text-1);line-height:1.3;}
.task-title.done{text-decoration:line-through;color:var(--text-3);}
.task-meta{display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap;}
.task-type-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;}
.task-type-badge.task    {background:var(--blue-lt);color:var(--blue);}
.task-type-badge.chore   {background:var(--green-lt);color:var(--green);}
.task-type-badge.homework{background:var(--lilac-lt);color:var(--lilac);}
.task-type-badge.exam    {background:var(--red-lt);color:var(--red);}
.task-type-badge.revision{background:var(--amber-lt);color:var(--amber);}
.task-date{font-size:12px;color:var(--text-3);}
.task-date.overdue{color:var(--red);font-weight:600;}
.task-date.due-soon{color:var(--amber);font-weight:600;}
.task-assignees{display:flex;gap:3px;flex-wrap:wrap;}
.task-avatar{width:20px;height:20px;border-radius:50%;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;}
.task-recur{font-size:11px;color:var(--text-3);display:flex;align-items:center;gap:3px;}
.task-notes{font-size:12px;color:var(--text-2);margin-top:6px;line-height:1.5;background:var(--bg);border-radius:var(--r-sm);padding:6px 8px;}
.task-actions{display:flex;gap:6px;flex-shrink:0;}
.task-btn{width:28px;height:28px;border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--text-3);transition:all .15s;}
.task-btn:hover{background:var(--bg);color:var(--text-1);}
.task-btn.danger:hover{background:var(--red-lt);color:var(--red);}

/* Empty */
.empty-state{text-align:center;padding:48px 20px;color:var(--text-3);}
.empty-state i{font-size:36px;display:block;margin-bottom:10px;}
.empty-state p{font-size:14px;}

/* FAB */
.fab{position:fixed;bottom:28px;right:24px;z-index:70;}
.fab-btn{width:52px;height:52px;border-radius:50%;background:var(--green);color:#fff;font-size:22px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(29,158,117,.35);transition:transform .15s,box-shadow .15s;}
.fab-btn:hover{transform:scale(1.06);box-shadow:0 6px 20px rgba(29,158,117,.4);}
.fab-menu{position:absolute;bottom:60px;right:0;display:flex;flex-direction:column;gap:8px;align-items:flex-end;}
.fab-item{display:flex;align-items:center;gap:10px;cursor:pointer;animation:fabIn .18s ease both;}
@keyframes fabIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.fab-item-label{background:var(--text-1);color:#fff;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;white-space:nowrap;}
.fab-item-icon{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.18);}

/* Modal */
.modal-backdrop{position:fixed;inset:0;background:rgba(26,23,20,.45);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;}
.modal{background:var(--surface);border-radius:var(--r-xl);width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.18);}
.modal-head{padding:20px 20px 0;display:flex;align-items:flex-start;justify-content:space-between;}
.modal-title{font-size:17px;font-weight:700;}
.modal-close{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--text-3);font-size:16px;transition:background .12s;}
.modal-close:hover{background:var(--bg);}
.modal-body{padding:16px 20px;}
.modal-kync-logo{height:18px;display:block;margin-bottom:10px;opacity:.9;}
.form-row{margin-bottom:14px;}
.form-label{font-size:12px;font-weight:600;color:var(--text-2);margin-bottom:5px;display:block;}
.form-input{width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--r-md);font-size:13px;color:var(--text-1);outline:none;transition:border .15s;background:var(--surface);}
.form-input:focus{border-color:var(--green);}
.form-row-2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
.role-pills{display:flex;gap:6px;flex-wrap:wrap;}
.role-pill{padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;border:1.5px solid var(--border);background:var(--surface);color:var(--text-2);cursor:pointer;transition:all .15s;}
.role-pill.sel{background:var(--text-1);color:#fff;border-color:var(--text-1);}
.recur-pills{display:flex;gap:6px;}
.recur-pill{padding:5px 14px;border-radius:20px;font-size:12px;font-weight:600;border:1.5px solid var(--border);background:var(--surface);color:var(--text-2);cursor:pointer;transition:all .15s;}
.recur-pill.sel{background:var(--text-1);color:#fff;border-color:var(--text-1);}
.recur-extra{margin-top:10px;padding:12px;background:var(--bg);border-radius:var(--r-md);}
.recur-extra-label{font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;}
.day-pills{display:flex;gap:5px;flex-wrap:wrap;}
.day-pill{padding:4px 10px;border-radius:14px;font-size:11px;font-weight:600;border:1.5px solid var(--border);background:var(--surface);color:var(--text-2);cursor:pointer;transition:all .15s;}
.day-pill.sel{background:var(--text-1);color:#fff;border-color:var(--text-1);}
.modal-actions{display:flex;gap:8px;justify-content:flex-end;padding:16px 20px;border-top:1px solid var(--border-lt);}
.modal-btn{padding:9px 20px;border-radius:var(--r-md);font-size:13px;font-weight:600;transition:all .15s;}
.modal-btn-secondary{background:var(--bg);color:var(--text-2);}
.modal-btn-secondary:hover{background:var(--border);}
.modal-btn-primary{background:var(--green);color:#fff;}
.modal-btn-primary:hover{background:#178a64;}

/* Toast */
.toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(10px);background:var(--text-1);color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;font-weight:600;opacity:0;transition:all .25s;z-index:200;pointer-events:none;white-space:nowrap;}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0);}

/* Progress bar */
.progress-bar-wrap{background:var(--border-lt);border-radius:10px;height:6px;overflow:hidden;margin-top:4px;}
.progress-bar-fill{height:100%;background:var(--green);border-radius:10px;transition:width .4s ease;}

/* Stats strip */
.stats-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;text-align:center;}
.stat-num{font-size:24px;font-weight:800;color:var(--text-1);}
.stat-label{font-size:11px;color:var(--text-3);margin-top:2px;}
@media(max-width:600px){
  .stats-strip{grid-template-columns:repeat(2,1fr);}
  .filter-bar{gap:6px;}
  .task-card{padding:12px 14px;gap:10px;}
  .task-check{width:24px;height:24px;flex-shrink:0;}
  .task-btn{width:36px;height:36px;}
  .filter-pill{padding:7px 12px;font-size:12px;}
  .member-pill-filter{width:36px;height:36px;}
  .fab{bottom:calc(76px + env(safe-area-inset-bottom));right:16px;}
  .topbar{padding:0 14px;}
  .tb-nav{display:none;}
  .page{padding:20px 14px 100px;}
}
`

/* ─── Helpers ────────────────────────────────────────────────── */
const TYPE_ICONS: Record<string, string> = {
  task: 'ti-circle-check',
  chore: 'ti-home',
  homework: 'ti-books',
  exam: 'ti-school',
  revision: 'ti-pencil',
}
const TYPE_LABELS: Record<string, string> = {
  task: 'Task', chore: 'Chore', homework: 'Homework', exam: 'Exam', revision: 'Revision',
}
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
function dateLabel(dateStr: string): { label: string; state: 'overdue' | 'due-soon' | 'ok' } {
  const today = todayStr()
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const tomStr = tomorrow.toISOString().slice(0, 10)
  if (dateStr < today) return { label: 'Overdue', state: 'overdue' }
  if (dateStr === today) return { label: 'Due today', state: 'due-soon' }
  if (dateStr === tomStr) return { label: 'Due tomorrow', state: 'due-soon' }
  return { label: new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }), state: 'ok' }
}
function recurLabel(e: Entry): string {
  if (e.recur === 'none') return ''
  if (e.recur === 'daily') return 'Daily'
  if (e.recur === 'weekly') return `Weekly${e.recurDays?.length ? ' · ' + e.recurDays.join('/') : ''}`
  return 'Monthly'
}

/* ─── Component ──────────────────────────────────────────────── */
export default function TasksClient({ displayName, familyName, initials, familyMembers }: Props) {
  const today = todayStr()

  /* ── State ── */
  const [entries, setEntries]         = useState<Entry[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [typeFilter, setTypeFilter]   = useState<EntryType | 'all'>('all')
  const [memberFilter, setMemberFilter] = useState<string>('all')
  const [showDone, setShowDone]       = useState(false)
  const [fabOpen, setFabOpen]         = useState(false)
  const [activeModal, setActiveModal] = useState<EntryType | null>(null)
  const [toast, setToast]             = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  /* form state */
  const [fTitle, setFTitle]           = useState('')
  const [fDate, setFDate]             = useState(today)
  const [fTime, setFTime]             = useState('')
  const [fSubject, setFSubject]       = useState('')
  const [fNotes, setFNotes]           = useState('')
  const [fAssignees, setFAssignees]   = useState<string[]>(['Everyone'])
  const [fRecur, setFRecur]           = useState<'none'|'daily'|'weekly'|'monthly'>('none')
  const [fRecurDays, setFRecurDays]   = useState<string[]>([])
  const [fPoints, setFPoints]         = useState('0')

  /* ── CSS injection ── */
  useEffect(() => {
    const s = document.createElement('style')
    s.id = 'kync-tasks-css'
    s.textContent = TASKS_CSS
    if (!document.getElementById('kync-tasks-css')) document.head.appendChild(s)
    return () => document.getElementById('kync-tasks-css')?.remove()
  }, [])

  /* ── Load entries ── */
  useEffect(() => {
    fetch('/api/entries')
      .then(r => r.json())
      .then((rows: Record<string, unknown>[]) => {
        const mapped: Entry[] = rows
          .filter(r => ['task','chore','homework','exam','revision'].includes(r.type as string))
          .map(r => ({
            id:         r.id as string,
            title:      r.title as string,
            date:       r.date as string,
            time:       r.time_start as string | undefined,
            type:       r.type as EntryType,
            assignees:  (r.assignees as string[]) || ['Everyone'],
            colour:     (r.colour as string) || 'green',
            notes:      r.notes as string | undefined,
            subject:    r.subject as string | undefined,
            completed:  (r.completed as boolean) || false,
            recur:      (r.recur as string) || 'none',
            recurDays:  r.recur_days as string[] | undefined,
            recurEnd:   r.recur_end as string | undefined,
            recurEndDate: r.recur_end_date as string | undefined,
          }))
        setEntries(mapped)
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  /* ── ESC closes modal ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setActiveModal(null); setFabOpen(false) } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  /* ── Toast ── */
  useEffect(() => {
    if (!toastVisible) return
    const t = setTimeout(() => setToastVisible(false), 2600)
    return () => clearTimeout(t)
  }, [toastVisible])

  const showToast = (msg: string) => { setToast(msg); setToastVisible(true) }

  /* ── Helpers ── */
  const resetForm = () => {
    setFTitle(''); setFDate(today); setFTime(''); setFSubject(''); setFNotes('')
    setFAssignees(['Everyone']); setFRecur('none'); setFRecurDays([]); setFPoints('0')
  }

  const toggleAssignee = (name: string) => {
    if (name === 'Everyone') { setFAssignees(['Everyone']); return }
    setFAssignees(prev => {
      const without = prev.filter(a => a !== 'Everyone')
      if (without.includes(name)) {
        const next = without.filter(a => a !== name)
        return next.length === 0 ? ['Everyone'] : next
      }
      return [...without, name]
    })
  }

  const toggleDay = (d: string) => {
    setFRecurDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  const toggleComplete = async (id: string, current: boolean) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, completed: !current } : e))
    await fetch(`/api/entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !current }),
    })
  }

  const deleteEntry = async (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
    showToast('Removed')
    await fetch(`/api/entries/${id}`, { method: 'DELETE' })
  }

  const saveEntry = async (type: EntryType, msg: string) => {
    if (!fTitle.trim()) { showToast('Please enter a title'); return }
    const optimistic: Entry = {
      id: `tmp-${Date.now()}`, title: fTitle, date: fDate, time: fTime || undefined,
      type, assignees: fAssignees, colour: type === 'task' ? 'blue' : type === 'chore' ? 'green' : 'purple',
      notes: fNotes || undefined, subject: fSubject || undefined, completed: false,
      recur: fRecur, recurDays: fRecurDays.length ? fRecurDays : undefined,
    }
    setEntries(prev => [...prev, optimistic])
    setActiveModal(null); resetForm(); showToast(msg)
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...optimistic, points: parseInt(fPoints) || 0 }),
      })
      if (res.ok) {
        const saved = await res.json()
        setEntries(prev => prev.map(e => e.id === optimistic.id ? { ...e, id: saved.id } : e))
      }
    } catch { /* keep optimistic */ }
  }

  /* ── Filtered & grouped entries ── */
  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (typeFilter !== 'all' && e.type !== typeFilter) return false
      if (memberFilter !== 'all' && !e.assignees.includes(memberFilter) && !e.assignees.includes('Everyone')) return false
      if (!showDone && e.completed) return false
      if (search && !e.title.toLowerCase().includes(search.toLowerCase()) &&
          !e.subject?.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [entries, typeFilter, memberFilter, showDone, search])

  const overdue    = filtered.filter(e => !e.completed && e.date < today && e.recur === 'none')
  const dueToday   = filtered.filter(e => !e.completed && e.date === today)
  const upcoming   = filtered.filter(e => !e.completed && e.date > today)
  const recurring  = filtered.filter(e => !e.completed && e.recur !== 'none' && e.date <= today)
  const done       = filtered.filter(e => e.completed)

  const totalCount     = entries.filter(e => !e.completed).length
  const completedCount = entries.filter(e => e.completed).length
  const overdueCount   = entries.filter(e => !e.completed && e.date < today && e.recur === 'none').length
  const progress       = totalCount + completedCount > 0
    ? Math.round((completedCount / (totalCount + completedCount)) * 100) : 0

  /* ── Member name list for pills ── */
  const memberNames = familyMembers.map(m => m.name)

  /* ── Render helpers ── */
  const memberForName = (name: string) =>
    familyMembers.find(m => m.name === name)

  const renderCard = (e: Entry) => {
    const { label, state } = dateLabel(e.date)
    const recur = recurLabel(e)
    return (
      <div key={e.id} className={`task-card${e.completed ? ' done' : ''}`}>
        <div
          className={`task-check${e.completed ? ' checked' : ''}`}
          onClick={() => toggleComplete(e.id, e.completed)}
        >
          {e.completed && <i className="ti ti-check" />}
        </div>
        <div className="task-body">
          <div className={`task-title${e.completed ? ' done' : ''}`}>
            {e.title}{e.subject ? ` — ${e.subject}` : ''}
          </div>
          <div className="task-meta">
            <span className={`task-type-badge ${e.type}`}>
              <i className={`ti ${TYPE_ICONS[e.type]}`} style={{ fontSize: 10 }} />
              {TYPE_LABELS[e.type]}
            </span>
            <span className={`task-date ${state}`}>{label}</span>
            {e.time && <span className="task-date">{e.time}</span>}
            {recur && (
              <span className="task-recur">
                <i className="ti ti-refresh" style={{ fontSize: 10 }} />{recur}
              </span>
            )}
            <div className="task-assignees">
              {e.assignees.includes('Everyone')
                ? <div className="task-avatar" style={{ background: '#1A1714', color: '#fff' }}>All</div>
                : e.assignees.map(a => {
                    const m = memberForName(a)
                    return (
                      <div key={a} className="task-avatar"
                        style={{ background: m?.bg || '#eee', color: m?.fg || '#333' }}>
                        {m?.initials || a[0]}
                      </div>
                    )
                  })
              }
            </div>
          </div>
          {e.notes && <div className="task-notes">{e.notes}</div>}
        </div>
        <div className="task-actions">
          <button className="task-btn danger" onClick={() => deleteEntry(e.id)} title="Remove">
            <i className="ti ti-trash" />
          </button>
        </div>
      </div>
    )
  }

  const renderSection = (title: string, items: Entry[], emptyMsg?: string) => {
    if (items.length === 0 && !emptyMsg) return null
    return (
      <div className="section">
        <div className="section-head">
          <span className="section-label">{title}</span>
          <span className="section-count">{items.length}</span>
        </div>
        {items.length === 0
          ? <div className="empty-state"><p>{emptyMsg}</p></div>
          : items.map(renderCard)
        }
      </div>
    )
  }

  /* ── Modal ── */
  const renderModal = (type: EntryType) => {
    const labels: Record<EntryType, { title: string; btn: string; msg: string }> = {
      task:     { title: 'Add task',             btn: 'Add task',     msg: 'Task added ✓' },
      chore:    { title: 'Add chore',            btn: 'Add chore',    msg: 'Chore added ✓' },
      homework: { title: 'Add homework',         btn: 'Add homework', msg: 'Homework added ✓' },
      exam:     { title: 'Add exam',             btn: 'Save exam',    msg: 'Exam added ✓' },
      revision: { title: 'Add revision session', btn: 'Add sessions', msg: 'Revision added ✓' },
    }
    const { title, btn, msg } = labels[type]
    return (
      <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-head">
            <div>
              <Image src="/Kync_logo.png" alt="KYNC" width={48} height={18} className="modal-kync-logo" />
              <div className="modal-title">{title}</div>
            </div>
            <button className="modal-close" onClick={() => setActiveModal(null)}>
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <label className="form-label">Title</label>
              <input className="form-input" placeholder={`${TYPE_LABELS[type]} name`}
                value={fTitle} onChange={e => setFTitle(e.target.value)} autoFocus />
            </div>
            {(type === 'homework' || type === 'exam' || type === 'revision') && (
              <div className="form-row">
                <label className="form-label">Subject</label>
                <input className="form-input" placeholder="e.g. Mathematics"
                  value={fSubject} onChange={e => setFSubject(e.target.value)} />
              </div>
            )}
            <div className="form-row-2">
              <div>
                <label className="form-label">{type === 'exam' ? 'Exam date' : 'Due date'}</label>
                <input className="form-input" type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Time (optional)</label>
                <input className="form-input" type="time" value={fTime} onChange={e => setFTime(e.target.value)} />
              </div>
            </div>
            {type === 'chore' && (
              <div className="form-row">
                <label className="form-label">Points reward</label>
                <input className="form-input" type="number" min="0" max="100" value={fPoints}
                  onChange={e => setFPoints(e.target.value)} />
              </div>
            )}
            <div className="form-row">
              <label className="form-label">Assign to</label>
              <div className="role-pills">
                <div className={`role-pill${fAssignees.includes('Everyone') ? ' sel' : ''}`}
                  onClick={() => toggleAssignee('Everyone')}>Everyone</div>
                {memberNames.map(name => (
                  <div key={name} className={`role-pill${fAssignees.includes(name) ? ' sel' : ''}`}
                    onClick={() => toggleAssignee(name)}>{name}</div>
                ))}
              </div>
            </div>
            {type !== 'exam' && (
              <div className="form-row">
                <label className="form-label">Repeats</label>
                <div className="recur-pills">
                  {(['none','daily','weekly','monthly'] as const).map(r => (
                    <div key={r} className={`recur-pill${fRecur === r ? ' sel' : ''}`}
                      onClick={() => setFRecur(r)}>
                      {r === 'none' ? 'None' : r.charAt(0).toUpperCase() + r.slice(1)}
                    </div>
                  ))}
                </div>
                {fRecur === 'weekly' && (
                  <div className="recur-extra">
                    <div className="recur-extra-label">Repeat on</div>
                    <div className="day-pills">
                      {DAYS.map(d => (
                        <div key={d} className={`day-pill${fRecurDays.includes(d) ? ' sel' : ''}`}
                          onClick={() => toggleDay(d)}>{d}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="form-row">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-input" rows={2} placeholder="Any extra details…"
                value={fNotes} onChange={e => setFNotes(e.target.value)}
                style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-actions">
            <button className="modal-btn modal-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button className="modal-btn modal-btn-primary" onClick={() => saveEntry(type, msg)}>{btn}</button>
          </div>
        </div>
      </div>
    )
  }

  /* ── FAB items ── */
  const FAB_ITEMS: { type: EntryType; label: string; colour: string; icon: string }[] = [
    { type: 'task',     label: 'Add task',             colour: '#1976D2', icon: 'ti-circle-check' },
    { type: 'chore',    label: 'Add chore',            colour: '#1D9E75', icon: 'ti-home' },
    { type: 'homework', label: 'Add homework',         colour: '#7F77DD', icon: 'ti-books' },
    { type: 'exam',     label: 'Add exam',             colour: '#DC2626', icon: 'ti-school' },
    { type: 'revision', label: 'Add revision session', colour: '#D97706', icon: 'ti-pencil' },
  ]

  /* ── Render ── */
  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      {/* Topbar */}
      <nav className="topbar">
        <div className="topbar-inner">
          <Link href="/dashboard" className="tb-logo">
            <Image src="/Kync_logo.png" alt="KYNC" width={60} height={22} />
          </Link>
          <div className="tb-nav">
            <Link href="/dashboard" className="tb-nav-btn"><i className="ti ti-layout-dashboard" />Dashboard</Link>
            <Link href="/calendar" className="tb-nav-btn"><i className="ti ti-calendar" />Calendar</Link>
            <Link href="/tasks" className="tb-nav-btn active"><i className="ti ti-circle-check" />Tasks</Link>
          </div>
          <div className="tb-right">
            <div className="tb-avatar">{initials}</div>
          </div>
        </div>
      </nav>

      {/* Page */}
      <main className="page">
        <div className="page-header">
          <div className="page-title">Tasks &amp; Chores</div>
          <div className="page-sub">{familyName ? `${familyName} · ` : ''}{totalCount} active · {overdueCount > 0 ? `${overdueCount} overdue · ` : ''}{progress}% complete</div>
          <div className="progress-bar-wrap" style={{ marginTop: 10 }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Stats */}
        <div className="stats-strip">
          <div className="stat-card">
            <div className="stat-num">{entries.filter(e => e.type === 'task' && !e.completed).length}</div>
            <div className="stat-label">Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{entries.filter(e => e.type === 'chore' && !e.completed).length}</div>
            <div className="stat-label">Chores</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{entries.filter(e => e.type === 'homework' && !e.completed).length}</div>
            <div className="stat-label">Homework</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{entries.filter(e => e.type === 'exam').length}</div>
            <div className="stat-label">Exams</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          {(['all','task','chore','homework','exam','revision'] as const).map(t => (
            <div key={t}
              className={`filter-pill${t !== 'all' ? ` type-${t}` : ''}${typeFilter === t ? ' active' : ''}`}
              onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All' : TYPE_LABELS[t] + 's'}
            </div>
          ))}
          <div className="filter-sep" />
          <div
            className={`member-pill-filter${memberFilter === 'all' ? ' active' : ''}`}
            style={{ background: '#1A1714', color: '#fff', fontSize: 10 }}
            onClick={() => setMemberFilter('all')}
          >All</div>
          {familyMembers.map(m => (
            <div key={m.id}
              className={`member-pill-filter${memberFilter === m.name ? ' active' : ''}`}
              style={{ background: m.bg, color: m.fg }}
              onClick={() => setMemberFilter(m.name)}
            >{m.initials}</div>
          ))}
          <div className="filter-sep" />
          <div className={`filter-pill${showDone ? ' active' : ''}`} onClick={() => setShowDone(s => !s)}>
            {showDone ? 'Hide done' : 'Show done'}
          </div>
        </div>

        {/* Search */}
        <div className="search-wrap">
          <i className="ti ti-search" />
          <input className="search-input" placeholder="Search tasks, chores, homework…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Content */}
        {loading
          ? <div className="empty-state"><i className="ti ti-loader-2" /><p>Loading…</p></div>
          : filtered.length === 0
            ? <div className="empty-state">
                <i className="ti ti-circle-check" />
                <p>{search ? 'No results found.' : 'Nothing here — add a task with the + button.'}</p>
              </div>
            : <>
                {renderSection('Overdue', overdue)}
                {renderSection('Due today', dueToday)}
                {renderSection('Recurring', recurring)}
                {renderSection('Upcoming', upcoming)}
                {showDone && renderSection('Completed', done)}
              </>
        }
      </main>

      {/* FAB */}
      <div className="fab">
        {fabOpen && (
          <div className="fab-menu">
            {FAB_ITEMS.map((item, i) => (
              <div key={item.type} className="fab-item"
                style={{ animationDelay: `${i * 0.04}s` }}
                onClick={() => { resetForm(); setActiveModal(item.type); setFabOpen(false) }}>
                <div className="fab-item-label">{item.label}</div>
                <div className="fab-item-icon" style={{ background: item.colour }}>
                  <i className={`ti ${item.icon}`} />
                </div>
              </div>
            ))}
          </div>
        )}
        <button className="fab-btn" onClick={() => setFabOpen(o => !o)}>
          <i className={`ti ${fabOpen ? 'ti-x' : 'ti-plus'}`} />
        </button>
      </div>

      {/* Modals */}
      {activeModal && renderModal(activeModal)}

      {/* Toast */}
      <div className={`toast${toastVisible ? ' show' : ''}`}>{toast}</div>
    </>
  )
}
