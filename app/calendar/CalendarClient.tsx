'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
export type CalEvent = {
  id: string | number   // string UUID from Supabase, number for optimistic local adds
  title: string
  date: string        // YYYY-MM-DD
  time?: string
  endTime?: string
  colour: string
  assignees: string[]
  recur: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  recurDays?: string[]          // weekly: ['Mon','Fri']
  recurMonthType?: 'date' | 'day'
  recurMonthDate?: number       // e.g. 15
  recurMonthOrdinal?: string    // 'Last'
  recurMonthDay?: string        // 'Saturday'
  recurEnd?: 'never' | 'on' | 'after'
  recurEndDate?: string
  recurEndCount?: number
  notes?: string
  type: 'event' | 'task' | 'chore' | 'homework' | 'exam' | 'revision' | 'birthday' | 'school-holiday' | 'family-holiday' | 'public-holiday'
}

export type Member = {
  id: string
  name: string
  initials: string
  colour: string    // CSS var name e.g. 'sj'
  bg: string
  fg: string
  avatar_url?: string | null
}

type Props = {
  displayName: string
  familyName: string
  initials: string
  userEmail: string
  familyMembers?: Member[]
}

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
export const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
export const HOURS = Array.from({ length: 24 }, (_, i) => (i + 5) % 24)

export const COLOUR_OPTIONS = [
  { key: 'green',  hex: '#1D9E75', bg: '#E8F7F2', label: 'Family' },
  { key: 'blue',   hex: '#1976D2', bg: '#E3F2FD', label: 'Personal' },
  { key: 'purple', hex: '#7F77DD', bg: '#F2F1FD', label: 'School' },
  { key: 'orange', hex: '#F57C00', bg: '#FFF3E0', label: 'Events' },
  { key: 'amber',  hex: '#D97706', bg: '#FEF3C7', label: 'Bills' },
  { key: 'red',    hex: '#DC2626', bg: '#FEE2E2', label: 'Urgent' },
]

/* ─────────────────────────────────────────
   CSS
───────────────────────────────────────── */
const CALENDAR_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --green:#1D9E75;--green-lt:#E8F7F2;--green-mid:#9FE1CB;
  --pink:#E8497A;--pink-lt:#FDE8EE;--pink-mid:#F4A4BE;
  --text-1:#1A1714;--text-2:#4A4540;--text-3:#A09893;
  --bg:#F5F2EF;--surface:#FFFFFF;--border:#E8E4DF;--border-lt:#F0EDE9;
  --r-sm:6px;--r-md:10px;--r-lg:14px;--r-xl:18px;
  --oj-bg:#FFF3E0;--oj-fg:#E65100;--oj-ac:#F57C00;
  --lj-bg:#E3F2FD;--lj-fg:#1565C0;--lj-ac:#1976D2;
  --sj-bg:#E8F7F2;--sj-fg:#1D9E75;--sj-ac:#1D9E75;
  --fa-bg:#F3F0FF;--fa-fg:#5B4FCF;--fa-ac:#7F77DD;
  --lilac:#7F77DD;--lilac-lt:#F2F1FD;
  --amber:#D97706;--amber-lt:#FEF3C7;
  --mj-bg:#FDE8EE;--mj-ac:#E8497A;
}
html,body{height:100%;overflow:hidden;}
.cal-shell{display:flex;flex-direction:column;height:100vh;background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--text-1);}

