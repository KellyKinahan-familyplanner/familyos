'use client'
import { useState } from 'react'
import Image from 'next/image'

type Entry = {
  id: string
  title: string
  date: string
  type: string
  assignees?: string[]
  time_start?: string | null
  notes?: string | null
  subject?: string | null
}

const TYPE_ICON: Record<string, string> = {
  event: 'ti-calendar-event',
  special: 'ti-star',
  task: 'ti-list-check',
  chore: 'ti-home',
  homework: 'ti-book',
  exam: 'ti-writing',
  revision: 'ti-brain',
  bill: 'ti-receipt',
}

const TYPE_COLOR: Record<string, string> = {
  event: '#378ADD',
  special: '#F57C00',
  task: '#1D9E75',
  chore: '#1D9E75',
  homework: '#7F77DD',
  exam: '#DC2626',
  revision: '#7F77DD',
  bill: '#059669',
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long' })
}

function groupByDate(entries: Entry[]) {
  const today = new Date().toISOString().slice(0, 10)
  const map: Record<string, Entry[]> = {}
  entries
    .filter(e => e.date >= today)
    .forEach(e => {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    })
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(0, 30)
}

export default function GuestClient({ displayName, familyName, entries, canViewCalendar, canViewTasks }: {
  displayName: string
  familyName: string
  entries: Entry[]
  canViewCalendar: boolean
  canViewTasks: boolean
}) {
  const [filter, setFilter] = useState<'all' | 'events' | 'tasks'>('all')
  const firstName = displayName.split(' ')[0]

  const filtered = entries.filter(e => {
    if (filter === 'events') return ['event', 'special'].includes(e.type)
    if (filter === 'tasks') return ['task', 'chore', 'homework', 'exam', 'revision'].includes(e.type)
    return true
  })

  const grouped = groupByDate(filtered)

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#F7F5F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1714;}
        .topbar{background:#fff;border-bottom:1px solid #E8E4DF;position:sticky;top:0;z-index:50;padding:0 16px;height:56px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
        .page{max-width:600px;margin:0 auto;padding:20px 16px 60px;}
        .greeting{font-size:22px;font-weight:800;margin-bottom:4px;}
        .sub{font-size:13px;color:#6b6560;margin-bottom:20px;}
        .filter-bar{display:flex;gap:8px;margin-bottom:20px;}
        .filter-btn{padding:7px 14px;border-radius:20px;border:1.5px solid #E8E4DF;background:#fff;font-size:12px;font-weight:700;color:#6b6560;cursor:pointer;transition:all .15s;}
        .filter-btn.active{background:#1a1714;color:#fff;border-color:#1a1714;}
        .date-group{margin-bottom:20px;}
        .date-label{font-size:11px;font-weight:800;color:#9e9994;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px;}
        .entry-card{background:#fff;border:1px solid #E8E4DF;border-radius:14px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:flex-start;gap:12px;}
        .entry-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;}
        .entry-title{font-size:14px;font-weight:700;margin-bottom:2px;}
        .entry-meta{font-size:11px;color:#9e9994;}
        .badge{display:inline-block;padding:2px 7px;border-radius:20px;font-size:10px;font-weight:700;text-transform:capitalize;margin-left:6px;}
        .empty{text-align:center;padding:60px 20px;color:#9e9994;}
        .empty-icon{font-size:48px;margin-bottom:12px;}
        .sign-out-btn{padding:7px 14px;border-radius:20px;border:1.5px solid #E8E4DF;background:#fff;font-size:12px;font-weight:700;color:#6b6560;cursor:pointer;}
      `}</style>

      <nav className="topbar">
        <Image src="/Kync_logo.png" alt="KYNC" width={80} height={30} style={{ objectFit: 'contain' }} />
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#6b6560' }}>{familyName}</div>
        <button className="sign-out-btn" onClick={signOut}>Sign out</button>
      </nav>

      <div className="page">
        <div className="greeting">Hi, {firstName}! 👋</div>
        <div className="sub">
          {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {' · '}Guest view
        </div>

        {(canViewCalendar && canViewTasks) && (
          <div className="filter-bar">
            <button className={`filter-btn${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>All</button>
            {canViewCalendar && <button className={`filter-btn${filter === 'events' ? ' active' : ''}`} onClick={() => setFilter('events')}>Events</button>}
            {canViewTasks && <button className={`filter-btn${filter === 'tasks' ? ' active' : ''}`} onClick={() => setFilter('tasks')}>Tasks</button>}
          </div>
        )}

        {grouped.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📅</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Nothing coming up</div>
            <div style={{ fontSize: 13 }}>No upcoming events or tasks to show.</div>
          </div>
        ) : grouped.map(([date, items]) => {
          const isToday = date === new Date().toISOString().slice(0, 10)
          const isTomorrow = date === new Date(Date.now() + 86400000).toISOString().slice(0, 10)
          const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : formatDate(date)
          return (
            <div key={date} className="date-group">
              <div className="date-label">{label}</div>
              {items.map(e => {
                const color = TYPE_COLOR[e.type] ?? '#6b6560'
                const icon = TYPE_ICON[e.type] ?? 'ti-calendar'
                return (
                  <div key={e.id} className="entry-card">
                    <div className="entry-icon" style={{ background: color + '18', color }}>
                      <i className={`ti ${icon}`} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="entry-title">
                        {e.title}
                        <span className="badge" style={{ background: color + '18', color }}>{e.type}</span>
                      </div>
                      <div className="entry-meta">
                        {e.time_start && <span>{e.time_start.slice(0, 5)} · </span>}
                        {e.assignees?.join(', ')}
                        {e.subject && <span> · {e.subject}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </>
  )
}