/* ── Topbar ── */
.cal-topbar{background:var(--surface);border-bottom:1.5px solid var(--border);padding:0 16px;height:52px;display:flex;align-items:center;gap:10px;flex-shrink:0;z-index:50;}
.cal-topbar-sep{width:1.5px;height:18px;background:var(--border);}
.cal-page-title{font-size:14px;font-weight:800;flex:1;white-space:nowrap;}
.cal-topbar-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:var(--r-md);border:1.5px solid var(--pink-mid);background:var(--green-lt);font-size:12px;font-weight:700;color:var(--pink);cursor:pointer;text-decoration:none;white-space:nowrap;transition:all .15s;}
.cal-topbar-btn:hover{background:var(--pink);color:#fff;border-color:var(--pink);}
.cal-topbar-btn.active{background:var(--pink);color:#fff;border-color:var(--pink);}
.cal-topbar-btn.pink{border-color:var(--pink);background:var(--pink-lt);color:var(--pink);}
.cal-topbar-btn.pink:hover{background:var(--pink);color:#fff;border-color:var(--pink);}

/* ── Member avatar bar ── */
.member-bar{background:var(--surface);border-bottom:1.5px solid var(--border);padding:8px 16px;display:flex;align-items:center;gap:8px;overflow-x:auto;flex-shrink:0;}
.member-bar::-webkit-scrollbar{display:none;}
.member-avatar-btn{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;flex-shrink:0;user-select:none;}
.member-avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:2.5px solid transparent;transition:all .2s;position:relative;}
.member-avatar-btn.active .member-avatar{border-color:var(--text-1);box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--text-1);}
.member-avatar-name{font-size:10px;font-weight:600;color:var(--text-3);transition:color .2s;}
.member-avatar-btn.active .member-avatar-name{color:var(--text-1);}
.member-bar-sep{width:1.5px;height:32px;background:var(--border);margin:0 4px;flex-shrink:0;}

/* ── Toolbar row ── */
.cal-toolbar{background:var(--surface);border-bottom:1px solid var(--border-lt);padding:8px 16px;display:flex;align-items:center;gap:8px;flex-shrink:0;}
.cal-month-nav{display:flex;align-items:center;gap:4px;}
.cal-month-label{font-size:15px;font-weight:800;min-width:155px;text-align:center;}
.cal-icon-btn{width:30px;height:30px;border-radius:var(--r-sm);border:1.5px solid var(--pink-mid);background:var(--green-lt);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;color:var(--pink);transition:all .15s;flex-shrink:0;}
.cal-icon-btn:hover{background:var(--pink);color:#fff;border-color:var(--pink);}
.cal-today-btn{padding:0 10px;font-size:11px;font-weight:700;width:auto;}
.cal-view-tabs{display:flex;gap:2px;background:var(--green-lt);border-radius:var(--r-md);padding:3px;margin-left:auto;border:1px solid var(--pink-mid);}
.cal-view-tab{padding:5px 11px;border-radius:7px;font-size:12px;font-weight:700;color:var(--pink);cursor:pointer;transition:all .15s;user-select:none;}
.cal-view-tab.active{background:var(--pink);color:#fff;box-shadow:0 1px 4px rgba(232,73,122,.25);}

/* ── Legend ── */
.cal-legend{display:flex;align-items:center;gap:10px;padding:6px 16px;background:var(--surface);border-bottom:1px solid var(--border-lt);flex-wrap:wrap;flex-shrink:0;}
.cal-legend-item{display:flex;align-items:center;gap:5px;font-size:10px;color:var(--text-2);font-weight:600;}
.cal-legend-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;}

/* ── Main content area ── */
.cal-content{display:flex;flex:1;overflow:hidden;}
.cal-main{flex:1;overflow:auto;}
.cal-sidebar{width:260px;border-left:1.5px solid var(--border);background:var(--surface);overflow-y:auto;flex-shrink:0;}
@media(max-width:900px){.cal-sidebar{display:none;}}

/* ── Month grid ── */
.cal-grid{min-height:100%;}
.cal-day-headers{display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid var(--border-lt);background:var(--surface);position:sticky;top:0;z-index:10;}
.cal-day-header{padding:8px 0;text-align:center;font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;}
.cal-days{display:grid;grid-template-columns:repeat(7,1fr);}
.cal-cell{min-height:110px;border-right:1px solid var(--border-lt);border-bottom:1px solid var(--border-lt);padding:6px 4px;cursor:pointer;transition:background .1s;position:relative;}
.cal-cell:nth-child(7n){border-right:none;}
.cal-cell:hover{background:#FAFAF9;}
.cal-cell.other-month{opacity:.38;}
.cal-cell.today .cal-date{background:var(--green);color:#fff;border-radius:50%;}
.cal-date{font-size:12px;font-weight:700;width:22px;height:22px;display:flex;align-items:center;justify-content:center;margin-bottom:3px;}
.cal-event-chip{font-size:10px;font-weight:600;padding:2px 5px;border-radius:3px;margin-bottom:2px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:3px;}
.cal-event-chip .chip-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
.cal-event-chip.green{background:var(--green-lt);color:var(--green);}
.cal-event-chip.blue{background:var(--lj-bg);color:var(--lj-ac);}
.cal-event-chip.purple{background:var(--lilac-lt);color:var(--lilac);}
.cal-event-chip.orange{background:var(--oj-bg);color:var(--oj-ac);}
.cal-event-chip.amber{background:var(--amber-lt);color:var(--amber);}
.cal-event-chip.red{background:#FEE2E2;color:#DC2626;}

/* ── Week/Day view ── */
.cal-week-grid{display:flex;min-height:100%;}
.cal-time-col{width:52px;flex-shrink:0;border-right:1px solid var(--border-lt);}
.cal-time-slot{height:60px;display:flex;align-items:flex-start;justify-content:flex-end;padding:2px 6px 0 0;font-size:10px;color:var(--text-3);font-weight:600;}
.cal-week-days{flex:1;display:grid;}
.cal-week-day-header{padding:8px 6px;text-align:center;border-bottom:1px solid var(--border-lt);border-right:1px solid var(--border-lt);background:var(--surface);position:sticky;top:0;z-index:5;}
.cal-week-day-name{font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;}
.cal-week-day-num{font-size:18px;font-weight:800;}
.cal-week-day-num.today{color:var(--green);}
.cal-day-col{border-right:1px solid var(--border-lt);position:relative;}
.cal-hour-row{height:60px;border-bottom:1px solid var(--border-lt);}
.cal-week-event{position:absolute;left:2px;right:2px;border-radius:4px;padding:2px 5px;font-size:10px;font-weight:600;overflow:hidden;cursor:pointer;z-index:2;}

/* ── Today's tasks sidebar ── */
.sidebar-head{padding:12px 14px;border-bottom:1px solid var(--border-lt);font-size:12px;font-weight:800;}
.sidebar-date{font-size:10px;color:var(--text-3);font-weight:600;margin-top:2px;}
.sidebar-section{padding:10px 14px 0;}
.sidebar-section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);margin-bottom:8px;}
.sidebar-task-row{display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;}
.sidebar-check{width:16px;height:16px;border-radius:4px;border:2px solid var(--border);flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-top:1px;transition:all .15s;}
.sidebar-check.done{background:var(--green);border-color:var(--green);}
.sidebar-task-label{font-size:12px;line-height:1.4;}
.sidebar-task-label.done{text-decoration:line-through;color:var(--text-3);}
.sidebar-task-meta{font-size:10px;color:var(--text-3);margin-top:1px;}
.sidebar-empty{padding:12px 14px;font-size:12px;color:var(--text-3);text-align:center;}

/* ── FAB ── */
.cal-fab{position:fixed;bottom:24px;right:20px;z-index:150;}
.cal-fab-btn{width:52px;height:52px;border-radius:50%;background:var(--green);color:#fff;border:none;font-size:22px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(29,158,117,.4);transition:transform .2s,background .15s;}
.cal-fab-btn:hover{background:#178a64;}
.cal-fab-btn.open{transform:rotate(45deg);background:var(--pink);box-shadow:0 4px 16px rgba(232,73,122,.4);}
.cal-fab-menu{position:absolute;bottom:60px;right:0;background:var(--surface);border-radius:var(--r-xl);box-shadow:0 8px 32px rgba(0,0,0,.16);border:1.5px solid var(--border);overflow:hidden;min-width:190px;opacity:0;transform:translateY(10px) scale(.96);pointer-events:none;transition:all .18s cubic-bezier(.34,1.56,.64,1);}
.cal-fab-menu.open{opacity:1;transform:translateY(0) scale(1);pointer-events:all;}
.cal-fab-item{display:flex;align-items:center;gap:10px;padding:11px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:background .12s;}
.cal-fab-item:hover{background:var(--bg);}
.cal-fab-item i{font-size:16px;width:20px;text-align:center;}

/* ── Event detail popover ── */
.event-detail-backdrop{position:fixed;inset:0;z-index:299;}
.event-detail{position:fixed;z-index:300;background:var(--surface);border-radius:var(--r-xl);box-shadow:0 8px 40px rgba(0,0,0,.18);padding:16px;width:280px;border:1.5px solid var(--border);}
.event-detail-close{position:absolute;top:10px;right:10px;width:24px;height:24px;border-radius:50%;border:none;background:var(--bg);cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:var(--text-2);}
.event-detail-title{font-size:14px;font-weight:800;margin-bottom:6px;padding-right:28px;}
.event-detail-row{display:flex;align-items:flex-start;gap:7px;font-size:12px;color:var(--text-2);margin-bottom:5px;line-height:1.4;}
.event-detail-row i{font-size:13px;color:var(--text-3);flex-shrink:0;margin-top:1px;}
.event-detail-actions{display:flex;gap:6px;margin-top:12px;}
.event-detail-btn{flex:1;padding:7px;border-radius:var(--r-md);border:1.5px solid var(--border);background:var(--bg);font-size:11px;font-weight:700;cursor:pointer;color:var(--text-1);}
.event-detail-btn.danger{border-color:#FCA5A5;color:#DC2626;background:#FEF2F2;}

/* ── Modal ── */
.modal-backdrop{position:fixed;inset:0;background:rgba(26,23,20,.45);backdrop-filter:blur(3px);z-index:200;display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .2s;}
.modal-backdrop.open{opacity:1;pointer-events:all;}
@media(min-width:600px){.modal-backdrop{align-items:center;}}
.modal{background:var(--surface);border-radius:20px 20px 0 0;width:100%;max-width:540px;max-height:92vh;overflow-y:auto;padding-bottom:env(safe-area-inset-bottom,16px);box-shadow:0 -4px 40px rgba(0,0,0,.18);transition:transform .25s cubic-bezier(.34,1.56,.64,1);}
@media(min-width:600px){.modal{border-radius:20px;max-height:88vh;}}
.modal-handle{width:36px;height:4px;background:var(--border);border-radius:2px;margin:10px auto 4px;}
.modal-head{padding:14px 16px 10px;border-bottom:1px solid var(--border-lt);}
.modal-head-row{display:flex;align-items:flex-start;justify-content:space-between;}
.modal-title{font-size:17px;font-weight:800;}
.modal-sub{font-size:12px;color:var(--text-3);margin-top:2px;}
.modal-close{width:28px;height:28px;border-radius:50%;border:none;background:var(--bg);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;color:var(--text-2);flex-shrink:0;}
.modal-body{padding:14px 16px;}
.modal-field{margin-bottom:14px;}
.modal-field label{font-size:11px;font-weight:700;color:var(--text-2);text-transform:uppercase;letter-spacing:.07em;display:block;margin-bottom:6px;}
.modal-field input[type=text],.modal-field input[type=date],.modal-field input[type=time],.modal-field input[type=number],.modal-field select,.modal-field textarea{width:100%;padding:14px;min-height:52px;border:1.5px solid var(--border);border-radius:var(--r-md);font-size:16px;background:var(--bg);outline:none;font-family:inherit;color:var(--text-1);transition:border-color .15s;}
.modal-field input:focus,.modal-field select:focus,.modal-field textarea:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(29,158,117,.12);}
.modal-field textarea{min-height:80px;}
.modal-2col{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
.modal-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px;}
.modal-btn{padding:14px 20px;min-height:52px;border-radius:var(--r-lg);font-size:15px;font-weight:700;border:1.5px solid transparent;cursor:pointer;transition:all .15s;}
.modal-btn-secondary{background:var(--green-lt);color:var(--green);border-color:var(--green-mid);}
.modal-btn-secondary:hover{background:var(--green);color:#fff;border-color:var(--green);}
.modal-btn-primary{background:var(--pink);color:#fff;border-color:var(--pink);}
.modal-btn-primary:hover{background:#d43870;border-color:#d43870;}
.modal-kync-logo{height:18px;display:block;margin-bottom:10px;opacity:.9;}
.role-pills{display:flex;flex-wrap:wrap;gap:6px;}
.role-pill{padding:10px 16px;min-height:44px;border-radius:20px;border:1.5px solid var(--pink-mid);font-size:13px;font-weight:600;cursor:pointer;color:var(--pink);background:var(--green-lt);transition:all .15s;user-select:none;display:inline-flex;align-items:center;}
.role-pill.sel{background:var(--pink);color:#fff;border-color:var(--pink);}
.colour-swatches{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;}
.colour-swatch{width:26px;height:26px;border-radius:50%;cursor:pointer;border:2.5px solid transparent;transition:all .15s;}
.colour-swatch.sel{border-color:var(--text-1);box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--text-1);}
.recur-sub{margin-top:10px;padding:10px 12px;background:var(--bg);border-radius:var(--r-md);border:1.5px solid var(--border-lt);}
.recur-sub-label{font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;}
.attach-drop{border:2px dashed var(--border);border-radius:var(--r-md);padding:12px;display:flex;align-items:center;gap:8px;cursor:pointer;transition:border-color .15s;}
.attach-drop:hover{border-color:var(--green);}
.attach-drop input[type=file]{display:none;}

/* ── Toast ── */
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(60px);background:var(--text-1);color:#fff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:20px;z-index:600;opacity:0;transition:transform .28s cubic-bezier(.34,1.56,.64,1),opacity .2s;white-space:nowrap;display:flex;align-items:center;gap:7px;pointer-events:none;}
.toast.show{transform:translateX(-50%) translateY(0);opacity:1;}
.toast i{font-size:15px;color:var(--green);}

/* ── Priority bar ── */
.priority-bar{background:var(--surface);border-bottom:1.5px solid var(--border);padding:8px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;overflow:hidden;}
.priority-bar-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);white-space:nowrap;display:flex;align-items:center;gap:5px;}
.priority-bar-scroll{display:flex;gap:8px;overflow-x:auto;flex:1;}
.priority-bar-scroll::-webkit-scrollbar{display:none;}
.priority-item{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:var(--r-md);border-left:3px solid;white-space:nowrap;cursor:pointer;flex-shrink:0;transition:opacity .15s;}
.priority-item:hover{opacity:.85;}
.priority-item i{font-size:13px;flex-shrink:0;}
.priority-item-title{font-size:11px;font-weight:700;max-width:130px;overflow:hidden;text-overflow:ellipsis;}
.priority-item-meta{font-size:10px;opacity:.75;}
.priority-badge{font-size:9px;font-weight:800;padding:2px 6px;border-radius:10px;letter-spacing:.04em;flex-shrink:0;}

/* ── Special events strip ── */
.special-strip{background:var(--surface);border-bottom:1.5px solid var(--border);padding:6px 16px;display:flex;align-items:center;gap:8px;flex-shrink:0;overflow-x:auto;min-height:36px;}
.special-strip::-webkit-scrollbar{display:none;}
.special-strip-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);white-space:nowrap;flex-shrink:0;}
.special-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;cursor:default;flex-shrink:0;}
.cal-cell-special{position:absolute;top:2px;right:3px;display:flex;gap:2px;}
.cal-day-shade{position:absolute;inset:0;pointer-events:none;border-radius:inherit;}
/* ── Calendar day shading for specials ── */
.cal-cell{position:relative;}

/* ── Mobile touch improvements ── */
@media(max-width:640px){
  .cal-topbar{padding:0 12px;}
  .cal-topbar-right{gap:4px;}
  .member-bar{padding:8px 12px;gap:6px;}
  .cal-toolbar{padding:8px 12px;gap:6px;}
  .view-btn{padding:6px 10px;font-size:12px;}
  .cal-nav-btn{min-width:44px;min-height:44px;}
  .cal-today-btn{min-height:44px;padding:0 12px;}
  .cal-month-label{font-size:13px;min-width:120px;}
  .cal-month-cell{min-height:64px;padding:4px;}
  .cal-month-chip{font-size:10px;padding:2px 4px;}
  .cal-month-day-num{font-size:11px;width:22px;height:22px;}
  .cal-fab{bottom:calc(72px + env(safe-area-inset-bottom));right:16px;}
  .cal-fab-btn{width:52px;height:52px;}
  .member-avatar{width:32px;height:32px;font-size:10px;}
  .cal-time-slot{font-size:10px;width:38px;padding-right:4px;}
  .cal-hour-row{min-height:44px;}
  .modal{border-radius:20px 20px 0 0;max-height:95vh;}
}

/* ── Print / export ── */
@media print{
  .cal-topbar,.member-bar,.cal-toolbar,.cal-legend,.cal-fab,.modal-backdrop,.toast,.cal-sidebar{display:none!important;}
  .cal-content{overflow:visible!important;}
  .cal-main{overflow:visible!important;}
  .cal-shell{height:auto!important;overflow:visible!important;}
  html,body{overflow:visible!important;height:auto!important;}
}
`

/* ─────────────────────────────────────────
   SAMPLE DATA
───────────────────────────────────────── */
function buildSampleEvents(displayName: string): CalEvent[] {
  const first = displayName.split(' ')[0]
  const t = new Date()
  const d = (offset: number) => {
    const x = new Date(t); x.setDate(x.getDate() + offset)
    return x.toISOString().slice(0, 10)
  }
  return [
    { id: 1, title: 'Dentist appointment', date: d(-1), time: '10:00', colour: 'blue', assignees: [first], recur: 'none', type: 'event' },
    { id: 2, title: 'School sports day', date: d(3), time: '', colour: 'orange', assignees: ['Child 1', 'Child 2'], recur: 'none', type: 'event' },
    { id: 3, title: 'Electricity bill due', date: d(5), colour: 'amber', assignees: ['Everyone'], recur: 'monthly', recurMonthType: 'date', recurMonthDate: new Date(d(5)).getDate(), type: 'event' },
    { id: 4, title: 'Family dinner', date: d(0), time: '19:00', colour: 'green', assignees: ['Everyone'], recur: 'none', type: 'event' },
    { id: 5, title: 'Maths exam', date: d(7), time: '09:00', colour: 'purple', assignees: ['Child 1'], recur: 'none', type: 'event' },
    { id: 6, title: 'Make bed', date: d(0), colour: 'green', assignees: ['Child 1', 'Child 2'], recur: 'daily', type: 'chore' },
    { id: 7, title: 'Book car service', date: d(0), colour: 'blue', assignees: [first], recur: 'none', type: 'task' },
    { id: 8, title: 'Chapter 7 worksheet', date: d(2), colour: 'purple', assignees: ['Child 1'], recur: 'none', type: 'homework' },
    { id: 9, title: 'Maths exam', date: d(10), time: '09:00', colour: 'red', assignees: ['Child 1'], recur: 'none', type: 'exam' },
    { id: 10, title: 'Maths revision', date: d(5), colour: 'purple', assignees: ['Child 1'], recur: 'weekly', recurDays: ['Mon','Wed','Fri'], recurEnd: 'on', recurEndDate: d(10), type: 'revision' },
    { id: 11, title: 'Swimming lessons', date: d(1), time: '08:50', endTime: '09:50', colour: 'blue', assignees: ['Child 1'], recur: 'weekly', recurDays: ['Tue','Thu'], recurEnd: 'never', type: 'event' },
  ]
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
export const TYPE_ICONS: Record<string, string> = {
  event:           'ti-calendar-event',
  task:            'ti-circle-check',
  chore:           'ti-home',
  homework:        'ti-books',
  exam:            'ti-school',
  revision:        'ti-pencil',
  bill:            'ti-receipt',
  birthday:        'ti-cake',
  'school-holiday':'ti-school-off',
  'family-holiday':'ti-beach',
  'public-holiday':'ti-flag',
}

export const SPECIAL_TYPES = ['birthday', 'school-holiday', 'family-holiday', 'public-holiday']

export const SPECIAL_META: Record<string, { emoji: string; shade: string; label: string }> = {
  'birthday':       { emoji: '🎂', shade: 'rgba(236,72,153,0.08)', label: 'Birthday' },
  'school-holiday': { emoji: '🏫', shade: 'rgba(59,130,246,0.08)', label: 'School holiday' },
  'family-holiday': { emoji: '🌴', shade: 'rgba(16,185,129,0.08)', label: 'Family holiday' },
  'public-holiday': { emoji: '🎉', shade: 'rgba(245,158,11,0.08)', label: 'Public holiday' },
}

/** Resolve the display colour for an event based on its assignees */
export function getMemberColor(assignees: string[], members: Member[]): { hex: string; bg: string } {
  if (!assignees.length || assignees.includes('Everyone')) return { hex: '#1A1714', bg: '#EBEBEB' }
  for (const name of assignees) {
    const m = members.find(mb => mb.name === name && mb.id !== 'all')
    if (m) return { hex: m.fg, bg: m.bg }
  }
  return { hex: '#A09893', bg: '#F0EDE9' }
}

/**
 * Returns chip style with diagonal gradient for multi-member events.
 * Single member → solid bg. Multiple → 135° stripe per member bg colour.
 */
export function getEventChipStyle(
  assignees: string[],
  members: Member[]
): { background: string; color: string; borderLeftColor: string } {
  const FALLBACK = { background: '#EBEBEB', color: '#1A1714', borderLeftColor: '#1A1714' }

  if (!assignees.length || assignees.includes('Everyone')) return FALLBACK

  const matched = assignees
    .map(name => members.find(m => m.name === name && m.id !== 'all'))
    .filter(Boolean) as Member[]

  if (!matched.length) return FALLBACK
  if (matched.length === 1) {
    return { background: matched[0].bg, color: matched[0].fg, borderLeftColor: matched[0].fg }
  }

  // Build diagonal stripe: equal-width bands per member bg colour
  const n = matched.length
  const stops = matched.flatMap((m, i) => {
    const from = Math.round((i / n) * 100)
    const to   = Math.round(((i + 1) / n) * 100)
    return [`${m.bg} ${from}%`, `${m.bg} ${to}%`]
  })
  return {
    background: `linear-gradient(135deg, ${stops.join(', ')})`,
    color: matched[0].fg,
    borderLeftColor: matched[0].fg,
  }
}

/**
 * Returns true if a recurring (or one-off) event should appear on the given date.
 * Handles: none, daily, weekly (by day names), monthly (by date or ordinal day).
 * Respects recurEnd: never | on <date> | after <N> occurrences.
 */
export function eventOccursOn(ev: CalEvent, dateStr: string): boolean {
  const start = new Date(ev.date);  start.setHours(0,0,0,0)
  const check = new Date(dateStr);  check.setHours(0,0,0,0)
  if (check < start) return false

  // Respect end-date cutoff
  if (ev.recurEnd === 'on' && ev.recurEndDate) {
    const end = new Date(ev.recurEndDate); end.setHours(23,59,59,999)
    if (check > end) return false
  }

  if (ev.recur === 'none') return dateStr === ev.date

  if (ev.recur === 'daily') {
    if (ev.recurEnd === 'after' && ev.recurEndCount) {
      const diffDays = Math.round((check.getTime() - start.getTime()) / 86400000)
      return diffDays < ev.recurEndCount
    }
    return true
  }

  if (ev.recur === 'weekly') {
    const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const dayName = DAY_NAMES[check.getDay()]
    if (!ev.recurDays?.includes(dayName)) return false
    if (ev.recurEnd === 'after' && ev.recurEndCount) {
      // Count occurrences from start up to (and including) check
      let count = 0
      const d = new Date(start)
      while (d <= check) {
        if (ev.recurDays.includes(DAY_NAMES[d.getDay()])) count++
        d.setDate(d.getDate() + 1)
      }
      return count <= ev.recurEndCount
    }
    return true
  }

  if (ev.recur === 'monthly') {
    if (ev.recurMonthType === 'date') {
      const targetDate = ev.recurMonthDate ?? start.getDate()
      if (check.getDate() !== targetDate) return false
    } else {
      // Ordinal day: e.g. "Last Saturday"
      const ORD: Record<string,number> = { First:1, Second:2, Third:3, Fourth:4, Last:-1 }
      const WDAY: Record<string,number> = { Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6 }
      const targetWday = WDAY[ev.recurMonthDay ?? 'Monday'] ?? 1
      const targetOrd  = ORD[ev.recurMonthOrdinal ?? 'First'] ?? 1
      if (check.getDay() !== targetWday) return false
      if (targetOrd === -1) {
        // Last occurrence: find the last <wday> in this month
        const lastOfMonth = new Date(check.getFullYear(), check.getMonth() + 1, 0)
        while (lastOfMonth.getDay() !== targetWday) lastOfMonth.setDate(lastOfMonth.getDate() - 1)
        if (lastOfMonth.getDate() !== check.getDate()) return false
      } else {
        // Nth occurrence: count from 1st of month
        let count = 0
        const d = new Date(check.getFullYear(), check.getMonth(), 1)
        while (d.getMonth() === check.getMonth()) {
          if (d.getDay() === targetWday) { count++; if (count === targetOrd) break }
          d.setDate(d.getDate() + 1)
        }
        if (d.getDate() !== check.getDate()) return false
      }
    }
    if (ev.recurEnd === 'after' && ev.recurEndCount) {
      // Count monthly occurrences from start
      let count = 0
      const d = new Date(start)
      while (d <= check) {
        if (eventOccursOn({ ...ev, recurEnd: 'never' }, d.toISOString().slice(0,10))) count++
        d.setMonth(d.getMonth() + 1)
      }
      return count <= ev.recurEndCount
    }
    return true
  }

  if (ev.recur === 'yearly') {
    return check.getMonth() === start.getMonth() && check.getDate() === start.getDate()
  }

  return false
}

/** Build the cell array for a month grid (includes padding from prev/next month) */
export function buildCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const total    = new Date(year, month + 1, 0).getDate()
  const cells: { date: Date; thisMonth: boolean }[] = []
  for (let i = 0; i < firstDay; i++) {
    cells.push({ date: new Date(year, month, i - firstDay + 1), thisMonth: false })
  }
  for (let i = 1; i <= total; i++) {
    cells.push({ date: new Date(year, month, i), thisMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), thisMonth: false })
  }
  return cells
}

/** Get the Monday-start week containing a given date */
function getWeekDays(refDate: Date): Date[] {
  const d = new Date(refDate)
  const day = d.getDay() // 0=Sun
  d.setDate(d.getDate() - day) // rewind to Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d); x.setDate(d.getDate() + i); return x
  })
}

function fmtHour(h: number) {
  if (h === 0) return ''
  return h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`
}

function eventsForDateHour(events: CalEvent[], dateStr: string, hour: number) {
  return events.filter(e => {
    if (!eventOccursOn(e, dateStr)) return false
    if (!e.time) return hour === 8
    return parseInt(e.time.split(':')[0]) === hour
  })
}

/* ─────────────────────────────────────────
   PRIORITY BAR
───────────────────────────────────────── */
/* ─────────────────────────────────────────
   SPECIAL EVENTS STRIP
───────────────────────────────────────── */
function SpecialEventsStrip({ events }: { events: CalEvent[] }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const in30  = new Date(today); in30.setDate(today.getDate() + 30)

  // One chip per unique special event that falls (or starts) within 30 days
  const upcoming = events
    .filter(ev => SPECIAL_TYPES.includes(ev.type))
    .flatMap(ev => {
      // Find the first day in the next 30 days this event occurs
      for (let d = new Date(today); d <= in30; d.setDate(d.getDate() + 1)) {
        const ds = d.toISOString().slice(0, 10)
        if (eventOccursOn(ev, ds)) {
          const daysAway = Math.round((d.getTime() - today.getTime()) / 86400000)
          return [{ ev, date: new Date(d), daysAway }]
        }
      }
      return []
    })
    .sort((a, b) => a.daysAway - b.daysAway)
    .slice(0, 8)

  if (!upcoming.length) return null

  return (
    <div className="special-strip">
      <span className="special-strip-label">✨ Upcoming</span>
      {upcoming.map(({ ev, date, daysAway }, i) => {
        const meta = SPECIAL_META[ev.type] || { emoji: '📅', shade: '#eee', label: ev.type }
        const dayLabel = daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow'
          : date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
        const bg = ev.type === 'birthday' ? '#FDF2F8'
          : ev.type === 'school-holiday' ? '#EFF6FF'
          : ev.type === 'family-holiday' ? '#ECFDF5'
          : '#FFFBEB'
        const fg = ev.type === 'birthday' ? '#BE185D'
          : ev.type === 'school-holiday' ? '#1D4ED8'
          : ev.type === 'family-holiday' ? '#065F46'
          : '#92400E'
        const endLabel = ev.recurEnd === 'on' && ev.recurEndDate
          ? `– ${new Date(ev.recurEndDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`
          : ''
        return (
          <div key={i} className="special-chip" style={{ background: bg, color: fg }}>
            <span>{meta.emoji}</span>
            <span>{ev.title}</span>
            <span style={{ opacity: 0.65, fontWeight: 500 }}>· {dayLabel}{endLabel}</span>
          </div>
        )
      })}
    </div>
  )
}

function PriorityBar({ events, members, onEventClick }: {
  events: CalEvent[]
  members: Member[]
  onEventClick: (ev: CalEvent, e: React.MouseEvent) => void
}) {
  const today = new Date(); today.setHours(0, 0, 0, 0)

  // Build list: for each event, find the next occurrence within 3 days
  type Hit = { ev: CalEvent; dateStr: string; daysAway: number }
  const upcoming: Hit[] = []
  const seen = new Set<string>()
  for (let offset = 0; offset <= 3; offset++) {
    const d = new Date(today); d.setDate(today.getDate() + offset)
    const ds = d.toISOString().slice(0, 10)
    for (const ev of events) {
      const key = `${ev.id}-${ds}`
      if (!seen.has(key) && eventOccursOn(ev, ds)) {
        upcoming.push({ ev, dateStr: ds, daysAway: offset })
        seen.add(key)
      }
    }
  }
  upcoming.sort((a, b) => a.daysAway - b.daysAway || a.ev.title.localeCompare(b.ev.title))

  if (!upcoming.length) return (
    <div className="priority-bar">
      <Image src="/countdown_image.png" alt="" width={32} height={32} style={{ height: 32, width: 'auto', flexShrink: 0 }} />
      <div className="priority-bar-label"><i className="ti ti-circle-check" style={{ color: 'var(--green)' }}></i>Nothing due in the next 3 days</div>
    </div>
  )

  return (
    <div className="priority-bar">
      <Image src="/countdown_image.png" alt="" width={32} height={32} style={{ height: 32, width: 'auto', flexShrink: 0 }} />
      <div className="priority-bar-label"><i className="ti ti-bolt"></i>Up next</div>
      <div className="priority-bar-scroll">
        {upcoming.map(({ ev, dateStr, daysAway }) => {
          const cs = getEventChipStyle(ev.assignees, members)
          const badge   = daysAway === 0 ? 'TODAY' : daysAway === 1 ? 'TMR' : `${daysAway}d`
          const badgeBg = daysAway === 0 ? '#FEE2E2' : daysAway === 1 ? '#FEF3C7' : '#E8F7F2'
          const badgeFg = daysAway === 0 ? '#DC2626' : daysAway === 1 ? '#D97706' : '#1D9E75'
          return (
            <div
              key={`${ev.id}-${dateStr}`}
              className="priority-item"
              style={{ borderLeftColor: cs.borderLeftColor, background: cs.background, color: cs.color }}
              onClick={e => onEventClick(ev, e)}
            >
              <i className={`ti ${TYPE_ICONS[ev.type] || 'ti-calendar-event'}`}></i>
              <div>
                <div className="priority-item-title">{ev.title}</div>
                <div className="priority-item-meta">{ev.assignees.join(', ')}</div>
              </div>
              <span className="priority-badge" style={{ background: badgeBg, color: badgeFg }}>{badge}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MONTH VIEW
───────────────────────────────────────── */
function MonthView({ year, month, events, members, onCellClick, onEventClick }: {
  year: number; month: number; events: CalEvent[]; members: Member[]
  onCellClick: (dateStr: string) => void
  onEventClick: (ev: CalEvent, e: React.MouseEvent) => void
}) {
  const today = new Date()
  const cells = buildCells(year, month)

  return (
    <div className="cal-grid">
      <div className="cal-day-headers">
        {DAYS_SHORT.map(d => <div key={d} className="cal-day-header">{d}</div>)}
      </div>
      <div className="cal-days">
        {cells.map((cell, idx) => {
          const isToday = cell.date.toDateString() === today.toDateString()
          const dateStr = cell.date.toISOString().slice(0, 10)
          const dayEvs  = events.filter(e => eventOccursOn(e, dateStr))
          const specials = dayEvs.filter(e => SPECIAL_TYPES.includes(e.type))
          const regular  = dayEvs.filter(e => !SPECIAL_TYPES.includes(e.type))
          // Compute blended shade from all specials on this day
          const shade = specials.length ? SPECIAL_META[specials[0].type]?.shade : null
          return (
            <div
              key={idx}
              className={`cal-cell${!cell.thisMonth ? ' other-month' : ''}${isToday ? ' today' : ''}`}
              onClick={() => onCellClick(dateStr)}
            >
              {shade && <div className="cal-day-shade" style={{ background: shade }} />}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <div className="cal-date">{cell.date.getDate()}</div>
                {specials.length > 0 && (
                  <div style={{ display: 'flex', gap: 1, fontSize: 10 }} title={specials.map(s => s.title).join(', ')}>
                    {specials.slice(0, 3).map((s, si) => (
                      <span key={si}>{SPECIAL_META[s.type]?.emoji}</span>
                    ))}
                  </div>
                )}
              </div>
              {regular.slice(0, 3).map(ev => {
                const cs = getEventChipStyle(ev.assignees, members)
                return (
                  <div
                    key={ev.id}
                    className="cal-event-chip"
                    style={{ background: cs.background, color: cs.color, borderLeft: `3px solid ${cs.borderLeftColor}`, position: 'relative' }}
                    onClick={e => { e.stopPropagation(); onEventClick(ev, e) }}
                    title={`${ev.title} · ${ev.assignees.join(', ')}`}
                  >
                    <i className={`ti ${TYPE_ICONS[ev.type] || 'ti-calendar-event'}`} style={{ fontSize: 9, flexShrink: 0 }}></i>
                    {ev.time && <span style={{ opacity: .65, fontSize: 9, flexShrink: 0 }}>{ev.time.replace(':00','')}</span>}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{ev.title}</span>
                  </div>
                )
              })}
              {regular.length > 3 && (
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, padding: '1px 4px', position: 'relative' }}>
                  +{regular.length - 3} more
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   WEEK VIEW
───────────────────────────────────────── */
function WeekView({ refDate, events, members, onSlotClick, onEventClick }: {
  refDate: Date; events: CalEvent[]; members: Member[]
  onSlotClick: (dateStr: string, hour: number) => void
  onEventClick: (ev: CalEvent, e: React.MouseEvent) => void
}) {
  const today    = new Date()
  const allDays  = getWeekDays(refDate)
  // On mobile show 3 days centred on refDate; on desktop show all 7
  const [cols, setCols] = useState(7)
  useEffect(() => {
    const update = () => setCols(window.innerWidth < 640 ? 3 : 7)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const weekDays = cols === 3
    ? (() => {
        const idx = allDays.findIndex(d => d.toDateString() === refDate.toDateString())
        const centre = idx >= 0 ? idx : 0
        const start  = Math.max(0, Math.min(centre - 1, allDays.length - 3))
        return allDays.slice(start, start + 3)
      })()
    : allDays

  return (
    <div className="cal-week-grid">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 52, flexShrink: 0, borderBottom: '1px solid var(--border-lt)' }} />
        {HOURS.map(h => (
          <div key={h} className="cal-time-slot">{fmtHour(h)}</div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${weekDays.length},1fr)`, overflow: 'hidden' }}>
        {weekDays.map((d, i) => {
          const isToday   = d.toDateString() === today.toDateString()
          const dateStr   = d.toISOString().slice(0, 10)
          const specials  = events.filter(e => SPECIAL_TYPES.includes(e.type) && eventOccursOn(e, dateStr))
          return (
            <div key={`h${i}`} className="cal-week-day-header">
              <div className="cal-week-day-name">{DAYS_SHORT[d.getDay()]}</div>
              <div className={`cal-week-day-num${isToday ? ' today' : ''}`}>{d.getDate()}</div>
              {specials.length > 0 && (
                <div style={{ fontSize: 11, lineHeight: 1 }} title={specials.map(s => s.title).join(', ')}>
                  {specials.slice(0, 2).map((s, si) => <span key={si}>{SPECIAL_META[s.type]?.emoji}</span>)}
                </div>
              )}
            </div>
          )
        })}
        {weekDays.map((d, dayIdx) => {
          const dateStr  = d.toISOString().slice(0, 10)
          const specials = events.filter(e => SPECIAL_TYPES.includes(e.type) && eventOccursOn(e, dateStr))
          const shade    = specials.length ? SPECIAL_META[specials[0].type]?.shade : null
          return (
            <div key={`d${dayIdx}`} className="cal-day-col" style={{ gridRow: '2 / -1', position: 'relative' }}>
              {shade && <div style={{ position: 'absolute', inset: 0, background: shade, pointerEvents: 'none', zIndex: 0 }} />}
              {HOURS.map(h => {
                const slotEvs = eventsForDateHour(events, dateStr, h).filter(e => !SPECIAL_TYPES.includes(e.type))
                return (
                  <div
                    key={h}
                    className="cal-hour-row"
                    onClick={() => onSlotClick(dateStr, h)}
                    style={{ position: 'relative', zIndex: 1 }}
                  >
                    {slotEvs.map((ev, ei) => {
                      const cs = getEventChipStyle(ev.assignees, members)
                      return (
                        <div
                          key={ev.id}
                          className="cal-week-event"
                          style={{
                            background: cs.background, color: cs.color,
                            borderLeft: `3px solid ${cs.borderLeftColor}`,
                            top: 2 + ei * 22, minHeight: 20,
                          }}
                          onClick={e => { e.stopPropagation(); onEventClick(ev, e) }}
                        >
                          <i className={`ti ${TYPE_ICONS[ev.type]}`} style={{ fontSize: 9, marginRight: 2 }}></i>
                          {ev.title}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   DAY VIEW
───────────────────────────────────────── */
function DayView({ refDate, events, members, onSlotClick, onEventClick }: {
  refDate: Date; events: CalEvent[]; members: Member[]
  onSlotClick: (dateStr: string, hour: number) => void
  onEventClick: (ev: CalEvent, e: React.MouseEvent) => void
}) {
  const today  = new Date()
  const dateStr = refDate.toISOString().slice(0, 10)
  const isToday = refDate.toDateString() === today.toDateString()
  const dayLabel = refDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="cal-week-grid">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 52, flexShrink: 0, borderBottom: '1px solid var(--border-lt)' }} />
        {HOURS.map(h => <div key={h} className="cal-time-slot">{fmtHour(h)}</div>)}
      </div>
      <div style={{ flex: 1 }}>
        <div className="cal-week-day-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className={`cal-week-day-num${isToday ? ' today' : ''}`} style={{ fontSize: 14 }}>{dayLabel}</div>
        </div>
        <div className="cal-day-col" style={{ borderRight: 'none' }}>
          {HOURS.map(h => {
            const slotEvs = eventsForDateHour(events, dateStr, h)
            return (
              <div
                key={h}
                className="cal-hour-row"
                onClick={() => onSlotClick(dateStr, h)}
                style={{ position: 'relative' }}
              >
                {slotEvs.map((ev, ei) => {
                  const cs = getEventChipStyle(ev.assignees, members)
                  return (
                    <div
                      key={ev.id}
                      className="cal-week-event"
                      style={{
                        background: cs.background, color: cs.color,
                        borderLeft: `3px solid ${cs.borderLeftColor}`,
                        top: 2 + ei * 26, right: 4, minHeight: 24, fontSize: 11,
                      }}
                      onClick={e => { e.stopPropagation(); onEventClick(ev, e) }}
                    >
                      <i className={`ti ${TYPE_ICONS[ev.type]}`} style={{ fontSize: 10, marginRight: 4 }}></i>
                      {ev.time && <strong style={{ marginRight: 4 }}>{ev.time}</strong>}
                      {ev.title}
                      <span style={{ opacity: .65, marginLeft: 4, fontSize: 10 }}>· {ev.assignees.join(', ')}</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   SHARED MODAL COMPONENTS
───────────────────────────────────────── */

/** Multi-select assignee pill strip */
function AssigneePills({ members, selected, toggle }: {
  members: Member[]
  selected: string[]
  toggle: (name: string) => void
}) {
  return (
    <div className="modal-field">
      <label>Assign to <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:500 }}>Select one or more</span></label>
      <div className="role-pills">
        {['Everyone', ...members.filter(m => m.id !== 'all').map(m => m.name)].map(name => (
          <div
            key={name}
            className={`role-pill${selected.includes(name) ? ' sel' : ''}`}
            onClick={() => toggle(name)}
          >{name}</div>
        ))}
      </div>
    </div>
  )
}

/** Full recurring picker with end-date controls */
function RecurPicker({
  recur, setRecur,
  recurDays, toggleDay,
  monthType, setMonthType,
  monthDate, setMonthDate,
  monthOrd, setMonthOrd,
  monthDay, setMonthDay,
  recurEnd, setRecurEnd,
  recurEndDate, setRecurEndDate,
  recurEndCount, setRecurEndCount,
}: {
  recur: CalEvent['recur'];              setRecur: (v: CalEvent['recur']) => void
  recurDays: string[];                   toggleDay: (d: string) => void
  monthType: 'date'|'day';              setMonthType: (v: 'date'|'day') => void
  monthDate: number;                     setMonthDate: (v: number) => void
  monthOrd: string;                      setMonthOrd: (v: string) => void
  monthDay: string;                      setMonthDay: (v: string) => void
  recurEnd: 'never'|'on'|'after';        setRecurEnd: (v: 'never'|'on'|'after') => void
  recurEndDate: string;                  setRecurEndDate: (v: string) => void
  recurEndCount: number;                 setRecurEndCount: (v: number) => void
}) {
  const sel = (v: string) => `role-pill${recur === v ? ' sel' : ''}`
  const endSel = (v: string) => `role-pill${recurEnd === v ? ' sel' : ''}`

  return (
    <div className="modal-field">
      <label>Repeats</label>
      <div className="role-pills">
        {(['none','daily','weekly','monthly'] as const).map(r => (
          <div key={r} className={sel(r)} onClick={() => setRecur(r)}>
            {r === 'none' ? 'None' : r.charAt(0).toUpperCase() + r.slice(1)}
          </div>
        ))}
      </div>

      {recur === 'weekly' && (
        <div className="recur-sub">
          <div className="recur-sub-label">On which days?</div>
          <div className="role-pills" style={{ flexWrap:'wrap' }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} className={`role-pill${recurDays.includes(d) ? ' sel' : ''}`} onClick={() => toggleDay(d)}>{d}</div>
            ))}
          </div>
        </div>
      )}

      {recur === 'monthly' && (
        <div className="recur-sub">
          <div className="recur-sub-label">Repeat on the same…</div>
          <div className="role-pills" style={{ marginBottom:10 }}>
            <div className={`role-pill${monthType === 'date' ? ' sel' : ''}`} onClick={() => setMonthType('date')}>📅 Date (e.g. 15th)</div>
            <div className={`role-pill${monthType === 'day' ? ' sel' : ''}`} onClick={() => setMonthType('day')}>📆 Day (e.g. last Saturday)</div>
          </div>
          {monthType === 'date' ? (
            <input type="number" inputMode="numeric" min={1} max={31} value={monthDate}
              onChange={e => setMonthDate(Number(e.target.value))}
              placeholder="Day of month (e.g. 15)"
              style={{ width:'100%', padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:13, background:'var(--bg)', outline:'none' }} />
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <select value={monthOrd} onChange={e => setMonthOrd(e.target.value)}
                style={{ padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:13, background:'var(--bg)', outline:'none' }}>
                {['First','Second','Third','Fourth','Last'].map(o => <option key={o}>{o}</option>)}
              </select>
              <select value={monthDay} onChange={e => setMonthDay(e.target.value)}
                style={{ padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:13, background:'var(--bg)', outline:'none' }}>
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {recur !== 'none' && (
        <div className="recur-sub" style={{ marginTop:8 }}>
          <div className="recur-sub-label">Ends</div>
          <div className="role-pills" style={{ marginBottom:10 }}>
            <div className={endSel('never')} onClick={() => setRecurEnd('never')}>Never</div>
            <div className={endSel('on')}    onClick={() => setRecurEnd('on')}>On date</div>
            <div className={endSel('after')} onClick={() => setRecurEnd('after')}>After N times</div>
          </div>
          {recurEnd === 'on' && (
            <input type="date" value={recurEndDate} onChange={e => setRecurEndDate(e.target.value)}
              style={{ width:'100%', padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:13, background:'var(--bg)', outline:'none' }} />
          )}
          {recurEnd === 'after' && (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <input type="number" inputMode="numeric" min={1} max={999} value={recurEndCount}
                onChange={e => setRecurEndCount(Number(e.target.value))}
                style={{ width:90, padding:'14px 12px', minHeight:52, border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:16, background:'var(--bg)', outline:'none' }} />
              <span style={{ fontSize:13, color:'var(--text-2)' }}>occurrences then stops</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** AI scan panel — upload → processing → result */
function ScanPanel({ members, onSaved }: { members: Member[]; onSaved: (ev: CalEvent) => void }) {
  const [step, setStep]         = useState<'upload'|'processing'|'result'>('upload')
  const [log, setLog]           = useState<string[]>([])
  const [result, setResult]     = useState<{ type: string; title: string; confidence: number; fields: { label: string; key: string; value: string }[] } | null>(null)
  const [fieldVals, setFieldVals] = useState<Record<string,string>>({})

  const DEMO: Record<string, typeof result> = {
    bill: {
      type: 'Bill detected', title: 'Synergy Energy — July 2026', confidence: 96,
      fields: [{ label:'Provider', key:'provider', value:'Synergy Energy' },{ label:'Amount', key:'amount', value:'$210.50' },{ label:'Due date', key:'due_date', value:'25 Jul 2026' },{ label:'Category', key:'category', value:'Utilities' }],
    },
    event: {
      type: 'Calendar event detected', title: 'School End-of-Year Concert', confidence: 94,
      fields: [{ label:'Event', key:'title', value:'End-of-Year Concert' },{ label:'Date', key:'date', value:'2026-07-12' },{ label:'Time', key:'time', value:'18:30' },{ label:'Location', key:'location', value:'School Assembly Hall' }],
    },
  }

  const runDemo = (kind: string) => {
    setStep('processing'); setLog([])
    const steps = ['Uploading…','Detecting document type…','Extracting details…','Cross-checking fields…','Done!']
    let i = 0
    const iv = setInterval(() => {
      setLog(prev => [...prev, steps[i]])
      i++
      if (i >= steps.length) { clearInterval(iv); setTimeout(() => showResult(DEMO[kind]!), 300) }
    }, 500)
  }

  const showResult = (r: typeof result) => {
    setResult(r); setFieldVals(Object.fromEntries((r?.fields ?? []).map(f => [f.key, f.value]))); setStep('result')
  }

  const confirm = () => {
    const dateVal = fieldVals['date'] || fieldVals['due_date'] || new Date().toISOString().slice(0,10)
    onSaved({
      id: Date.now(), title: fieldVals['title'] || result?.title || 'Scanned item',
      date: dateVal, time: fieldVals['time'] || '', colour: 'amber',
      assignees: ['Everyone'], recur: 'none', type: 'event', notes: fieldVals['location'] || '',
    })
    setStep('upload'); setLog([]); setResult(null)
  }

  if (step === 'upload') return (
    <div>
      <div className="attach-drop" style={{ flexDirection:'column', gap:8, padding:24, justifyContent:'center', cursor:'pointer' }}
        onClick={() => (document.getElementById('cal-scan-input') as HTMLInputElement)?.click()}>
        <input type="file" id="cal-scan-input" accept="image/*,.pdf" style={{ display:'none' }}
          onChange={() => runDemo('event')} />
        <i className="ti ti-cloud-upload" style={{ fontSize:32, color:'var(--text-3)' }}></i>
        <div style={{ fontSize:13, fontWeight:700 }}>Drop a file or tap to upload</div>
        <div style={{ fontSize:11, color:'var(--text-3)' }}>Photos, PDFs, screenshots — invitations, bills, newsletters</div>
      </div>
      <div style={{ marginTop:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>Or try a demo</div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={{ flex:1, padding:9, border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:12, fontWeight:600, cursor:'pointer', background:'var(--bg)' }} onClick={() => runDemo('bill')}>📄 Demo bill</button>
          <button style={{ flex:1, padding:9, border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:12, fontWeight:600, cursor:'pointer', background:'var(--bg)' }} onClick={() => runDemo('event')}>📅 Demo event</button>
        </div>
      </div>
    </div>
  )

  if (step === 'processing') return (
    <div style={{ textAlign:'center', padding:'24px 0' }}>
      <div style={{ width:40, height:40, border:'3px solid var(--border)', borderTopColor:'var(--green)', borderRadius:'50%', margin:'0 auto 16px', animation:'spin 1s linear infinite' }}></div>
      <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>Reading your document…</div>
      <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:16 }}>Claude is extracting dates, amounts and details</div>
      <div style={{ background:'var(--bg)', borderRadius:'var(--r-lg)', padding:'10px 14px', textAlign:'left' }}>
        {log.map((l, i) => <div key={i} style={{ fontSize:11, color:'var(--text-3)', fontFamily:'monospace', lineHeight:2 }}>→ {l}</div>)}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, background:'var(--green-lt)', borderRadius:'var(--r-lg)', padding:'10px 14px' }}>
        <i className="ti ti-check" style={{ fontSize:18, color:'var(--green)' }}></i>
        <div>
          <div style={{ fontSize:13, fontWeight:800 }}>{result?.type}</div>
          <div style={{ fontSize:11, color:'var(--text-2)' }}>{result?.title} · AI confidence: {result?.confidence}%</div>
        </div>
      </div>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:10 }}>Extracted fields — tap to edit</div>
      {result?.fields.map(f => (
        <div key={f.key} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid var(--border-lt)' }}>
          <div style={{ fontSize:11, color:'var(--text-3)', width:80, flexShrink:0 }}>{f.label}</div>
          <input
            type="text"
            value={fieldVals[f.key] ?? f.value}
            onChange={e => setFieldVals(prev => ({ ...prev, [f.key]: e.target.value }))}
            style={{ flex:1, padding:'5px 8px', border:'1.5px solid var(--border)', borderRadius:'var(--r-sm)', fontSize:13, background:'var(--bg)', outline:'none' }}
          />
        </div>
      ))}
      <div style={{ fontSize:11, color:'var(--amber)', background:'var(--amber-lt)', padding:'8px 12px', borderRadius:'var(--r-md)', margin:'14px 0', display:'flex', gap:6, alignItems:'center' }}>
        <i className="ti ti-info-circle"></i> Always check AI-extracted details before saving.
      </div>
      <div className="modal-actions">
        <button className="modal-btn modal-btn-secondary" onClick={() => { setStep('upload'); setLog([]); setResult(null) }}>
          <i className="ti ti-arrow-left" style={{ marginRight:4, fontSize:12 }}></i>Scan another
        </button>
        <button className="modal-btn modal-btn-primary" onClick={confirm}>Save to KYNC</button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function CalendarClient({ displayName, familyName, initials, userEmail, familyMembers }: Props) {
  const firstName = displayName.split(' ')[0]
  const today = new Date()

  /* ── Members list — real from Supabase, fallback to placeholders ── */
  const MEMBERS: Member[] = familyMembers && familyMembers.length > 0
    ? [
        { id: 'all', name: 'All', initials: '★', colour: 'all', bg: '#1A1714', fg: '#fff' },
        ...familyMembers,
      ]
    : [
        { id: 'all',    name: 'All',     initials: '★',  colour: 'sj', bg: '#1A1714', fg: '#fff' },
        { id: 'admin',  name: firstName, initials,        colour: 'sj', bg: '#E8F7F2', fg: '#1D9E75' },
        { id: 'partner',name: 'Partner', initials: 'P',   colour: 'oj', bg: '#FFF3E0', fg: '#F57C00' },
        { id: 'child1', name: 'Child 1', initials: 'C1',  colour: 'lj', bg: '#E3F2FD', fg: '#1976D2' },
        { id: 'child2', name: 'Child 2', initials: 'C2',  colour: 'fa', bg: '#F3F0FF', fg: '#7F77DD' },
      ]

  /* ── State ── */
  const [year, setYear]         = useState(today.getFullYear())
  const [month, setMonth]       = useState(today.getMonth())
  const [view, setView]         = useState<'month' | 'week' | 'day'>('month')
  const [viewDate, setViewDate] = useState(today)   // anchor for week/day views
  const [activeMember, setActiveMember] = useState<string>('all')
  const [kidsView, setKidsView] = useState(false)
  const [events, setEvents]     = useState<CalEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [fabOpen, setFabOpen]   = useState(false)
  const [toast, setToast]       = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [detailEvent, setDetailEvent] = useState<CalEvent | null>(null)
  const [detailPos, setDetailPos] = useState({ top: 0, left: 0 })
  const [prefillDate, setPrefillDate] = useState('')
  const [checkedTasks, setCheckedTasks] = useState<Set<string | number>>(new Set())

  /* ── Load events from Supabase ── */
  useEffect(() => {
    fetch('/api/entries')
      .then(r => r.json())
      .then((rows: Record<string, unknown>[]) => {
        const mapped: CalEvent[] = rows.map(r => ({
          id:               r.id as string,
          title:            r.title as string,
          date:             r.date as string,
          time:             r.time_start as string | undefined,
          endTime:          r.time_end as string | undefined,
          colour:           (r.colour as string) || 'green',
          assignees:        (r.assignees as string[]) || ['Everyone'],
          type:             r.type as CalEvent['type'],
          notes:            r.notes as string | undefined,
          recur:            (r.recur as CalEvent['recur']) || 'none',
          recurDays:        r.recur_days as string[] | undefined,
          recurMonthType:   r.recur_month_type as 'date' | 'day' | undefined,
          recurMonthDate:   r.recur_month_date as number | undefined,
          recurMonthOrdinal:r.recur_month_ordinal as string | undefined,
          recurMonthDay:    r.recur_month_day as string | undefined,
          recurEnd:         r.recur_end as 'never' | 'on' | 'after' | undefined,
          recurEndDate:     r.recur_end_date as string | undefined,
          recurEndCount:    r.recur_end_count as number | undefined,
        }))
        setEvents(mapped)
      })
      .catch(() => {
        // Fallback to sample data if not logged in or table missing
        setEvents(buildSampleEvents(displayName))
      })
      .finally(() => setEventsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── CSS injection ── */
  useEffect(() => {
    const s = document.createElement('style')
    s.id = 'kync-cal-css'
    s.textContent = CALENDAR_CSS
    if (!document.getElementById('kync-cal-css')) document.head.appendChild(s)
    return () => document.getElementById('kync-cal-css')?.remove()
  }, [])

  /* ── Toast auto-hide ── */
  useEffect(() => {
    if (!toastVisible) return
    const t = setTimeout(() => setToastVisible(false), 2800)
    return () => clearTimeout(t)
  }, [toastVisible])

  /* ── ESC closes fab/modals ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setFabOpen(false); setActiveModal(null); setDetailEvent(null) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const showToast = (msg: string) => { setToast(msg); setToastVisible(true) }

  /* ── Navigation ── */
  const prevPeriod = () => {
    if (view === 'month') {
      const d = new Date(year, month - 1, 1)
      setYear(d.getFullYear()); setMonth(d.getMonth())
    } else if (view === 'week') {
      const d = new Date(viewDate); d.setDate(d.getDate() - 7)
      setViewDate(d); setYear(d.getFullYear()); setMonth(d.getMonth())
    } else {
      const d = new Date(viewDate); d.setDate(d.getDate() - 1)
      setViewDate(d); setYear(d.getFullYear()); setMonth(d.getMonth())
    }
  }
  const nextPeriod = () => {
    if (view === 'month') {
      const d = new Date(year, month + 1, 1)
      setYear(d.getFullYear()); setMonth(d.getMonth())
    } else if (view === 'week') {
      const d = new Date(viewDate); d.setDate(d.getDate() + 7)
      setViewDate(d); setYear(d.getFullYear()); setMonth(d.getMonth())
    } else {
      const d = new Date(viewDate); d.setDate(d.getDate() + 1)
      setViewDate(d); setYear(d.getFullYear()); setMonth(d.getMonth())
    }
  }
  const goToday = () => {
    setYear(today.getFullYear()); setMonth(today.getMonth()); setViewDate(today)
  }

  /* ── Event helpers ── */
  const addEvent = async (ev: CalEvent) => {
    // Optimistic add so UI feels instant
    setEvents(prev => [...prev, ev])
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ev),
      })
      if (res.ok) {
        const saved = await res.json()
        // Replace the optimistic entry with the real UUID from Supabase
        setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, id: saved.id } : e))
      }
    } catch {
      // Keep optimistic entry — will re-sync on next page load
    }
  }

  const removeEvent = async (id: string | number) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    setDetailEvent(null)
    showToast('Event removed')
    try {
      await fetch(`/api/entries/${id}`, { method: 'DELETE' })
    } catch {
      // Silently ignore — entry is already removed from UI
    }
  }

  const childNames = new Set(
    (familyMembers ?? []).filter(m => m.colour === 'child' || MEMBERS.find(mb => mb.id === m.id)?.colour === 'child').map(m => m.name)
  )
  // Derive child members from the actual role in familyMembers prop — fall back to any non-admin member beyond the first two
  const kidsMembers = (familyMembers ?? []).filter((_, i) => i >= 2)

  const filteredEvents = (() => {
    let base = activeMember === 'all'
      ? events
      : events.filter(e => {
          const m = MEMBERS.find(mb => mb.id === activeMember)
          return e.assignees.includes(m?.name ?? '') || e.assignees.includes('Everyone')
        })
    if (kidsView && kidsMembers.length > 0) {
      const kidsSet = new Set(kidsMembers.map(m => m.name))
      base = base.filter(e => e.assignees.some(a => kidsSet.has(a)) && !e.assignees.includes('Everyone') || e.assignees.some(a => kidsSet.has(a)))
    }
    return base
  })()

  /* ── Today's tasks for sidebar ── */
  const todayStr = today.toISOString().slice(0, 10)
  const todayItems = filteredEvents.filter(e => eventOccursOn(e, todayStr))

  /* ── Modal form state ── */
  const [fTitle, setFTitle]       = useState('')
  const [fDate, setFDate]         = useState('')
  const [fTime, setFTime]         = useState('')
  const [fEndTime, setFEndTime]   = useState('')
  const [fNotes, setFNotes]       = useState('')
  const [fColour, setFColour]     = useState('green')
  const [fAssignees, setFAssignees] = useState<string[]>(['Everyone'])
  const [fRecur, setFRecur]       = useState<CalEvent['recur']>('none')
  const [fRecurDays, setFRecurDays] = useState<string[]>([])
  const [fMonthType, setFMonthType] = useState<'date'|'day'>('date')
  const [fMonthDate, setFMonthDate] = useState<number>(1)
  const [fMonthOrd, setFMonthOrd] = useState('First')
  const [fMonthDay, setFMonthDay] = useState('Monday')
  const [fRecurEnd, setFRecurEnd] = useState<'never'|'on'|'after'>('never')
  const [fRecurEndDate, setFRecurEndDate] = useState('')
  const [fRecurEndCount, setFRecurEndCount] = useState(4)
  // task/chore/homework extras
  const [fSubject, setFSubject]   = useState('Maths')
  const [fPoints, setFPoints]     = useState(5)
  const [fTodPeriod, setFTodPeriod] = useState<string[]>(['Morning'])

  const resetForm = () => {
    setFTitle(''); setFTime(''); setFEndTime(''); setFNotes(''); setFColour('green')
    setFAssignees(['Everyone']); setFRecur('none'); setFRecurDays([])
    setFMonthType('date'); setFMonthDate(1); setFMonthOrd('First'); setFMonthDay('Monday')
    setFRecurEnd('never'); setFRecurEndDate(''); setFRecurEndCount(4)
    setFSubject('Maths'); setFPoints(5); setFTodPeriod(['Morning'])
  }

  const toggleAssignee = (name: string) => {
    if (name === 'Everyone') { setFAssignees(['Everyone']); return }
    setFAssignees(prev => {
      const without = prev.filter(a => a !== 'Everyone')
      const next = without.includes(name) ? without.filter(a => a !== name) : [...without, name]
      return next.length === 0 ? ['Everyone'] : next
    })
  }

  const toggleRecurDay = (d: string) =>
    setFRecurDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])

  const saveEntry = (type: CalEvent['type'], successMsg: string) => {
    if (!fTitle.trim()) { showToast('Please enter a title'); return }
    if (!fDate)         { showToast('Please pick a date'); return }
    addEvent({
      id: Date.now(), title: fTitle, date: fDate, time: fTime, endTime: fEndTime,
      colour: fColour, assignees: fAssignees, recur: fRecur,
      recurDays: fRecurDays, recurMonthType: fMonthType,
      recurMonthDate: fMonthDate, recurMonthOrdinal: fMonthOrd, recurMonthDay: fMonthDay,
      recurEnd: fRecurEnd, recurEndDate: fRecurEndDate, recurEndCount: fRecurEndCount,
      notes: fNotes, type,
    })
    setActiveModal(null)
    resetForm()
    showToast(successMsg)
  }

  const openModal = (id: string, date = '') => {
    resetForm(); setFDate(date || prefillDate)
    setPrefillDate(date); setActiveModal(id); setFabOpen(false)
  }

  const openDetail = (ev: CalEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDetailPos({
      top: Math.min(rect.bottom + 6, window.innerHeight - 260),
      left: Math.max(4, Math.min(rect.left, window.innerWidth - 292)),
    })
    setDetailEvent(ev)
  }

  /* ── Period label ── */
  const periodLabel = view === 'month'
    ? `${MONTHS[month]} ${year}`
    : view === 'week'
      ? (() => {
          const days = getWeekDays(viewDate)
          const s = days[0], e = days[6]
          return s.getMonth() === e.getMonth()
            ? `${s.getDate()}–${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`
            : `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`
        })()
      : viewDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  /* ── Print / PDF ── */
  const handlePrint = () => window.print()
  const handleExportPDF = () => {
    showToast('Opening print dialog — choose "Save as PDF"')
    setTimeout(() => window.print(), 300)
  }

  return (
    <div className="cal-shell">
      {/* Tabler icons */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />

      {/* ── Topbar ── */}
      <header className="cal-topbar">
        <Image src="/Kync_logo.png" alt="KYNC" width={64} height={24} style={{ objectFit: 'contain', flexShrink: 0 }} />
        <div className="cal-topbar-sep" />
        <span className="cal-page-title">Family Calendar</span>
        <button
          className={`cal-topbar-btn pink${kidsView ? ' active' : ''}`}
          onClick={() => setKidsView(v => !v)}
          title="Toggle kids-only view — shows only children's events"
          style={kidsView ? { background: 'var(--pink)', color: '#fff', borderColor: 'var(--pink)' } : {}}
        >
          <i className="ti ti-mood-kid" style={{ fontSize: 13 }}></i>Kids View
        </button>
        <button className="cal-topbar-btn" onClick={handleExportPDF} title="Export PDF">
          <i className="ti ti-file-type-pdf" style={{ fontSize: 13 }}></i>PDF
        </button>
        <button className="cal-topbar-btn" onClick={handlePrint} title="Print">
          <i className="ti ti-printer" style={{ fontSize: 13 }}></i>Print
        </button>
        <Link href="/dashboard" className="cal-topbar-btn">
          <i className="ti ti-layout-dashboard" style={{ fontSize: 13 }}></i>Dashboard
        </Link>
      </header>

      {/* ── Member avatar bar ── */}
      <div className="member-bar">
        {MEMBERS.map((m, i) => (
          <>
            {i === 1 && <div key="sep" className="member-bar-sep" />}
            <button
              key={m.id}
              className={`member-avatar-btn${activeMember === m.id ? ' active' : ''}`}
              onClick={() => setActiveMember(m.id)}
              title={m.id === 'all' ? 'Show all members' : m.name}
            >
              {m.avatar_url
                ? <img src={m.avatar_url} alt={m.name} className="member-avatar" style={{ objectFit: 'cover' }} />
                : <div className="member-avatar" style={{ background: m.bg, color: m.fg }}>{m.initials}</div>
              }
              <span className="member-avatar-name">{m.id === 'all' ? 'All' : m.name}</span>
            </button>
          </>
        ))}
        <div className="member-bar-sep" />
        <button
          className="member-avatar-btn"
          title="Add family member"
          onClick={() => showToast('Use Invite member on the dashboard to add family')}
        >
          <div className="member-avatar" style={{ background: 'var(--bg)', color: 'var(--text-3)', border: '2px dashed var(--border)' }}>
            <i className="ti ti-plus" style={{ fontSize: 14 }}></i>
          </div>
          <span className="member-avatar-name">Add</span>
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="cal-toolbar">
        <div className="cal-month-nav">
          <button className="cal-icon-btn" onClick={prevPeriod}><i className="ti ti-chevron-left"></i></button>
          <span className="cal-month-label">{periodLabel}</span>
          <button className="cal-icon-btn" onClick={nextPeriod}><i className="ti ti-chevron-right"></i></button>
        </div>
        <button className="cal-icon-btn cal-today-btn" onClick={goToday}>Today</button>
        <div className="cal-view-tabs">
          {(['month','week','day'] as const).map(v => (
            <div key={v} className={`cal-view-tab${view === v ? ' active' : ''}`} onClick={() => setView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </div>
          ))}
        </div>
      </div>

      {/* Legend removed — member colours shown in avatar bar above */}

      {/* ── Priority countdown bar ── */}
      <SpecialEventsStrip events={filteredEvents} />
      <PriorityBar events={filteredEvents} members={MEMBERS} onEventClick={openDetail} />

      {/* ── Content: calendar + sidebar ── */}
      <div className="cal-content">
        <div
          className="cal-main"
          onTouchStart={e => {
            const t = e.touches[0]
            ;(e.currentTarget as HTMLElement).dataset.touchX = String(t.clientX)
            ;(e.currentTarget as HTMLElement).dataset.touchY = String(t.clientY)
          }}
          onTouchEnd={e => {
            const el  = e.currentTarget as HTMLElement
            const dx  = e.changedTouches[0].clientX - Number(el.dataset.touchX || 0)
            const dy  = Math.abs(e.changedTouches[0].clientY - Number(el.dataset.touchY || 0))
            if (Math.abs(dx) > 50 && dy < 60) {
              if (dx < 0) nextPeriod()
              else prevPeriod()
            }
          }}
        >
          {view === 'month' && (
            <MonthView
              year={year} month={month}
              events={filteredEvents} members={MEMBERS}
              onCellClick={(dateStr) => { setViewDate(new Date(dateStr)); openModal('event', dateStr) }}
              onEventClick={openDetail}
            />
          )}
          {view === 'week' && (
            <WeekView
              refDate={viewDate}
              events={filteredEvents} members={MEMBERS}
              onSlotClick={(dateStr, hour) => {
                setViewDate(new Date(dateStr))
                openModal('event', dateStr)
              }}
              onEventClick={openDetail}
            />
          )}
          {view === 'day' && (
            <DayView
              refDate={viewDate}
              events={filteredEvents} members={MEMBERS}
              onSlotClick={(dateStr, hour) => openModal('event', dateStr)}
              onEventClick={openDetail}
            />
          )}
        </div>

        {/* ── Today's tasks sidebar ── */}
        <aside className="cal-sidebar">
          <div className="sidebar-head">
            Today's tasks
            <div className="sidebar-date">{today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
          {todayItems.length === 0 ? (
            <div className="sidebar-empty">Nothing scheduled for today 🎉</div>
          ) : (
            <>
              {(['task','chore','homework','event'] as const).map(type => {
                const items = todayItems.filter(e => e.type === type)
                if (!items.length) return null
                const labels: Record<string, string> = { task: 'Tasks', chore: 'Chores', homework: 'Homework', event: 'Events' }
                const icons: Record<string, string> = { task: 'ti-circle-check', chore: 'ti-home', homework: 'ti-books', event: 'ti-calendar-event' }
                return (
                  <div key={type} className="sidebar-section">
                    <div className="sidebar-section-label">
                      <i className={`ti ${icons[type]}`} style={{ marginRight: 4 }}></i>{labels[type]}
                    </div>
                    {items.map(item => (
                      <div key={item.id} className="sidebar-task-row">
                        <div
                          className={`sidebar-check${checkedTasks.has(item.id) ? ' done' : ''}`}
                          onClick={() => setCheckedTasks(prev => {
                            const next = new Set(prev)
                            next.has(item.id) ? next.delete(item.id) : next.add(item.id)
                            return next
                          })}
                        >
                          {checkedTasks.has(item.id) && <i className="ti ti-check" style={{ fontSize: 9, color: '#fff' }}></i>}
                        </div>
                        <div>
                          <div className={`sidebar-task-label${checkedTasks.has(item.id) ? ' done' : ''}`}>{item.title}</div>
                          <div className="sidebar-task-meta">
                            {item.time && <span>{item.time} · </span>}
                            {item.assignees.join(', ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          )}
        </aside>
      </div>

      {/* ── FAB ── */}
      <div className="cal-fab">
        <div className={`cal-fab-menu${fabOpen ? ' open' : ''}`}>
          {[
            { icon: 'ti-calendar-plus', label: 'Add event',          modal: 'event',    colour: 'var(--oj-ac)' },
            { icon: 'ti-circle-check',  label: 'Add task',           modal: 'task',     colour: 'var(--green)' },
            { icon: 'ti-home',          label: 'Add chore',          modal: 'chore',    colour: 'var(--lj-ac)' },
            { icon: 'ti-books',         label: 'Add homework',       modal: 'hw',       colour: 'var(--lilac)' },
            { icon: 'ti-school',        label: 'Add exam',           modal: 'exam',     colour: '#DC2626' },
            { icon: 'ti-pencil',        label: 'Add revision session',modal: 'revision', colour: 'var(--lilac)' },
            { icon: 'ti-scan',          label: 'Scan document',      modal: 'scan',     colour: 'var(--text-3)' },
          ].map(item => (
            <div key={item.modal} className="cal-fab-item" onClick={() => openModal(item.modal)}>
              <i className={`ti ${item.icon}`} style={{ color: item.colour }}></i>
              {item.label}
            </div>
          ))}
        </div>
        <button className={`cal-fab-btn${fabOpen ? ' open' : ''}`} onClick={() => setFabOpen(o => !o)}>
          <i className="ti ti-plus"></i>
        </button>
      </div>

      {/* ── Event detail popover ── */}
      {detailEvent && (
        <>
          <div className="event-detail-backdrop" onClick={() => setDetailEvent(null)} />
          <div className="event-detail" style={{ top: detailPos.top, left: detailPos.left }}>
            <button className="event-detail-close" onClick={() => setDetailEvent(null)}><i className="ti ti-x"></i></button>
            <div className="event-detail-title">
              <i className={`ti ${TYPE_ICONS[detailEvent.type] || 'ti-calendar-event'}`} style={{ color: getEventChipStyle(detailEvent.assignees, MEMBERS).borderLeftColor, marginRight: 6, fontSize: 14 }}></i>
              {detailEvent.title}
            </div>
            {detailEvent.time && <div className="event-detail-row"><i className="ti ti-clock"></i>{detailEvent.time}{detailEvent.endTime ? ` – ${detailEvent.endTime}` : ''}</div>}
            <div className="event-detail-row"><i className="ti ti-users"></i>{detailEvent.assignees.join(', ')}</div>
            {detailEvent.recur !== 'none' && (
              <div className="event-detail-row"><i className="ti ti-repeat"></i>
                {detailEvent.recur === 'daily' ? 'Repeats daily' : detailEvent.recur === 'weekly' ? `Weekly (${(detailEvent.recurDays || []).join(', ')})` : 'Monthly'}
                {detailEvent.recurEnd === 'on' && detailEvent.recurEndDate ? ` · until ${detailEvent.recurEndDate}` : ''}
                {detailEvent.recurEnd === 'after' && detailEvent.recurEndCount ? ` · ${detailEvent.recurEndCount}×` : ''}
              </div>
            )}
            {detailEvent.notes && <div className="event-detail-row"><i className="ti ti-notes"></i>{detailEvent.notes}</div>}
            <div className="event-detail-actions">
              <button className="event-detail-btn" onClick={() => { openModal('event', detailEvent.date); setDetailEvent(null) }}>
                <i className="ti ti-edit" style={{ marginRight: 4, fontSize: 11 }}></i>Edit
              </button>
              <button className="event-detail-btn danger" onClick={() => removeEvent(detailEvent.id)}>
                <i className="ti ti-trash" style={{ marginRight: 4, fontSize: 11 }}></i>Remove
              </button>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════
          SHARED MODAL BUILDING BLOCKS
          (rendered once, reused below)
      ════════════════════════════════ */}

      {/* ── Assignee pills (shared) ── */}
      {/* rendered inline per modal */}

      {/* ════ ADD EVENT MODAL ════ */}
      <div className={`modal-backdrop${activeModal === 'event' ? ' open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) setActiveModal(null) }}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-head">
            <Image src="/Kync_logo.png" alt="KYNC" width={54} height={18} className="modal-kync-logo" style={{ objectFit:'contain' }} />
            <div className="modal-head-row">
              <div><div className="modal-title">Add event</div><div className="modal-sub">Add to the family calendar.</div></div>
              <button className="modal-close" onClick={() => setActiveModal(null)}><i className="ti ti-x" /></button>
            </div>
          </div>
          <div className="modal-body">
            <div className="modal-field"><label>Event title</label>
              <input type="text" placeholder="e.g. School sports day" value={fTitle} onChange={e => setFTitle(e.target.value)} />
            </div>
            <div className="modal-2col">
              <div className="modal-field" style={{ marginBottom:0 }}><label>Date</label>
                <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
              </div>
              <div className="modal-field" style={{ marginBottom:0 }}><label>Start time <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:500 }}>Optional</span></label>
                <input type="time" value={fTime} onChange={e => setFTime(e.target.value)} />
              </div>
            </div>
            <div className="modal-field" style={{ marginTop:12 }}><label>End time <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:500 }}>Optional</span></label>
              <input type="time" value={fEndTime} onChange={e => setFEndTime(e.target.value)} />
            </div>
            <AssigneePills members={MEMBERS} selected={fAssignees} toggle={toggleAssignee} />
            <RecurPicker
              recur={fRecur} setRecur={setFRecur}
              recurDays={fRecurDays} toggleDay={toggleRecurDay}
              monthType={fMonthType} setMonthType={setFMonthType}
              monthDate={fMonthDate} setMonthDate={setFMonthDate}
              monthOrd={fMonthOrd} setMonthOrd={setFMonthOrd}
              monthDay={fMonthDay} setMonthDay={setFMonthDay}
              recurEnd={fRecurEnd} setRecurEnd={setFRecurEnd}
              recurEndDate={fRecurEndDate} setRecurEndDate={setFRecurEndDate}
              recurEndCount={fRecurEndCount} setRecurEndCount={setFRecurEndCount}
            />
            <div className="modal-field"><label>Notes <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:500 }}>Optional</span></label>
              <textarea rows={2} placeholder="Any extra details…" value={fNotes} onChange={e => setFNotes(e.target.value)} style={{ resize:'none' }} />
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={() => saveEntry('event','Event added ✓')}>Add event</button>
            </div>
          </div>
        </div>
      </div>

      {/* ════ ADD TASK MODAL ════ */}
      <div className={`modal-backdrop${activeModal === 'task' ? ' open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) setActiveModal(null) }}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-head">
            <Image src="/Kync_logo.png" alt="KYNC" width={54} height={18} className="modal-kync-logo" style={{ objectFit:'contain' }} />
            <div className="modal-head-row">
              <div><div className="modal-title">Add task</div><div className="modal-sub">Assign a task to a family member.</div></div>
              <button className="modal-close" onClick={() => setActiveModal(null)}><i className="ti ti-x" /></button>
            </div>
          </div>
          <div className="modal-body">
            <div className="modal-field"><label>Task title</label>
              <input type="text" placeholder="e.g. Book car service" value={fTitle} onChange={e => setFTitle(e.target.value)} />
            </div>
            <div className="modal-field"><label>Due date</label>
              <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
            </div>
            <AssigneePills members={MEMBERS} selected={fAssignees} toggle={toggleAssignee} />
            <RecurPicker
              recur={fRecur} setRecur={setFRecur}
              recurDays={fRecurDays} toggleDay={toggleRecurDay}
              monthType={fMonthType} setMonthType={setFMonthType}
              monthDate={fMonthDate} setMonthDate={setFMonthDate}
              monthOrd={fMonthOrd} setMonthOrd={setFMonthOrd}
              monthDay={fMonthDay} setMonthDay={setFMonthDay}
              recurEnd={fRecurEnd} setRecurEnd={setFRecurEnd}
              recurEndDate={fRecurEndDate} setRecurEndDate={setFRecurEndDate}
              recurEndCount={fRecurEndCount} setRecurEndCount={setFRecurEndCount}
            />
            <div className="modal-field"><label>Notes <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:500 }}>Optional</span></label>
              <input type="text" placeholder="Any extra details…" value={fNotes} onChange={e => setFNotes(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={() => saveEntry('task','Task added ✓')}>Add task</button>
            </div>
          </div>
        </div>
      </div>

      {/* ════ ADD CHORE MODAL ════ */}
      <div className={`modal-backdrop${activeModal === 'chore' ? ' open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) setActiveModal(null) }}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-head">
            <Image src="/Kync_logo.png" alt="KYNC" width={54} height={18} className="modal-kync-logo" style={{ objectFit:'contain' }} />
            <div className="modal-head-row">
              <div><div className="modal-title">Add chore</div><div className="modal-sub">Set a repeating chore for the family.</div></div>
              <button className="modal-close" onClick={() => setActiveModal(null)}><i className="ti ti-x" /></button>
            </div>
          </div>
          <div className="modal-body">
            <div className="modal-field"><label>Chore title</label>
              <input type="text" placeholder="e.g. Make bed" value={fTitle} onChange={e => setFTitle(e.target.value)} />
            </div>
            <div className="modal-field"><label>Start date</label>
              <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
            </div>
            <AssigneePills members={MEMBERS} selected={fAssignees} toggle={toggleAssignee} />
            <div className="modal-field">
              <label>Time of day <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:500 }}>Select one or both</span></label>
              <div className="role-pills">
                {['Morning','Evening'].map(p => (
                  <div key={p} className={`role-pill${fTodPeriod.includes(p) ? ' sel' : ''}`}
                    onClick={() => setFTodPeriod(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}>
                    {p === 'Morning' ? '🌅' : '🌙'} {p}
                  </div>
                ))}
              </div>
            </div>
            <RecurPicker
              recur={fRecur} setRecur={setFRecur}
              recurDays={fRecurDays} toggleDay={toggleRecurDay}
              monthType={fMonthType} setMonthType={setFMonthType}
              monthDate={fMonthDate} setMonthDate={setFMonthDate}
              monthOrd={fMonthOrd} setMonthOrd={setFMonthOrd}
              monthDay={fMonthDay} setMonthDay={setFMonthDay}
              recurEnd={fRecurEnd} setRecurEnd={setFRecurEnd}
              recurEndDate={fRecurEndDate} setRecurEndDate={setFRecurEndDate}
              recurEndCount={fRecurEndCount} setRecurEndCount={setFRecurEndCount}
            />
            <div className="modal-field"><label>Points value</label>
              <input type="number" value={fPoints} min={0} max={100} onChange={e => setFPoints(Number(e.target.value))} />
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={() => saveEntry('chore','Chore added ✓')}>Add chore</button>
            </div>
          </div>
        </div>
      </div>

      {/* ════ ADD HOMEWORK MODAL ════ */}
      <div className={`modal-backdrop${activeModal === 'hw' ? ' open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) setActiveModal(null) }}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-head">
            <Image src="/Kync_logo.png" alt="KYNC" width={54} height={18} className="modal-kync-logo" style={{ objectFit:'contain' }} />
            <div className="modal-head-row">
              <div><div className="modal-title">Add homework</div><div className="modal-sub">Track a school assignment.</div></div>
              <button className="modal-close" onClick={() => setActiveModal(null)}><i className="ti ti-x" /></button>
            </div>
          </div>
          <div className="modal-body">
            <div className="modal-field"><label>Assignment title</label>
              <input type="text" placeholder="e.g. Chapter 7 worksheet" value={fTitle} onChange={e => setFTitle(e.target.value)} />
            </div>
            <div className="modal-2col">
              <div className="modal-field" style={{ marginBottom:0 }}><label>Subject</label>
                <select value={fSubject} onChange={e => setFSubject(e.target.value)}>
                  {['Maths','English','Science','History','Reading','Spelling','Other'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="modal-field" style={{ marginBottom:0 }}><label>Due date</label>
                <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop:12 }}>
              <AssigneePills members={MEMBERS} selected={fAssignees} toggle={toggleAssignee} />
            </div>
            <RecurPicker
              recur={fRecur} setRecur={setFRecur}
              recurDays={fRecurDays} toggleDay={toggleRecurDay}
              monthType={fMonthType} setMonthType={setFMonthType}
              monthDate={fMonthDate} setMonthDate={setFMonthDate}
              monthOrd={fMonthOrd} setMonthOrd={setFMonthOrd}
              monthDay={fMonthDay} setMonthDay={setFMonthDay}
              recurEnd={fRecurEnd} setRecurEnd={setFRecurEnd}
              recurEndDate={fRecurEndDate} setRecurEndDate={setFRecurEndDate}
              recurEndCount={fRecurEndCount} setRecurEndCount={setFRecurEndCount}
            />
            <div className="modal-field"><label>Notes <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:500 }}>Optional</span></label>
              <input type="text" placeholder="e.g. Pages 12–24, show working" value={fNotes} onChange={e => setFNotes(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={() => saveEntry('homework','Homework added ✓')}>Add homework</button>
            </div>
          </div>
        </div>
      </div>

      {/* ════ AI SCAN MODAL ════ */}
      <div className={`modal-backdrop${activeModal === 'scan' ? ' open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) setActiveModal(null) }}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-head">
            <Image src="/Kync_logo.png" alt="KYNC" width={54} height={18} className="modal-kync-logo" style={{ objectFit:'contain' }} />
            <div className="modal-head-row">
              <div><div className="modal-title">AI document scanner</div><div className="modal-sub">Upload a photo or PDF — Claude reads it and creates a draft.</div></div>
              <button className="modal-close" onClick={() => setActiveModal(null)}><i className="ti ti-x" /></button>
            </div>
          </div>
          <div className="modal-body">
            <ScanPanel members={MEMBERS} onSaved={(ev) => { addEvent(ev); setActiveModal(null); showToast('Saved to calendar ✓') }} />
          </div>
        </div>
      </div>

      {/* ════ ADD EXAM MODAL ════ */}
      <div className={`modal-backdrop${activeModal === 'exam' ? ' open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) setActiveModal(null) }}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-head">
            <Image src="/Kync_logo.png" alt="KYNC" width={54} height={18} className="modal-kync-logo" style={{ objectFit:'contain' }} />
            <div className="modal-head-row">
              <div><div className="modal-title">Add exam</div><div className="modal-sub">Track an upcoming test with revision planner.</div></div>
              <button className="modal-close" onClick={() => setActiveModal(null)}><i className="ti ti-x" /></button>
            </div>
          </div>
          <div className="modal-body">
            <div className="modal-field"><label>Exam title</label>
              <input type="text" placeholder="e.g. Maths Test — Term 3" value={fTitle} onChange={e => setFTitle(e.target.value)} />
            </div>
            <div className="modal-2col">
              <div className="modal-field" style={{ marginBottom:0 }}><label>Subject</label>
                <select value={fSubject} onChange={e => setFSubject(e.target.value)}>
                  {['Maths','English','Science','History','Reading','Spelling','Geography','Other'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="modal-field" style={{ marginBottom:0 }}><label>Exam date</label>
                <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop:12 }}>
              <AssigneePills members={MEMBERS} selected={fAssignees} toggle={toggleAssignee} />
            </div>
            <div className="modal-field"><label>Exam time <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:500 }}>Optional</span></label>
              <input type="time" value={fTime} onChange={e => setFTime(e.target.value)} />
            </div>
            <div className="modal-field"><label>Notes <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:500 }}>e.g. chapters covered, open book</span></label>
              <input type="text" placeholder="e.g. Chapters 1–5, no calculator" value={fNotes} onChange={e => setFNotes(e.target.value)} />
            </div>
            <div style={{ background:'var(--lilac-lt)', border:'1.5px solid #C4BFFE', borderRadius:'var(--r-md)', padding:'10px 14px', display:'flex', gap:10, marginBottom:4, alignItems:'flex-start' }}>
              <i className="ti ti-pencil" style={{ color:'var(--lilac)', fontSize:16, marginTop:1, flexShrink:0 }}></i>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--lilac)' }}>Add revision sessions after saving</div>
                <div style={{ fontSize:11, color:'#7b74cc', marginTop:2 }}>Use "Add revision session" from the + menu to schedule study blocks — they appear in purple on the calendar and stop automatically on exam day.</div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={() => saveEntry('exam', `Exam added — ${fTitle}`)}>Save exam</button>
            </div>
          </div>
        </div>
      </div>

      {/* ════ ADD REVISION SESSION MODAL ════ */}
      <div className={`modal-backdrop${activeModal === 'revision' ? ' open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) setActiveModal(null) }}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-head">
            <Image src="/Kync_logo.png" alt="KYNC" width={54} height={18} className="modal-kync-logo" style={{ objectFit:'contain' }} />
            <div className="modal-head-row">
              <div><div className="modal-title">Add revision session</div><div className="modal-sub">Schedule study blocks — they repeat until exam day.</div></div>
              <button className="modal-close" onClick={() => setActiveModal(null)}><i className="ti ti-x" /></button>
            </div>
          </div>
          <div className="modal-body">
            <div className="modal-field"><label>Subject / topic</label>
              <input type="text" placeholder="e.g. Maths — number patterns" value={fTitle} onChange={e => setFTitle(e.target.value)} />
            </div>
            <div className="modal-2col">
              <div className="modal-field" style={{ marginBottom:0 }}><label>First session date</label>
                <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
              </div>
              <div className="modal-field" style={{ marginBottom:0 }}><label>Time <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:500 }}>Optional</span></label>
                <input type="time" value={fTime} onChange={e => setFTime(e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop:12 }}>
              <AssigneePills members={MEMBERS} selected={fAssignees} toggle={toggleAssignee} />
            </div>
            <RecurPicker
              recur={fRecur} setRecur={setFRecur}
              recurDays={fRecurDays} toggleDay={toggleRecurDay}
              monthType={fMonthType} setMonthType={setFMonthType}
              monthDate={fMonthDate} setMonthDate={setFMonthDate}
              monthOrd={fMonthOrd} setMonthOrd={setFMonthOrd}
              monthDay={fMonthDay} setMonthDay={setFMonthDay}
              recurEnd={fRecurEnd} setRecurEnd={setFRecurEnd}
              recurEndDate={fRecurEndDate} setRecurEndDate={setFRecurEndDate}
              recurEndCount={fRecurEndCount} setRecurEndCount={setFRecurEndCount}
            />
            <div style={{ background:'var(--amber-lt)', border:'1px solid #FDE68A', borderRadius:'var(--r-md)', padding:'9px 12px', fontSize:11, color:'var(--amber)', display:'flex', gap:6, alignItems:'center', marginBottom:4 }}>
              <i className="ti ti-info-circle" style={{ flexShrink:0 }}></i>
              Tip: set <strong style={{ margin:'0 2px' }}>Ends → On date</strong> to the exam date so revision stops automatically.
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={() => saveEntry('revision', 'Revision sessions added ✓')}>Add sessions</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      <div className={`toast${toastVisible ? ' show' : ''}`}>
        <i className="ti ti-circle-check"></i>{toast}
      </div>
    </div>
  )
}
