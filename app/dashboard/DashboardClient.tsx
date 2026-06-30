'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface FamilyMember {
  id: string
  display_name: string
  role: string
  avatar_initials: string
  avatar_colour_bg?: string | null
  avatar_colour_fg?: string | null
  avatar_url?: string | null
}

interface Props {
  displayName: string
  familyName: string
  initials: string
  userEmail?: string
  members?: FamilyMember[]
}

const DASHBOARD_CSS = `
:root {
  --bg:#F7F5F2; --surface:#FFFFFF; --border:#E8E4DF; --border-lt:#F0EDE9;
  --text-1:#1A1714; --text-2:#6B6561; --text-3:#A09893;
  --green:#1D9E75; --green-lt:#E8F7F2; --green-mid:#9FE1CB;
  --pink:#E8497A; --pink-lt:#FDE8EE; --pink-mid:#F4A4BE;
  --red:#E24B4A; --red-lt:#FEF0F0;
  --amber:#D97706; --amber-lt:#FEF3C7;
  --lilac:#7F77DD; --lilac-lt:#F2F1FD;
  --sj-bg:#9FE1CB; --sj-fg:#085041; --sj-ac:#1D9E75;
  --mj-bg:#F5C4B3; --mj-fg:#712B13; --mj-ac:#D85A30;
  --oj-bg:#B5D4F4; --oj-fg:#0C447C; --oj-ac:#378ADD;
  --lj-bg:#F4C0D1; --lj-fg:#72243E; --lj-ac:#D4537E;
  --fa-bg:#CECBF6; --fa-fg:#3C3489; --fa-ac:#7F77DD;
  --r-sm:8px; --r-md:12px; --r-lg:16px; --r-xl:20px; --r-2xl:28px;
  --app-max:1080px;
}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text-1);font-size:14px;min-height:100vh;}
button{font-family:inherit;cursor:pointer;border:none;background:none;}
input,select,textarea{font-family:inherit;}
.topbar{position:sticky;top:0;z-index:80;background:rgba(247,245,242,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:0 24px;}
.topbar-inner{max-width:var(--app-max);margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:58px;gap:16px;}
.tb-logo{display:flex;align-items:center;text-decoration:none;}
.tb-nav{display:flex;align-items:center;gap:4px;}
.tb-nav-btn{padding:6px 12px;border-radius:var(--r-sm);font-size:13px;font-weight:600;color:var(--text-2);transition:background .12s,color .12s;display:flex;align-items:center;gap:6px;text-decoration:none;}
.tb-nav-btn:hover{background:var(--border-lt);color:var(--text-1);}
.tb-nav-btn.active{background:var(--text-1);color:#fff;}
.tb-nav-btn i{font-size:15px;}
.tb-right{display:flex;align-items:center;gap:8px;}
.tb-help-btn{width:32px;height:32px;border-radius:50%;border:1.5px solid var(--border);background:var(--surface);display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--text-2);font-weight:700;cursor:pointer;transition:all .15s;}
.tb-help-btn:hover{background:var(--text-1);color:#fff;border-color:var(--text-1);}
.tb-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;cursor:pointer;background:var(--sj-bg);color:var(--sj-fg);border:2px solid transparent;transition:border-color .15s;}
.tb-avatar:hover{border-color:var(--text-1);}
@media(max-width:600px){
  .topbar{padding:0 14px;}
  .tb-nav{display:none;}
  .dash-body{padding:20px 14px calc(80px + env(safe-area-inset-bottom));}
  .modal{border-radius:var(--r-2xl) var(--r-2xl) 0 0;max-height:95vh;}
  .modal-backdrop{align-items:flex-end;}
  .welcome-banner{padding:20px;}
  .welcome-heading{font-size:18px;}
  .actions-grid{grid-template-columns:repeat(2,1fr);gap:8px;}
}
.dash-body{max-width:var(--app-max);margin:0 auto;padding:28px 24px 60px;}
.welcome-banner{background:var(--text-1);border-radius:var(--r-2xl);padding:28px 32px;margin-bottom:28px;display:flex;align-items:center;justify-content:space-between;gap:20px;overflow:hidden;position:relative;}
.welcome-banner::after{content:'';position:absolute;right:-40px;top:-40px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,.04);pointer-events:none;}
.welcome-eyebrow{font-size:11px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;}
.welcome-heading{font-size:26px;font-weight:800;color:#fff;letter-spacing:-.03em;line-height:1.15;margin-bottom:6px;}
.welcome-sub{font-size:13px;color:rgba(255,255,255,.5);line-height:1.5;}
.welcome-members{display:flex;align-items:center;margin-top:16px;}
.welcome-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2.5px solid var(--text-1);margin-right:-8px;}
.welcome-member-count{font-size:12px;font-weight:600;color:rgba(255,255,255,.5);margin-left:18px;}
.welcome-cal-btn{display:flex;align-items:center;gap:8px;padding:12px 20px;border-radius:var(--r-lg);background:var(--green);color:#fff;font-size:13px;font-weight:700;flex-shrink:0;white-space:nowrap;transition:background .15s;text-decoration:none;}
.welcome-cal-btn:hover{background:#18896a;}
.welcome-cal-btn i{font-size:16px;}
@media(max-width:600px){.welcome-banner{padding:22px 20px;} .welcome-heading{font-size:20px;} .welcome-cal-btn span{display:none;} .welcome-cal-btn{padding:12px;}}
.section-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.section-title{font-size:16px;font-weight:800;letter-spacing:-.02em;}
.section-link{font-size:12px;font-weight:600;color:var(--green);cursor:pointer;}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;}
@media(max-width:700px){.stats-row{grid-template-columns:repeat(2,1fr);}}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);padding:18px 16px;}
.stat-num{font-size:28px;font-weight:800;letter-spacing:-.04em;line-height:1;}
.stat-lbl{font-size:12px;font-weight:600;color:var(--text-3);margin-top:4px;}
.stat-delta{font-size:11px;font-weight:600;margin-top:6px;display:flex;align-items:center;gap:3px;}
.delta-up{color:var(--green);} .delta-warn{color:var(--amber);}
.actions-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:28px;}
@media(max-width:900px){.actions-grid{grid-template-columns:repeat(3,1fr);}}
@media(max-width:600px){.actions-grid{grid-template-columns:repeat(2,1fr);gap:8px;}}
.action-card{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-xl);padding:20px 16px 18px;display:flex;flex-direction:column;align-items:flex-start;gap:12px;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s;position:relative;overflow:hidden;}
.action-card:hover{border-color:transparent;box-shadow:0 6px 28px rgba(0,0,0,.1);transform:translateY(-2px);}
.action-card::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;border-radius:var(--r-xl) var(--r-xl) 0 0;}
.ac-green::before{background:var(--green);} .ac-blue::before{background:var(--oj-ac);} .ac-purple::before{background:var(--fa-ac);}
.ac-orange::before{background:var(--mj-ac);} .ac-pink::before{background:var(--lj-ac);} .ac-teal::before{background:var(--sj-ac);}
.ac-amber::before{background:var(--amber);} .ac-dark::before{background:var(--text-1);} .ac-lilac::before{background:var(--lilac);}
.ac-emerald::before{background:#059669;}
.action-icon{width:48px;height:48px;border-radius:var(--r-lg);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.action-icon i{font-size:24px;}
.ai-green{background:var(--green-lt);color:var(--green);} .ai-blue{background:#EDF4FE;color:var(--oj-ac);} .ai-purple{background:#F2F1FD;color:var(--fa-ac);}
.ai-orange{background:#FDF2EE;color:var(--mj-ac);} .ai-pink{background:#FDF0F4;color:var(--lj-ac);} .ai-teal{background:#E8F8F3;color:var(--sj-ac);}
.ai-amber{background:var(--amber-lt);color:var(--amber);} .ai-dark{background:#EBEBEB;color:var(--text-1);} .ai-lilac{background:var(--lilac-lt);color:var(--lilac);}
.ai-emerald{background:#D1FAE5;color:#059669;}
.action-label{font-size:13px;font-weight:700;line-height:1.3;}
.action-sub{font-size:11px;color:var(--text-3);margin-top:2px;}
.members-list{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;margin-bottom:28px;}
.member-row{display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--border-lt);transition:background .1s;cursor:pointer;}
.member-row:last-child{border-bottom:none;} .member-row:hover{background:var(--bg);}
.member-av{width:42px;height:42px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;}
.member-info{flex:1;}
.member-name{font-size:14px;font-weight:700;}
.member-meta{font-size:12px;color:var(--text-3);margin-top:2px;display:flex;align-items:center;gap:8px;}
.member-role-badge{font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;text-transform:uppercase;letter-spacing:.05em;}
.role-admin{background:var(--text-1);color:#fff;} .role-member{background:#EBEBEB;color:var(--text-2);} .role-child{background:var(--oj-bg);color:var(--oj-fg);}
.member-perms{display:flex;gap:5px;}
.perm-dot{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;}
.perm-on{background:var(--green-lt);color:var(--green);} .perm-off{background:#F0EDE9;color:var(--text-3);}
.member-chevron{color:var(--text-3);font-size:16px;flex-shrink:0;}
.member-actions-dash{display:flex;gap:4px;flex-shrink:0;}
.dash-action-btn{width:28px;height:28px;border-radius:var(--r-sm);border:none;background:var(--bg);display:flex;align-items:center;justify-content:center;color:var(--text-2);cursor:pointer;transition:all .12s;}
.dash-action-btn:hover{background:var(--border);color:var(--text-1);}
.dash-action-btn.danger:hover{background:var(--red-lt,#FEE2E2);color:var(--red,#DC2626);}
.member-row.pending{opacity:.6;}
.pending-badge{font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:var(--amber-lt);color:var(--amber);border:1px solid #FCD34D;}
.activity-list{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;}
.activity-row{display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid var(--border-lt);}
.activity-row:last-child{border-bottom:none;}
.activity-icon{width:34px;height:34px;border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
.activity-text{flex:1;font-size:13px;line-height:1.4;}
.activity-text strong{font-weight:700;}
.activity-time{font-size:11px;color:var(--text-3);flex-shrink:0;}
.modal-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:300;align-items:flex-end;justify-content:center;}
.modal-backdrop.open{display:flex;}
@media(min-width:601px){.modal-backdrop{align-items:center;}}
.modal{background:var(--surface);border-radius:var(--r-2xl) var(--r-2xl) 0 0;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;animation:slideUp .22s ease;}
@media(min-width:601px){.modal{border-radius:var(--r-2xl);max-height:88vh;}}
@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}
.modal-handle{width:40px;height:4px;border-radius:2px;background:var(--border);margin:12px auto 0;}
@media(min-width:601px){.modal-handle{display:none;}}
.modal-head{padding:20px 24px 0;display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;}
.modal-title{font-size:18px;font-weight:800;letter-spacing:-.02em;}
.modal-sub{font-size:13px;color:var(--text-2);margin-top:4px;}
.modal-close{width:30px;height:30px;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center;color:var(--text-2);font-size:16px;flex-shrink:0;}
.modal-close:hover{background:var(--border);}
.modal-body{padding:0 24px 24px;}
.modal-field{margin-bottom:14px;}
.modal-field label{display:block;font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:6px;letter-spacing:.07em;text-transform:uppercase;}
.modal-field input,.modal-field select,.modal-field textarea{width:100%;padding:14px;min-height:52px;border:1.5px solid var(--border);border-radius:var(--r-md);font-size:16px;color:var(--text-1);background:var(--bg);outline:none;transition:border-color .15s;}
.modal-field textarea{min-height:80px;}
.modal-field textarea{resize:vertical;min-height:80px;line-height:1.5;}
.modal-field input:focus,.modal-field select:focus,.modal-field textarea:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(29,158,117,.12);}
.modal-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.perm-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px;}
.perm-toggle{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:var(--r-md);border:1.5px solid var(--border);background:var(--bg);cursor:pointer;}
.perm-toggle.on{border-color:var(--green);background:var(--green-lt);}
.perm-toggle-lbl{font-size:12px;font-weight:600;color:var(--text-2);}
.perm-toggle.on .perm-toggle-lbl{color:var(--green);}
.toggle-switch{width:28px;height:16px;border-radius:8px;background:var(--border);position:relative;flex-shrink:0;}
.toggle-switch::after{content:'';position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:transform .15s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
.perm-toggle.on .toggle-switch{background:var(--green);}
.perm-toggle.on .toggle-switch::after{transform:translateX(12px);}
.role-pills{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;}
.role-pill{padding:8px 16px;border-radius:20px;border:1.5px solid var(--pink-mid);font-size:12px;font-weight:600;color:var(--pink);cursor:pointer;background:var(--green-lt);transition:all .15s;display:inline-flex;align-items:center;}
.role-pill.sel{background:var(--pink);border-color:var(--pink);color:#fff;}
.role-pill:hover:not(.sel){background:var(--pink-lt);}
.modal-actions{display:flex;gap:8px;margin-top:20px;}
.modal-btn{flex:1;padding:13px;border-radius:var(--r-lg);font-size:14px;font-weight:700;border:1.5px solid transparent;cursor:pointer;transition:all .15s;}
.modal-btn-primary{background:var(--pink);color:#fff;border-color:var(--pink);}
.modal-btn-primary:hover{background:#d43870;border-color:#d43870;}
.modal-btn-secondary{background:var(--green-lt);color:var(--green);border-color:var(--green-mid);}
.modal-btn-secondary:hover{background:var(--green);color:#fff;border-color:var(--green);}
.modal-btn-danger{background:var(--red-lt);color:var(--red);border:1.5px solid #F09595;}
.toggle-row{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:var(--r-md);border:1.5px solid var(--border);background:var(--bg);margin-bottom:8px;}
.toggle-row.on{border-color:var(--green);background:var(--green-lt);}
.toggle-row-info{flex:1;}
.toggle-row-label{font-size:13px;font-weight:700;}
.toggle-row.on .toggle-row-label{color:var(--green);}
.toggle-row-sub{font-size:11px;color:var(--text-3);margin-top:2px;}
.toggle-row-switch{width:36px;height:20px;border-radius:10px;background:var(--border);position:relative;flex-shrink:0;cursor:pointer;}
.toggle-row-switch::after{content:'';position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .15s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
.toggle-row.on .toggle-row-switch{background:var(--green);}
.toggle-row.on .toggle-row-switch::after{transform:translateX(16px);}
.sleep-wrap{background:var(--bg);border:1.5px solid var(--border);border-radius:var(--r-lg);padding:14px;}
.sleep-enabled-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;}
.sleep-times{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding-top:14px;border-top:1px solid var(--border-lt);}
.sleep-time-field label{display:block;font-size:11px;font-weight:700;color:var(--text-3);letter-spacing:.04em;margin-bottom:6px;}
.sleep-time-field input[type=time]{width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:var(--r-md);font-size:15px;font-weight:700;background:var(--surface);outline:none;}
.sleep-ext-btn{padding:7px 14px;border-radius:20px;border:1.5px solid var(--amber);font-size:12px;font-weight:700;color:var(--amber);background:var(--amber-lt);cursor:pointer;white-space:nowrap;}
.sleep-note{font-size:11px;color:var(--text-3);margin-top:10px;line-height:1.5;padding:10px 12px;background:var(--amber-lt);border-radius:var(--r-md);border:1px solid #FDE68A;}
.rewards-target-wrap{background:var(--bg);border:1.5px solid var(--border);border-radius:var(--r-lg);padding:14px;}
.rewards-target-row{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.rewards-target-label{font-size:13px;font-weight:700;}
.rewards-target-sub{font-size:11px;color:var(--text-3);margin-top:2px;}
.rewards-target-input{width:80px;padding:8px 10px;border:1.5px solid var(--border);border-radius:var(--r-md);font-size:15px;font-weight:800;background:var(--surface);text-align:center;outline:none;}
.rewards-progress-bar{margin-top:12px;height:8px;border-radius:4px;background:var(--border-lt);overflow:hidden;}
.rewards-progress-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--green),#56cfb2);transition:width .4s;}
.rewards-progress-meta{display:flex;justify-content:space-between;font-size:11px;color:var(--text-3);margin-top:5px;}
.settings-section{margin-bottom:20px;}
.settings-section-title{font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;}
.settings-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border-lt);}
.settings-row:last-child{border-bottom:none;}
.settings-row-left{flex:1;}
.settings-row-label{font-size:13px;font-weight:600;}
.settings-row-sub{font-size:11px;color:var(--text-3);margin-top:2px;}
.settings-toggle{width:40px;height:22px;border-radius:11px;background:var(--border);position:relative;cursor:pointer;border:none;}
.settings-toggle::after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .15s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
.settings-toggle.on{background:var(--green);}
.settings-toggle.on::after{transform:translateX(18px);}
.danger-zone{background:var(--red-lt);border:1px solid #F09595;border-radius:var(--r-lg);padding:16px;margin-top:8px;}
.danger-zone-title{font-size:13px;font-weight:700;color:var(--red);margin-bottom:8px;}
.danger-zone-text{font-size:12px;color:#B91C1C;line-height:1.5;margin-bottom:12px;}
.kiosk-info-card{border-radius:var(--r-lg);border:1.5px solid var(--border);overflow:hidden;}
.kiosk-info-header{padding:12px 14px;background:var(--text-1);display:flex;align-items:center;gap:8px;}
.kiosk-info-header-text{font-size:13px;font-weight:700;color:#fff;}
.kiosk-info-header-sub{font-size:11px;color:rgba(255,255,255,.6);margin-top:1px;}
.kiosk-platform{padding:12px 14px;border-bottom:1px solid var(--border-lt);}
.kiosk-platform:last-child{border-bottom:none;}
.kiosk-platform-title{font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px;margin-bottom:5px;}
.kiosk-platform-body{font-size:12px;color:var(--text-2);line-height:1.55;}
.kiosk-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;background:var(--border-lt);color:var(--text-2);margin:3px 2px 0;}
.urgency-pills{display:flex;gap:6px;margin-top:4px;}
.urgency-pill{flex:1;padding:10px 8px;border-radius:var(--r-md);border:1.5px solid var(--border);text-align:center;cursor:pointer;background:var(--bg);}
.urgency-pill .up-icon{font-size:18px;margin-bottom:4px;}
.urgency-pill .up-label{font-size:11px;font-weight:700;color:var(--text-2);}
.urgency-pill .up-sub{font-size:10px;color:var(--text-3);margin-top:1px;}
.urgency-pill.sel-soon{border-color:var(--red);background:var(--red-lt);}
.urgency-pill.sel-soon .up-label{color:var(--red);}
.urgency-pill.sel-mid{border-color:var(--amber);background:var(--amber-lt);}
.urgency-pill.sel-mid .up-label{color:var(--amber);}
.urgency-pill.sel-ok{border-color:var(--green);background:var(--green-lt);}
.urgency-pill.sel-ok .up-label{color:var(--green);}
.help-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:400;}
.help-backdrop.open{display:block;}
.help-drawer{position:fixed;top:0;right:-420px;bottom:0;width:100%;max-width:400px;background:var(--surface);box-shadow:-8px 0 40px rgba(0,0,0,.12);z-index:401;transition:right .28s cubic-bezier(.34,1,.64,1);display:flex;flex-direction:column;}
.help-backdrop.open .help-drawer{right:0;}
.help-drawer-head{padding:20px 24px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.help-drawer-title{font-size:18px;font-weight:800;}
.help-drawer-close{width:30px;height:30px;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center;color:var(--text-2);font-size:16px;cursor:pointer;}
.help-drawer-body{flex:1;overflow-y:auto;padding:20px 24px 32px;}
.help-qs-card{background:linear-gradient(135deg,var(--text-1),#2d3a5a);border-radius:var(--r-xl);padding:20px;margin-bottom:20px;cursor:pointer;}
.help-qs-eyebrow{font-size:10px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;}
.help-qs-title{font-size:16px;font-weight:800;color:#fff;margin-bottom:4px;}
.help-qs-sub{font-size:12px;color:rgba(255,255,255,.55);line-height:1.5;}
.help-qs-btn{display:inline-flex;align-items:center;gap:6px;margin-top:14px;padding:8px 16px;border-radius:20px;background:var(--green);color:#fff;font-size:12px;font-weight:700;}
.help-features{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;}
.help-feat-card{background:var(--bg);border:1.5px solid var(--border);border-radius:var(--r-lg);padding:14px;}
.help-feat-icon{width:36px;height:36px;border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;margin-bottom:8px;}
.help-feat-title{font-size:12px;font-weight:700;margin-bottom:3px;}
.help-feat-sub{font-size:11px;color:var(--text-3);line-height:1.4;}
.help-section-label{font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;}
.faq-item{border:1.5px solid var(--border);border-radius:var(--r-md);margin-bottom:8px;overflow:hidden;}
.faq-q{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;cursor:pointer;font-size:13px;font-weight:600;background:var(--bg);gap:8px;}
.faq-q:hover{background:var(--border-lt);}
.faq-q i{font-size:14px;color:var(--text-3);flex-shrink:0;transition:transform .2s;}
.faq-item.open .faq-q i{transform:rotate(180deg);}
.faq-a{display:none;padding:0 16px 14px;font-size:13px;color:var(--text-2);line-height:1.6;background:var(--surface);}
.faq-item.open .faq-a{display:block;}
.wizard-steps{display:flex;align-items:center;justify-content:center;gap:6px;padding:16px 24px 0;}
.wizard-dot{width:8px;height:8px;border-radius:50%;background:var(--border);transition:all .2s;}
.wizard-dot.active{background:var(--green);width:24px;border-radius:4px;}
.wizard-dot.done{background:var(--green);}
.wizard-step{display:none;} .wizard-step.active{display:block;}
.wizard-hero{text-align:center;padding:24px 0 20px;}
.wizard-hero-icon{width:72px;height:72px;border-radius:var(--r-xl);background:var(--green-lt);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:36px;}
.wizard-hero-title{font-size:22px;font-weight:800;margin-bottom:8px;}
.wizard-hero-sub{font-size:14px;color:var(--text-2);line-height:1.6;max-width:340px;margin:0 auto;}
#bedtime-overlay{display:none;position:fixed;inset:0;z-index:999;background:linear-gradient(160deg,#0F1B35,#1a2d54,#0d2140);flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 24px;}
#bedtime-overlay.active{display:flex;}
.bedtime-stars{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
.bedtime-star{position:absolute;width:2px;height:2px;border-radius:50%;background:#fff;opacity:0;animation:twinkle var(--d,3s) var(--dl,0s) infinite;}
@keyframes twinkle{0%,100%{opacity:0;}50%{opacity:var(--op,.8);}}
.bedtime-moon{font-size:72px;margin-bottom:16px;animation:moonFloat 4s ease-in-out infinite;}
@keyframes moonFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
.bedtime-title{font-size:28px;font-weight:800;color:#fff;margin-bottom:8px;}
.bedtime-sub{font-size:15px;color:rgba(255,255,255,.65);line-height:1.5;max-width:300px;margin:0 auto 32px;}
.bedtime-wake-card{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:var(--r-xl);padding:20px 32px;margin-bottom:24px;}
.bedtime-wake-label{font-size:12px;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;}
.bedtime-wake-time{font-size:36px;font-weight:800;color:#fff;}
.bedtime-ask-btn{padding:12px 28px;border-radius:24px;background:rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.3);font-size:14px;font-weight:700;color:#fff;cursor:pointer;}
.bedtime-demo-close{position:absolute;top:20px;right:20px;font-size:12px;color:rgba(255,255,255,.4);cursor:pointer;padding:6px 10px;border:1px solid rgba(255,255,255,.15);border-radius:8px;}
.colour-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;}
.colour-swatch{width:32px;height:32px;border-radius:50%;cursor:pointer;border:3px solid transparent;}
.colour-swatch:hover{transform:scale(1.1);}
.colour-swatch.sel{border-color:var(--text-1);}
.avatar-upload-wrap{display:flex;align-items:center;gap:14px;margin-bottom:16px;padding:14px;background:var(--bg);border-radius:var(--r-lg);border:1.5px dashed var(--border);}
.avatar-preview{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex-shrink:0;overflow:hidden;}
.avatar-upload-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:var(--r-md);background:var(--surface);border:1.5px solid var(--border);font-size:12px;font-weight:700;cursor:pointer;}
.avatar-upload-btn input[type=file]{display:none;}
.avatar-remove-btn{font-size:11px;font-weight:600;color:var(--red);cursor:pointer;margin-top:4px;display:inline-block;}
.cal-sync-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:var(--r-md);border:1.5px solid var(--border);background:var(--bg);margin-bottom:8px;cursor:pointer;}
.cal-sync-row.connected{border-color:var(--green);background:var(--green-lt);}
.cal-sync-icon{width:36px;height:36px;border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;}
.cal-sync-icon.google{background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.12);}
.cal-sync-info{flex:1;}
.cal-sync-name{font-size:13px;font-weight:700;}
.cal-sync-status{font-size:11px;color:var(--text-3);margin-top:2px;}
.cal-sync-row.connected .cal-sync-status{color:var(--green);}
.cal-toggle-switch{width:36px;height:20px;border-radius:10px;background:var(--border);position:relative;}
.cal-toggle-switch::after{content:'';position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .15s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
.cal-sync-row.connected .cal-toggle-switch{background:var(--green);}
.cal-sync-row.connected .cal-toggle-switch::after{transform:translateX(16px);}
.report-modal{max-width:740px;}
.report-period-tabs{display:flex;gap:6px;margin-bottom:20px;background:var(--bg);padding:4px;border-radius:var(--r-lg);border:1.5px solid var(--border);}
.report-tab{flex:1;padding:8px;border-radius:var(--r-md);font-size:13px;font-weight:600;color:var(--text-2);text-align:center;cursor:pointer;transition:all .15s;}
.report-tab.active{background:var(--text-1);color:#fff;}
.report-summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;}
@media(max-width:600px){.report-summary-grid{grid-template-columns:repeat(2,1fr);}}
.report-summary-card{background:var(--bg);border:1.5px solid var(--border);border-radius:var(--r-lg);padding:14px;}
.report-summary-num{font-size:22px;font-weight:800;letter-spacing:-.03em;}
.report-summary-lbl{font-size:11px;font-weight:600;color:var(--text-3);margin-top:3px;}
.report-summary-card.paid .report-summary-num{color:var(--green);}
.report-summary-card.upcoming .report-summary-num{color:var(--amber);}
.report-summary-card.overdue .report-summary-num{color:var(--red);}
.report-section-label{font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:12px;}
.report-category-list{margin-bottom:20px;}
.report-cat-row{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
.report-cat-label{width:100px;font-size:12px;font-weight:600;color:var(--text-2);flex-shrink:0;}
.report-cat-bar-wrap{flex:1;height:28px;background:var(--border-lt);border-radius:var(--r-sm);overflow:hidden;position:relative;}
.report-cat-bar{height:100%;border-radius:var(--r-sm);display:flex;align-items:center;padding-left:10px;font-size:11px;font-weight:700;color:#fff;transition:width .6s ease;min-width:2px;}
.report-cat-amount{width:70px;font-size:12px;font-weight:700;text-align:right;flex-shrink:0;}
.report-monthly-chart{display:flex;align-items:flex-end;gap:8px;height:80px;margin-bottom:20px;}
.report-month-bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;}
.report-month-bar{width:100%;border-radius:4px 4px 0 0;background:var(--green);opacity:.7;transition:opacity .15s;cursor:pointer;}
.report-month-bar:hover{opacity:1;}
.report-month-label{font-size:10px;color:var(--text-3);font-weight:600;}
.report-bills-table{border:1.5px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:16px;}
.report-table-head{display:grid;grid-template-columns:1fr 120px 80px 70px;gap:0;background:var(--bg);padding:10px 16px;border-bottom:1px solid var(--border);}
.report-table-head span{font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;}
.report-table-row{display:grid;grid-template-columns:1fr 120px 80px 70px;gap:0;padding:11px 16px;border-bottom:1px solid var(--border-lt);align-items:center;}
.report-table-row:last-child{border-bottom:none;}
.report-bill-name{font-size:13px;font-weight:600;}
.report-bill-cat{font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;display:inline-block;}
.report-bill-amount{font-size:13px;font-weight:700;}
.report-bill-status{font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;text-align:center;}
.status-paid{background:var(--green-lt);color:var(--green);}
.status-due{background:var(--amber-lt);color:var(--amber);}
.status-overdue{background:var(--red-lt);color:var(--red);}
.report-export-bar{display:flex;gap:8px;padding-top:4px;}
.report-export-btn{display:flex;align-items:center;gap:7px;padding:10px 16px;border-radius:var(--r-md);border:1.5px solid var(--border);background:var(--bg);font-size:13px;font-weight:600;color:var(--text-1);cursor:pointer;flex:1;justify-content:center;transition:all .15s;}
.report-export-btn:hover{background:var(--text-1);color:#fff;border-color:var(--text-1);}
.report-export-btn i{font-size:16px;}
.report-export-btn.excel:hover{background:#217346;border-color:#217346;}
.scan-modal{max-width:540px;}
.scan-drop-zone{border:2px dashed var(--border);border-radius:var(--r-lg);padding:40px 24px;text-align:center;cursor:pointer;background:var(--bg);transition:border-color .2s,background .2s;position:relative;}
.scan-drop-zone:hover,.scan-drop-zone.drag-over{border-color:var(--green);background:var(--green-lt);}
.scan-drop-zone input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;}
.scan-drop-icon{width:60px;height:60px;border-radius:var(--r-lg);background:var(--green-lt);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;}
.scan-drop-icon i{font-size:28px;color:var(--green);}
.scan-drop-title{font-size:15px;font-weight:700;margin-bottom:4px;}
.scan-drop-sub{font-size:12px;color:var(--text-3);}
.scan-processing{display:none;text-align:center;padding:32px 0;}
.scan-processing.active{display:block;}
.scan-spinner{width:52px;height:52px;border:3px solid var(--border);border-top-color:var(--green);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px;}
@keyframes spin{to{transform:rotate(360deg);}}
.scan-processing-title{font-size:15px;font-weight:700;margin-bottom:4px;}
.scan-processing-sub{font-size:12px;color:var(--text-3);}
.scan-result{display:none;}
.scan-result.active{display:block;}
.scan-result-header{display:flex;align-items:center;gap:12px;padding:14px;background:var(--green-lt);border:1.5px solid #86efbd;border-radius:var(--r-lg);margin-bottom:16px;}
.scan-result-icon{width:40px;height:40px;border-radius:var(--r-md);background:var(--green);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.scan-result-icon i{font-size:20px;color:#fff;}
.scan-result-type{font-size:11px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.06em;}
.scan-result-title{font-size:14px;font-weight:700;margin-top:2px;}
.scan-confidence{font-size:11px;color:var(--text-3);margin-top:2px;}
.scan-confidence span{color:var(--green);font-weight:700;}
.scan-fields{background:var(--bg);border:1.5px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:16px;}
.scan-field-row{display:flex;align-items:center;padding:11px 14px;border-bottom:1px solid var(--border-lt);}
.scan-field-row:last-child{border-bottom:none;}
.scan-field-label{width:110px;font-size:11px;font-weight:700;color:var(--text-3);flex-shrink:0;}
.scan-field-value{flex:1;font-size:13px;font-weight:600;}
.scan-field-edit{width:100%;padding:6px 10px;border:1.5px solid var(--border);border-radius:var(--r-sm);font-size:13px;font-weight:600;background:var(--surface);outline:none;}
.scan-edit-toggle{font-size:11px;font-weight:600;color:var(--green);cursor:pointer;margin-left:8px;white-space:nowrap;}
.attach-drop{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1.5px dashed var(--border);border-radius:var(--r-md);background:var(--bg);cursor:pointer;transition:border-color .15s,background .15s;margin-top:4px;}
.attach-drop:hover{border-color:var(--green);background:var(--green-lt);}
.attach-drop input[type=file]{display:none;}
.attach-list{display:flex;flex-direction:column;gap:6px;margin-top:8px;}
.attach-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:var(--r-md);background:var(--surface);border:1px solid var(--border);}
.attach-item-icon{width:28px;height:28px;border-radius:6px;background:var(--green-lt);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.attach-item-icon i{font-size:14px;color:var(--green);}
.attach-item-name{flex:1;font-size:12px;font-weight:600;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.attach-item-size{font-size:10px;color:var(--text-3);}
.attach-item-del{font-size:14px;color:var(--text-3);cursor:pointer;padding:2px;flex-shrink:0;}
.attach-item-del:hover{color:var(--red);}
.device-mode-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:4px;}
.device-mode-card{border:1.5px solid var(--border);border-radius:var(--r-lg);padding:14px 10px;text-align:center;cursor:pointer;transition:border-color .15s,background .15s;background:var(--bg);}
.device-mode-card.sel{border-color:var(--green);background:var(--green-lt);}
.device-mode-icon{font-size:24px;margin-bottom:6px;}
.device-mode-name{font-size:12px;font-weight:800;color:var(--text-1);}
.device-mode-sub{font-size:10px;color:var(--text-3);margin-top:2px;line-height:1.4;}
.device-mode-card.sel .device-mode-name{color:var(--green);}
.kids-view-btn{display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:var(--r-sm);background:var(--lj-bg);color:var(--lj-fg);font-size:13px;font-weight:700;border:none;cursor:pointer;transition:opacity .15s,transform .1s;white-space:nowrap;}
.kids-view-btn:hover{opacity:.85;transform:translateY(-1px);}
.kids-view-btn i{font-size:14px;}
#kids-view-overlay{display:none;position:fixed;inset:0;z-index:998;background:#FFF5F9;flex-direction:column;align-items:center;justify-content:flex-start;padding:24px 16px 80px;overflow-y:auto;}
#kids-view-overlay.active{display:flex;}
.kv-topbar{width:100%;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
.kv-exit{padding:7px 14px;border-radius:20px;border:1.5px solid var(--lj-ac);color:var(--lj-ac);font-size:12px;font-weight:700;background:transparent;cursor:pointer;display:flex;align-items:center;gap:4px;}
.kv-greeting{font-size:28px;font-weight:800;color:var(--text-1);margin-bottom:4px;text-align:center;}
.kv-date{font-size:13px;color:var(--text-3);margin-bottom:16px;text-align:center;}
.kv-member-tabs{display:flex;gap:8px;margin-bottom:20px;}
.kv-tab{padding:8px 20px;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;border:2px solid var(--border);background:var(--bg);color:var(--text-2);transition:all .15s;}
.kv-tab.sel{border-color:var(--lj-bg);}
.kv-card{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-xl);padding:18px;margin-bottom:14px;width:100%;max-width:480px;}
.kv-card-head{display:flex;align-items:center;gap:12px;margin-bottom:14px;}
.kv-card-icon{width:40px;height:40px;border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;}
.kv-card-title{font-size:14px;font-weight:800;}
.kv-card-sub{font-size:12px;color:var(--text-3);margin-top:2px;}
.kv-chore-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-lt);}
.kv-chore-row:last-of-type{border-bottom:none;}
.kv-chore-check{width:24px;height:24px;border-radius:50%;border:2px solid var(--border);flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;}
.kv-chore-check.done{background:var(--green);border-color:var(--green);}
.kv-chore-label{flex:1;font-size:13px;font-weight:600;}
.kv-chore-label.done{text-decoration:line-through;color:var(--text-3);}
.kv-chore-pts{font-size:12px;font-weight:700;color:var(--green);}
.kv-points-bar{margin-top:14px;padding-top:14px;border-top:1px solid var(--border-lt);}
.kv-pts-top{display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px;}
.kv-pts-track{height:8px;border-radius:4px;background:var(--border-lt);overflow:hidden;}
.kv-pts-fill{height:100%;border-radius:4px;transition:width .4s;}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(60px);background:var(--text-1);color:#fff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:20px;z-index:600;opacity:0;transition:transform .28s cubic-bezier(.34,1.56,.64,1),opacity .2s;white-space:nowrap;display:flex;align-items:center;gap:7px;}
.toast.show{transform:translateX(-50%) translateY(0);opacity:1;}
.toast i{font-size:15px;color:var(--green);}
.modal-kync-logo{height:28px;display:block;margin-bottom:10px;opacity:.9;}
@media print{.topbar,.modal-backdrop,.help-backdrop,.toast,#bedtime-overlay{display:none!important;}.dash-body{padding:0;}}
`

export default function DashboardClient({ displayName, familyName, initials, userEmail, members = [] }: Props) {
  const firstName = displayName.split(' ')[0]
  const fName = familyName || 'My Family'

  useEffect(() => {
    // Inject CSS
    const style = document.createElement('style')
    style.id = 'kync-dash-css'
    style.textContent = DASHBOARD_CSS
    if (!document.getElementById('kync-dash-css')) {
      document.head.appendChild(style)
    }

    // Embed family members as a global so dashboard.js can use real names
    ;(window as any).__KYNC_MEMBERS = members

    // Inject JavaScript via src (avoids inline-script CSP and template-literal issues)
    const script = document.createElement('script')
    script.id = 'kync-dash-js'
    script.src = '/dashboard.js?v=20260701c'
    document.getElementById('kync-dash-js')?.remove()
    document.head.appendChild(script)

    return () => {
      document.getElementById('kync-dash-css')?.remove()
      document.getElementById('kync-dash-js')?.remove()
    }
  }, [])

  /* "" Bedtime scheduler + browser notifications "" */
  useEffect(() => {
    let bedtimeEnabled  = false
    let bedtimeStart    = '20:30'
    let bedtimeEnd      = '07:00'
    let notifEnabled    = true
    let notifSentToday  = false
    let bedtimeShown    = false

    // Load settings then start polling
    fetch('/api/settings/bedtime')
      .then(r => r.json())
      .then(s => {
        bedtimeEnabled = s.bedtime_enabled ?? false
        bedtimeStart   = s.bedtime_start   ?? '20:30'
        bedtimeEnd     = s.bedtime_end     ?? '07:00'
        notifEnabled   = s.notifications_enabled ?? true
      })
      .catch(() => {})

    // Request browser notification permission once
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Check for upcoming alerts and fire browser notifications
    const fireNotifications = async () => {
      if (!notifEnabled) return
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
      if (notifSentToday) return

      try {
        const res  = await fetch('/api/entries')
        const rows = await res.json() as Record<string, unknown>[]
        const today = new Date()
        const todayStr = today.toISOString().slice(0, 10)
        const in3Days  = new Date(today); in3Days.setDate(today.getDate() + 3)
        const in3Str   = in3Days.toISOString().slice(0, 10)

        const alerts: string[] = []

        rows.forEach(r => {
          const date = r.date as string
          const type = r.type as string
          const title = r.title as string
          const completed = r.completed as boolean

          if (completed) return

          // Overdue tasks/chores/homework
          if (date < todayStr && ['task','chore','homework'].includes(type)) {
            alerts.push(`Overdue: ${title}`)
          }
          // Exams within 3 days
          if (type === 'exam' && date >= todayStr && date <= in3Str) {
            const daysLeft = Math.round((new Date(date + 'T00:00:00').getTime() - today.getTime()) / 86400000)
            alerts.push(`Exam in ${daysLeft === 0 ? 'TODAY' : daysLeft + (daysLeft === 1 ? ' day' : ' days')}: ${title}`)
          }
          // Bills due within 3 days (events with amber/bill colour)
          if (type === 'event' && date >= todayStr && date <= in3Str && (r.colour === 'amber')) {
            alerts.push(`Bill due: ${title}`)
          }
        })

        if (alerts.length > 0) {
          notifSentToday = true
          const body = alerts.slice(0, 3).join('\n') + (alerts.length > 3 ? `\n+${alerts.length - 3} more` : '')
          new Notification('KYNC - Family alerts', { body, icon: '/Kync_logo.png' })
        }
      } catch { /* ignore */ }
    }

    // Bedtime check
    const checkBedtime = () => {
      if (!bedtimeEnabled) return
      const now  = new Date()
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const isNight = bedtimeStart > bedtimeEnd
        ? hhmm >= bedtimeStart || hhmm < bedtimeEnd   // e.g. 20:30-07:00
        : hhmm >= bedtimeStart && hhmm < bedtimeEnd   // rare: same-day window

      if (isNight && !bedtimeShown) {
        bedtimeShown = true
        // Update wake time display
        const wakeEl = document.querySelector('.bedtime-wake-time')
        if (wakeEl) {
          const [h, m] = bedtimeEnd.split(':')
          const hNum = parseInt(h)
          wakeEl.textContent = `${hNum > 12 ? hNum - 12 : hNum || 12}:${m} ${hNum >= 12 ? 'PM' : 'AM'}`
        }
        ;(window as any).showBedtime?.()
      } else if (!isNight) {
        bedtimeShown = false
        // Reset daily notification flag at midnight
        if (hhmm === '00:00') notifSentToday = false
      }
    }

    // Run immediately then every minute
    setTimeout(() => {
      checkBedtime()
      fireNotifications()
    }, 2000)

    const interval = setInterval(() => {
      checkBedtime()
      // Fire notifications once per day at 8am
      const now = new Date()
      if (now.getHours() === 8 && now.getMinutes() === 0) {
        notifSentToday = false
        fireNotifications()
      }
    }, 60_000)

    return () => clearInterval(interval)
  }, [])

  const [todayStr, setTodayStr] = useState('')
  useEffect(() => {
    setTodayStr(new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }))
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  async function saveInvite() {
    const name = (document.getElementById('invite-name') as HTMLInputElement)?.value?.trim() ?? ''
    const selectedPill = document.querySelector('#modal-invite .role-pill.sel')
    const role = selectedPill?.textContent?.trim().toLowerCase() ?? 'member'
    const btn = document.getElementById('invite-btn') as HTMLButtonElement

    if (!name) { alert('Please enter a name.'); return }

    if (role === 'child') {
      const pin = ['pin-1','pin-2','pin-3','pin-4']
        .map(id => (document.getElementById(id) as HTMLInputElement)?.value ?? '')
        .join('')
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { alert('Please enter a 4-digit PIN.'); return }

      btn.disabled = true; btn.textContent = 'Saving...'
      try {
        const res = await fetch('/api/members/add-child', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, pin }),
        })
        const data = await res.json()
        if (!res.ok) { alert('Error: ' + (data.error ?? res.statusText)); return }
        ;(window as any).closeModal('modal-invite')
        setTimeout(() => (window as any).showToast('Child account created! 🎉'), 120)
        setTimeout(() => location.reload(), 800)
      } catch { alert('Network error - please try again.') }
      finally { btn.disabled = false; btn.textContent = 'Create child account' }
    } else {
      const email = (document.querySelector('#invite-email-section input[type=email]') as HTMLInputElement)?.value?.trim() ?? ''
      if (!email || !email.includes('@')) { alert('Please enter a valid email address.'); return }

      btn.disabled = true; btn.textContent = 'Sending...'
      try {
        const res = await fetch('/api/members/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, role }),
        })
        const data = await res.json()
        if (!res.ok) { alert('Error: ' + (data.error ?? res.statusText)); return }
        ;(window as any).closeModal('modal-invite')
        setTimeout(() => (window as any).showToast('Invite sent!'), 120)
      } catch { alert('Network error - please try again.') }
      finally { btn.disabled = false; btn.textContent = 'Send invite' }
    }
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" />

      {/* "" TOPBAR "" */}
      <div className="topbar">
        <div className="topbar-inner">
          <a className="tb-logo" href="/dashboard">
            <Image src="/Kync_logo.png" alt="KYNC" width={110} height={42} style={{ objectFit: 'contain', height: 42, width: 'auto' }} priority />
          </a>
          <nav className="tb-nav">
            <a className="tb-nav-btn active" href="/dashboard"><i className="ti ti-home"></i>Home</a>
            <a className="tb-nav-btn" href="/calendar"><i className="ti ti-calendar"></i>Calendar</a>
            <button className="tb-nav-btn" onClick={() => (window as any).openModal?.('modal-add-task')}><i className="ti ti-list-check"></i>Tasks</button>
            <button className="tb-nav-btn" onClick={() => (window as any).openModal?.('modal-reports')}><i className="ti ti-chart-bar"></i>Reports</button>
          </nav>
          <div className="tb-right">
            <button className="kids-view-btn" onClick={() => {
              const children = members.filter(m => m.role?.toLowerCase() === 'child')
              if (children.length) {
                (window as any).openKidsView?.('olivia', children[0].display_name)
              } else {
                const overlay = document.getElementById('kids-view-overlay')
                if (overlay) { overlay.classList.add('active'); document.body.style.overflow = 'hidden' }
              }
            }}><i className="ti ti-device-tablet"></i>Kids view</button>
            <button className="tb-help-btn" onClick={() => (window as any).openHelp?.()}>?</button>
            <div className="tb-avatar" style={{ background: 'var(--sj-bg)', color: 'var(--sj-fg)' }} onClick={() => (window as any).openModal?.('modal-member-sarah')}>{initials}</div>
            <button onClick={handleLogout} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', background: 'transparent', cursor: 'pointer' }}>Sign out</button>
          </div>
        </div>
      </div>

      {/* "" DASH BODY "" */}
      <div className="dash-body">

        {/* Welcome banner */}
        <div className="welcome-banner">
          <div>
            <div className="welcome-eyebrow">Welcome back</div>
            <div className="welcome-heading">{firstName}&apos;s<br />Family Hub</div>
            <div className="welcome-sub">{fName}{todayStr ? ` . ${todayStr}` : ''}</div>
            <div className="welcome-members">
              {members.slice(0, 5).map((m, i) => {
                const avatarColors = ['var(--sj-bg)', 'var(--mj-bg)', 'var(--oj-bg)', 'var(--lj-bg)', '#E8F4FE']
                const avatarFgColors = ['var(--sj-fg)', 'var(--mj-fg)', 'var(--oj-fg)', 'var(--lj-fg)', '#0C447C']
                const av = m.avatar_initials || m.display_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                return m.avatar_url
                  ? <img key={m.id} src={m.avatar_url} alt={m.display_name} className="welcome-av" style={{ objectFit: 'cover', borderRadius: '50%' }} />
                  : <div key={m.id} className="welcome-av" style={{ background: avatarColors[i] ?? 'var(--sj-bg)', color: avatarFgColors[i] ?? 'var(--sj-fg)' }}>{av}</div>
              })}
              {members.length > 5 && (
                <div className="welcome-av" style={{ background: '#E5E5E5', color: '#555' }}>+{members.length - 5}</div>
              )}
              <span className="welcome-member-count">{members.length === 1 ? '1 member' : `${members.length} members`}</span>
            </div>
          </div>
          <a className="welcome-cal-btn" href="/calendar"><i className="ti ti-calendar"></i><span>Open Calendar</span></a>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card"><div className="stat-num">7</div><div className="stat-lbl">Events this week</div><div className="stat-delta delta-up"><i className="ti ti-arrow-up-right" style={{ fontSize: 11 }}></i> 2 more than last week</div></div>
          <div className="stat-card"><div className="stat-num">3</div><div className="stat-lbl">Tasks due today</div><div className="stat-delta delta-warn"><i className="ti ti-alert-circle" style={{ fontSize: 11 }}></i> 1 overdue</div></div>
          <div className="stat-card"><div className="stat-num">$767</div><div className="stat-lbl">Spend this month</div><div className="stat-delta delta-warn"><i className="ti ti-receipt" style={{ fontSize: 11 }}></i> 2 bills due soon</div></div>
          <div className="stat-card"><div className="stat-num">235</div><div className="stat-lbl">Kids points total</div><div className="stat-delta delta-up"><i className="ti ti-star" style={{ fontSize: 11 }}></i> Leading this week</div></div>
        </div>

        {/* "" Quick Actions "" */}
        <div className="section-hd"><div className="section-title">Quick actions</div></div>
        <div className="actions-grid">
          <div className="action-card ac-green" onClick={() => (window as any).openModal('modal-invite')}>
            <div className="action-icon ai-green"><i className="ti ti-user-plus"></i></div>
            <div><div className="action-label">Invite member</div><div className="action-sub">Send a family invite</div></div>
          </div>
          <div className="action-card ac-blue" onClick={() => (window as any).openModal('modal-add-event')}>
            <div className="action-icon ai-blue"><i className="ti ti-calendar-plus"></i></div>
            <div><div className="action-label">Add event</div><div className="action-sub">To the family calendar</div></div>
          </div>
          <div className="action-card ac-orange" onClick={() => (window as any).openModal('modal-add-task')}>
            <div className="action-icon ai-orange"><i className="ti ti-circle-plus"></i></div>
            <div><div className="action-label">Add task</div><div className="action-sub">Assign to a member</div></div>
          </div>
          <div className="action-card ac-purple" onClick={() => (window as any).openModal('modal-scan')}>
            <div className="action-icon ai-purple"><i className="ti ti-scan"></i></div>
            <div><div className="action-label">AI scan</div><div className="action-sub">Reads docs &amp; photos</div></div>
          </div>
          <div className="action-card ac-amber" onClick={() => (window as any).openModal('modal-add-bill')}>
            <div className="action-icon ai-amber"><i className="ti ti-receipt"></i></div>
            <div><div className="action-label">Add bill</div><div className="action-sub">Track payments</div></div>
          </div>
          <div className="action-card ac-pink" onClick={() => (window as any).openModal('modal-kids-chore')}>
            <div className="action-icon ai-pink"><i className="ti ti-list-check"></i></div>
            <div><div className="action-label">Add chore</div><div className="action-sub">AM or PM for kids</div></div>
          </div>
          <div className="action-card ac-teal" onClick={() => (window as any).openModal('modal-add-homework')}>
            <div className="action-icon ai-teal"><i className="ti ti-pencil"></i></div>
            <div><div className="action-label">Add homework</div><div className="action-sub">Subject &amp; due date</div></div>
          </div>
          <div className="action-card ac-lilac" onClick={() => (window as any).openModal('modal-add-exam')}>
            <div className="action-icon ai-lilac"><i className="ti ti-notes"></i></div>
            <div><div className="action-label">Add exam</div><div className="action-sub">With revision planner</div></div>
          </div>
          <div className="action-card ac-emerald" onClick={() => (window as any).openModal('modal-reports')}>
            <div className="action-icon ai-emerald"><i className="ti ti-chart-bar"></i></div>
            <div><div className="action-label">Financial report</div><div className="action-sub">Bills by category</div></div>
          </div>
          <div className="action-card ac-dark" onClick={() => window.location.href = '/family'}>
            <div className="action-icon ai-dark"><i className="ti ti-settings"></i></div>
            <div><div className="action-label">Family settings</div><div className="action-sub">Manage &amp; configure</div></div>
          </div>
        </div>

        {/* "" Family Members "" */}
        <div className="section-hd">
          <div className="section-title">Family members</div>
          <div className="section-link" onClick={() => (window as any).openModal('modal-invite')}>+ Invite</div>
        </div>
        <div className="members-list">
          {members.map((m, i) => {
            const avatarColors = ['var(--sj-bg)', 'var(--mj-bg)', 'var(--oj-bg)', 'var(--lj-bg)']
            const avatarFgColors = ['var(--sj-fg)', 'var(--mj-fg)', 'var(--oj-fg)', 'var(--lj-fg)']
            const bg = avatarColors[i] || 'var(--sj-bg)'
            const fg = avatarFgColors[i] || 'var(--sj-fg)'
            const av = m.avatar_initials || m.display_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            const isAdmin = m.role === 'admin'
            const isChild = m.role === 'child'
            return (
              <div key={m.id} className="member-row" onClick={() => window.location.href = `/family/${m.id}`} style={{ cursor: 'pointer' }}>
                {m.avatar_url
                  ? <img src={m.avatar_url} alt={m.display_name} className="member-av" style={{ objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }} />
                  : <div className="member-av" style={{ background: bg, color: fg }}>{av}</div>
                }
                <div className="member-info">
                  <div className="member-name">{m.display_name}</div>
                  <div className="member-meta">
                    <span className={`member-role-badge role-${m.role}`}>{m.role.charAt(0).toUpperCase() + m.role.slice(1)}</span>
                    <span>{isChild ? 'PIN login' : isAdmin ? userEmail : ''}</span>
                  </div>
                </div>
                <div className="member-actions-dash" onClick={e => e.stopPropagation()}>
                  <button className="dash-action-btn" title="Edit" onClick={() => window.location.href = `/family/${m.id}`}>
                    <i className="ti ti-pencil" style={{ fontSize: 13 }}></i>
                  </button>
                  {m.role !== 'admin' && (
                    <button className="dash-action-btn danger" title="Remove" onClick={async () => {
                      if (!confirm(`Remove ${m.display_name} from the family?`)) return
                      const res = await fetch(`/api/members/${m.id}`, { method: 'DELETE' })
                      if (res.ok) window.location.reload()
                    }}>
                      <i className="ti ti-trash" style={{ fontSize: 13 }}></i>
                    </button>
                  )}
                </div>
                <i className="ti ti-chevron-right member-chevron"></i>
              </div>
            )
          })}
        </div>

        {/* "" Recent Activity "" */}
        <div className="section-hd" style={{ marginTop: 28 }}>
          <div className="section-title">Recent activity</div>
        </div>
        <div className="activity-list">
          <div className="activity-row">
            <div className="activity-icon" style={{ background: 'var(--green-lt)', color: 'var(--green)' }}><i className="ti ti-circle-check"></i></div>
            <div className="activity-text"><strong>Chore completed</strong> . +5 pts awarded</div>
            <div className="activity-time">2 min ago</div>
          </div>
          <div className="activity-row">
            <div className="activity-icon" style={{ background: '#EDF4FE', color: 'var(--oj-ac)' }}><i className="ti ti-calendar-plus"></i></div>
            <div className="activity-text"><strong>{displayName.split(' ')[0]}</strong> added an event to the calendar</div>
            <div className="activity-time">1 hr ago</div>
          </div>
          <div className="activity-row">
            <div className="activity-icon" style={{ background: 'var(--lilac-lt)', color: 'var(--lilac)' }}><i className="ti ti-notes"></i></div>
            <div className="activity-text"><strong>Exam</strong> added with revision sessions planned</div>
            <div className="activity-time">3 hrs ago</div>
          </div>
          <div className="activity-row">
            <div className="activity-icon" style={{ background: '#F2F1FD', color: 'var(--fa-ac)' }}><i className="ti ti-scan"></i></div>
            <div className="activity-text"><strong>AI</strong> read a school newsletter - extracted 3 events for review</div>
            <div className="activity-time">4 hrs ago</div>
          </div>
          <div className="activity-row">
            <div className="activity-icon" style={{ background: 'var(--amber-lt)', color: 'var(--amber)' }}><i className="ti ti-receipt"></i></div>
            <div className="activity-text"><strong>Bill due</strong> in 1 day - check your bills tracker</div>
            <div className="activity-time">Today</div>
          </div>
          <div className="activity-row">
            <div className="activity-icon" style={{ background: '#D1FAE5', color: '#059669' }}><i className="ti ti-chart-bar"></i></div>
            <div className="activity-text"><strong>Monthly report</strong> ready - view in Financial Reports</div>
            <div className="activity-time">Yesterday</div>
          </div>
        </div>

      </div>{/* end dash-body */}

      {/*  MODALS  */}

      {/* Invite member */}
      <div className="modal-backdrop" id="modal-invite" onClick={(e) => (window as any).backdropClose(e,'modal-invite')}>
        <div className="modal"><div className="modal-handle"></div>
          <div className="modal-head">
            <div><div className="modal-title">Add a member</div><div className="modal-sub" id="invite-sub">Set up a PIN-only account for your child.</div></div>
            <button className="modal-close" onClick={() => (window as any).closeModal('modal-invite')}><i className="ti ti-x"></i></button>
          </div>
          <div className="modal-body">
            <div className="modal-field"><label>Display name</label><input type="text" id="invite-name" placeholder="e.g. Grandma or Jack" /></div>
            <div className="modal-field"><label>Role</label>
              <div className="role-pills">
                <div className="role-pill" onClick={(e) => (window as any).selectInviteRole(e.currentTarget,'admin')}>Admin</div>
                <div className="role-pill" onClick={(e) => (window as any).selectInviteRole(e.currentTarget,'member')}>Member</div>
                <div className="role-pill sel" onClick={(e) => (window as any).selectInviteRole(e.currentTarget,'child')}>Child</div>
                <div className="role-pill" onClick={(e) => (window as any).selectInviteRole(e.currentTarget,'guest')}>Guest</div>
              </div>
            </div>
            <div id="invite-email-section" style={{ display: 'none' }}>
              <div className="modal-field"><label>Email address</label><input type="email" placeholder="email@example.com" autoComplete="off" /></div>
              <div className="modal-field"><label>Task permissions</label>
                <div className="perm-grid">
                  <div className="perm-toggle on" onClick={(e) => (window as any).togglePerm(e.currentTarget)}><span className="perm-toggle-lbl">Add tasks</span><div className="toggle-switch"></div></div>
                  <div className="perm-toggle" onClick={(e) => (window as any).togglePerm(e.currentTarget)}><span className="perm-toggle-lbl">Delete tasks</span><div className="toggle-switch"></div></div>
                  <div className="perm-toggle on" onClick={(e) => (window as any).togglePerm(e.currentTarget)}><span className="perm-toggle-lbl">Edit tasks</span><div className="toggle-switch"></div></div>
                  <div className="perm-toggle on" onClick={(e) => (window as any).togglePerm(e.currentTarget)}><span className="perm-toggle-lbl">Complete tasks</span><div className="toggle-switch"></div></div>
                </div>
              </div>
            </div>
            <div id="invite-pin-section">
              <div style={{ background: 'var(--amber-lt)', border: '1px solid #FDE68A', borderRadius: 'var(--r-md)', padding: '10px 12px', marginBottom: 14, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                <i className="ti ti-info-circle" style={{ verticalAlign: 'middle', marginRight: 4, color: 'var(--amber)' }}></i>
                Child accounts use a <strong>4-digit PIN</strong> - no email needed. Perfect for shared tablets.
              </div>
              <div className="modal-field"><label>4-digit PIN</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {['pin-1','pin-2','pin-3','pin-4'].map((id, i, arr) => (
                    <input key={id} type="number" id={id} maxLength={1} style={{ width: 56, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 800, border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg)', outline: 'none' }}
                      onInput={(e) => (window as any).pinNext(e.currentTarget, arr[i+1] || null)}
                      onClick={(e) => (e.currentTarget as HTMLInputElement).select()} />
                  ))}
                </div>
              </div>
              <div className="modal-field"><label>Colour</label>
                <div className="colour-row">
                  {['#9FE1CB','#F5C4B3','#B5D4F4','#F4C0D1','#CECBF6','#FDE68A'].map(c => (
                    <div key={c} className="colour-swatch" style={{ background: c }} onClick={(e) => (window as any).selectColour(e.currentTarget,'invite')}></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => (window as any).closeModal('modal-invite')}>Cancel</button>
              <button className="modal-btn modal-btn-primary" id="invite-btn" onClick={saveInvite}>Create child account</button>
            </div>
          </div>
        </div>
      </div>

      {/* Add task */}
      {/* ════ ADD EVENT MODAL ════ */}
      <div className="modal-backdrop" id="modal-add-event" onClick={(e) => (window as any).backdropClose(e,'modal-add-event')}>
        <div className="modal"><div className="modal-handle"></div>
          <div className="modal-head">
            <div><div className="modal-title">Add event</div><div className="modal-sub">Add to the family calendar.</div></div>
            <button className="modal-close" onClick={() => (window as any).closeModal('modal-add-event')}><i className="ti ti-x"></i></button>
          </div>
          <div className="modal-body">
            <div className="modal-field"><label>Event title</label><input type="text" placeholder="e.g. School sports day" /></div>
            <div className="modal-2col">
              <div className="modal-field" style={{ marginBottom:0 }}><label>Date</label><input type="date" /></div>
              <div className="modal-field" style={{ marginBottom:0 }}><label>Start time <span style={{ fontSize:10, fontWeight:500, color:'var(--text-3)' }}>Optional</span></label><input type="time" /></div>
            </div>
            <div className="modal-field" style={{ marginTop:12 }}><label>End time <span style={{ fontSize:10, fontWeight:500, color:'var(--text-3)' }}>Optional</span></label><input type="time" /></div>
            <div className="modal-field">
              <label>Assign to <span style={{ fontSize:10, fontWeight:500, color:'var(--text-3)' }}>Select one or more</span></label>
              <div className="role-pills" data-multi="true">
                <div className="role-pill sel" data-everyone="true" onClick={(e) => (window as any).selectRole(e.currentTarget)}>Everyone</div>
                {members.map(m => (
                  <div key={m.id} className="role-pill" onClick={(e) => (window as any).selectRole(e.currentTarget)}>{m.display_name.split(' ')[0]}</div>
                ))}
              </div>
            </div>
            <div className="modal-field">
              <label>Repeats</label>
              <div className="role-pills">
                <div className="role-pill sel" data-recur="none" onClick={(e) => (window as any).selectRecurring(e.currentTarget,'event')}>None</div>
                <div className="role-pill" data-recur="daily" onClick={(e) => (window as any).selectRecurring(e.currentTarget,'event')}>Daily</div>
                <div className="role-pill" data-recur="weekly" onClick={(e) => (window as any).selectRecurring(e.currentTarget,'event')}>Weekly</div>
                <div className="role-pill" data-recur="monthly" onClick={(e) => (window as any).selectRecurring(e.currentTarget,'event')}>Monthly</div>
              </div>
              <div id="recur-weekly-event" style={{ display:'none', marginTop:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', marginBottom:6 }}>On which days?</div>
                <div className="role-pills" style={{ flexWrap:'wrap' }}>
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} className="role-pill" onClick={(e) => e.currentTarget.classList.toggle('sel')}>{d}</div>)}
                </div>
              </div>
              <div id="recur-end-event" style={{ display:'none', marginTop:12, padding:'12px 14px', background:'var(--bg)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', marginBottom:8 }}>ENDS</div>
                <div className="role-pills" style={{ marginBottom:10 }}>
                  <div className="role-pill sel" data-endtype="never" onClick={(e) => (window as any).selectRecurEnd(e.currentTarget,'event')}>Never</div>
                  <div className="role-pill" data-endtype="on" onClick={(e) => (window as any).selectRecurEnd(e.currentTarget,'event')}>On date</div>
                  <div className="role-pill" data-endtype="after" onClick={(e) => (window as any).selectRecurEnd(e.currentTarget,'event')}>After</div>
                </div>
                <div id="recur-end-on-event" style={{ display:'none' }}>
                  <input type="date" id="recur-end-date-event" style={{ width:'100%', padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--surface)', outline:'none' }} />
                </div>
                <div id="recur-end-after-event" style={{ display:'none', alignItems:'center', gap:8 }}>
                  <input type="number" id="recur-end-count-event" min={1} max={365} defaultValue={10} style={{ width:80, padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--surface)', outline:'none' }} />
                  <span style={{ fontSize:13, color:'var(--text-2)' }}>occurrences</span>
                </div>
              </div>
            </div>
            <div className="modal-field"><label>Notes <span style={{ fontSize:10, fontWeight:500, color:'var(--text-3)' }}>Optional</span></label><textarea rows={2} placeholder="Any extra details…" style={{ resize:'none' }}></textarea></div>
            <div className="modal-field">
              <label>Attachments <span style={{ fontSize:10, fontWeight:500, color:'var(--text-3)' }}>Optional</span></label>
              <div className="attach-drop" onClick={() => document.getElementById('attach-event')?.click()}>
                <input type="file" id="attach-event" multiple accept="image/*,.pdf,.doc,.docx" onChange={(e) => (window as any).handleAttach(e.currentTarget,'event')} />
                <i className="ti ti-paperclip" style={{ fontSize:16, color:'var(--text-3)' }}></i>
                <span style={{ fontSize:12, color:'var(--text-3)' }}>Tap to attach files or photos</span>
              </div>
              <div className="attach-list" id="attach-list-event"></div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => (window as any).closeModal('modal-add-event')}>Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={() => (window as any).saveEvent()}>Add event</button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop" id="modal-add-task" onClick={(e) => (window as any).backdropClose(e,'modal-add-task')}>
        <div className="modal"><div className="modal-handle"></div>
          <div className="modal-head">
            <div><div className="modal-title">Add task</div><div className="modal-sub">Assign a task to a family member.</div></div>
            <button className="modal-close" onClick={() => (window as any).closeModal('modal-add-task')}><i className="ti ti-x"></i></button>
          </div>
          <div className="modal-body">
            <div className="modal-field"><label>Task title</label><input type="text" placeholder="e.g. Book car service" /></div>
            <div className="modal-field">
              <label>Assign to <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-3)' }}>Select one or more</span></label>
              <div className="role-pills" data-multi="true">
                <div className="role-pill sel" data-everyone="true" onClick={(e) => (window as any).selectRole(e.currentTarget)}>Everyone</div>
                {members.map(m => (
                  <div key={m.id} className="role-pill" onClick={(e) => (window as any).selectRole(e.currentTarget)}>{m.display_name.split(' ')[0]}</div>
                ))}
              </div>
            </div>
            <div className="modal-field"><label>Due date</label><input type="date" /></div>
            <div className="modal-field">
              <label>Repeats</label>
              <div className="role-pills">
                <div className="role-pill sel" data-recur="none" onClick={(e) => (window as any).selectRecurring(e.currentTarget,'task')}>None</div>
                <div className="role-pill" data-recur="daily" onClick={(e) => (window as any).selectRecurring(e.currentTarget,'task')}>Daily</div>
                <div className="role-pill" data-recur="weekly" onClick={(e) => (window as any).selectRecurring(e.currentTarget,'task')}>Weekly</div>
                <div className="role-pill" data-recur="monthly" onClick={(e) => (window as any).selectRecurring(e.currentTarget,'task')}>Monthly</div>
              </div>
              <div id="recur-weekly-task" style={{ display:'none', marginTop:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', marginBottom:6 }}>On which days?</div>
                <div className="role-pills" style={{ flexWrap:'wrap' }}>
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} className="role-pill" onClick={(e) => e.currentTarget.classList.toggle('sel')}>{d}</div>)}
                </div>
              </div>
              <div id="recur-monthly-task" style={{ display:'none', marginTop:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', marginBottom:6 }}>Repeat on the same...</div>
                <div className="role-pills">
                  <div className="role-pill sel" data-monthtype="date" onClick={(e) => (window as any).selectMonthlyType(e.currentTarget,'task')}>"... Date (e.g. 15th)</div>
                  <div className="role-pill" data-monthtype="day" onClick={(e) => (window as any).selectMonthlyType(e.currentTarget,'task')}>"+ Day (e.g. last Saturday)</div>
                </div>
                <div id="monthly-date-task" style={{ marginTop:8 }}>
                  <input type="number" min={1} max={31} placeholder="Day of month (e.g. 15)" style={{ width:'100%', padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--bg)', outline:'none' }} />
                </div>
                <div id="monthly-day-task" style={{ display:'none', marginTop:8 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <select style={{ padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--bg)', outline:'none' }}>
                      <option>First</option><option>Second</option><option>Third</option><option>Fourth</option><option>Last</option>
                    </select>
                    <select style={{ padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--bg)', outline:'none' }}>
                      <option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option>
                    </select>
                  </div>
                </div>
              </div>
              <div id="recur-end-task" style={{ display:'none', marginTop:12, padding:'12px 14px', background:'var(--bg)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', marginBottom:8 }}>ENDS</div>
                <div className="role-pills" style={{ marginBottom:10 }}>
                  <div className="role-pill sel" data-endtype="never" onClick={(e) => (window as any).selectRecurEnd(e.currentTarget,'task')}>Never</div>
                  <div className="role-pill" data-endtype="on" onClick={(e) => (window as any).selectRecurEnd(e.currentTarget,'task')}>On date</div>
                  <div className="role-pill" data-endtype="after" onClick={(e) => (window as any).selectRecurEnd(e.currentTarget,'task')}>After</div>
                </div>
                <div id="recur-end-on-task" style={{ display:'none' }}>
                  <input type="date" id="recur-end-date-task" style={{ width:'100%', padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--surface)', outline:'none' }} />
                </div>
                <div id="recur-end-after-task" style={{ display:'none', alignItems:'center', gap:8 }}>
                  <input type="number" id="recur-end-count-task" min={1} max={365} defaultValue={10} style={{ width:80, padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--surface)', outline:'none' }} />
                  <span style={{ fontSize:13, color:'var(--text-2)' }}>occurrences</span>
                </div>
              </div>
            </div>
            <div className="modal-field"><label>Notes</label><input type="text" placeholder="Any extra details..." /></div>
            <div className="modal-field">
              <label>Attachments <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-3)' }}>Optional</span></label>
              <div className="attach-drop" onClick={() => document.getElementById('attach-task')?.click()}>
                <input type="file" id="attach-task" multiple accept="image/*,.pdf,.doc,.docx" onChange={(e) => (window as any).handleAttach(e.currentTarget,'task')} />
                <i className="ti ti-paperclip" style={{ fontSize: 16, color: 'var(--text-3)' }}></i>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Tap to attach files or photos</span>
              </div>
              <div className="attach-list" id="attach-list-task"></div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => (window as any).closeModal('modal-add-task')}>Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={() => (window as any).saveTask()}>Add task</button>
            </div>
          </div>
        </div>
      </div>

      {/* Add chore */}
      <div className="modal-backdrop" id="modal-kids-chore" onClick={(e) => (window as any).backdropClose(e,'modal-kids-chore')}>
        <div className="modal"><div className="modal-handle"></div>
          <div className="modal-head">
            <div><div className="modal-title">Add chore</div><div className="modal-sub">Set a repeating chore for a family member.</div></div>
            <button className="modal-close" onClick={() => (window as any).closeModal('modal-kids-chore')}><i className="ti ti-x"></i></button>
          </div>
          <div className="modal-body">
            <div className="modal-field"><label>Chore title</label><input type="text" placeholder="e.g. Make bed" /></div>
            <div className="modal-field">
              <label>Assign to <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-3)' }}>Select one or more</span></label>
              <div className="role-pills" data-multi="true">
                <div className="role-pill sel" data-everyone="true" onClick={(e) => (window as any).selectRole(e.currentTarget)}>Everyone</div>
                {members.map(m => (
                  <div key={m.id} className="role-pill" onClick={(e) => (window as any).selectRole(e.currentTarget)}>{m.display_name.split(' ')[0]}</div>
                ))}
              </div>
            </div>
            <div className="modal-field">
              <label>Time of day <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-3)' }}>Select one or both</span></label>
              <div className="role-pills">
                <div className="role-pill sel" onClick={(e) => e.currentTarget.classList.toggle('sel')} data-tod="am">Morning (AM)</div>
                <div className="role-pill" onClick={(e) => e.currentTarget.classList.toggle('sel')} data-tod="pm">Evening (PM)</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}><i className="ti ti-info-circle" style={{ verticalAlign: 'middle' }}></i> Select both for twice-daily chores like teeth brushing</div>
            </div>
            <div className="modal-field">
              <label>Repeats</label>
              <div className="role-pills">
                <div className="role-pill sel" data-recur="none" onClick={(e) => (window as any).selectRecurring(e.currentTarget,'chore')}>None</div>
                <div className="role-pill" data-recur="daily" onClick={(e) => (window as any).selectRecurring(e.currentTarget,'chore')}>Daily</div>
                <div className="role-pill" data-recur="weekly" onClick={(e) => (window as any).selectRecurring(e.currentTarget,'chore')}>Weekly</div>
                <div className="role-pill" data-recur="monthly" onClick={(e) => (window as any).selectRecurring(e.currentTarget,'chore')}>Monthly</div>
              </div>
              <div id="recur-weekly-chore" style={{ display:'none', marginTop:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', marginBottom:6 }}>On which days?</div>
                <div className="role-pills" style={{ flexWrap:'wrap' }}>
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} className="role-pill" onClick={(e) => e.currentTarget.classList.toggle('sel')}>{d}</div>)}
                </div>
              </div>
              <div id="recur-monthly-chore" style={{ display:'none', marginTop:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', marginBottom:6 }}>Repeat on the same...</div>
                <div className="role-pills">
                  <div className="role-pill sel" data-monthtype="date" onClick={(e) => (window as any).selectMonthlyType(e.currentTarget,'chore')}>"... Date (e.g. 15th)</div>
                  <div className="role-pill" data-monthtype="day" onClick={(e) => (window as any).selectMonthlyType(e.currentTarget,'chore')}>"+ Day (e.g. last Saturday)</div>
                </div>
                <div id="monthly-date-chore" style={{ marginTop:8 }}>
                  <input type="number" min={1} max={31} placeholder="Day of month (e.g. 15)" style={{ width:'100%', padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--bg)', outline:'none' }} />
                </div>
                <div id="monthly-day-chore" style={{ display:'none', marginTop:8 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <select style={{ padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--bg)', outline:'none' }}>
                      <option>First</option><option>Second</option><option>Third</option><option>Fourth</option><option>Last</option>
                    </select>
                    <select style={{ padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--bg)', outline:'none' }}>
                      <option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option>
                    </select>
                  </div>
                </div>
              </div>
              <div id="recur-end-chore" style={{ display:'none', marginTop:12, padding:'12px 14px', background:'var(--bg)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', marginBottom:8 }}>ENDS</div>
                <div className="role-pills" style={{ marginBottom:10 }}>
                  <div className="role-pill sel" data-endtype="never" onClick={(e) => (window as any).selectRecurEnd(e.currentTarget,'chore')}>Never</div>
                  <div className="role-pill" data-endtype="on" onClick={(e) => (window as any).selectRecurEnd(e.currentTarget,'chore')}>On date</div>
                  <div className="role-pill" data-endtype="after" onClick={(e) => (window as any).selectRecurEnd(e.currentTarget,'chore')}>After</div>
                </div>
                <div id="recur-end-on-chore" style={{ display:'none' }}>
                  <input type="date" id="recur-end-date-chore" style={{ width:'100%', padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--surface)', outline:'none' }} />
                </div>
                <div id="recur-end-after-chore" style={{ display:'none', alignItems:'center', gap:8 }}>
                  <input type="number" id="recur-end-count-chore" min={1} max={365} defaultValue={10} style={{ width:80, padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--surface)', outline:'none' }} />
                  <span style={{ fontSize:13, color:'var(--text-2)' }}>occurrences</span>
                </div>
              </div>
            </div>
            <div className="modal-field"><label>Points value</label><input id="chore-points" type="number" defaultValue={5} min={0} max={100} /></div>
            <div className="modal-field">
              <label>Attachments <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-3)' }}>Optional</span></label>
              <div className="attach-drop" onClick={() => document.getElementById('attach-chore')?.click()}>
                <input type="file" id="attach-chore" multiple accept="image/*,.pdf,.doc,.docx" onChange={(e) => (window as any).handleAttach(e.currentTarget,'chore')} />
                <i className="ti ti-paperclip" style={{ fontSize: 16, color: 'var(--text-3)' }}></i>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Tap to attach files or photos</span>
              </div>
              <div className="attach-list" id="attach-list-chore"></div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => (window as any).closeModal('modal-kids-chore')}>Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={() => (window as any).saveChore()}>Add chore</button>
            </div>
          </div>
        </div>
      </div>

      {/* Add homework */}
      <div className="modal-backdrop" id="modal-add-homework" onClick={(e) => (window as any).backdropClose(e,'modal-add-homework')}>
        <div className="modal"><div className="modal-handle"></div>
          <div className="modal-head">
            <div><div className="modal-title">Add homework</div><div className="modal-sub">Track school assignments by subject.</div></div>
            <button className="modal-close" onClick={() => (window as any).closeModal('modal-add-homework')}><i className="ti ti-x"></i></button>
          </div>
          <div className="modal-body">
            <div className="modal-field"><label>Assignment title</label><input type="text" placeholder="e.g. Chapter 7 worksheet" /></div>
            <div className="modal-field">
              <label>Assign to <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-3)' }}>Select one or more</span></label>
              <div className="role-pills" data-multi="true">
                <div className="role-pill sel" data-everyone="true" onClick={(e) => (window as any).selectRole(e.currentTarget)}>Everyone</div>
                {members.map(m => (
                  <div key={m.id} className="role-pill" onClick={(e) => (window as any).selectRole(e.currentTarget)}>{m.display_name.split(' ')[0]}</div>
                ))}
              </div>
            </div>
            <div className="modal-field"><label>Subject</label><select><option>Maths</option><option>English</option><option>Science</option><option>History</option><option>Reading</option><option>Other</option></select></div>
            <div className="modal-field"><label>Due date</label><input type="date" /></div>
            <div className="modal-field">
              <label>Repeats</label>
              <div className="role-pills">
                <div className="role-pill sel" data-recur="none" onClick={(e) => (window as any).selectRecurring(e.currentTarget,'hw')}>None</div>
                <div className="role-pill" data-recur="daily" onClick={(e) => (window as any).selectRecurring(e.currentTarget,'hw')}>Daily</div>
                <div className="role-pill" data-recur="weekly" onClick={(e) => (window as any).selectRecurring(e.currentTarget,'hw')}>Weekly</div>
                <div className="role-pill" data-recur="monthly" onClick={(e) => (window as any).selectRecurring(e.currentTarget,'hw')}>Monthly</div>
              </div>
              <div id="recur-weekly-hw" style={{ display:'none', marginTop:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', marginBottom:6 }}>On which days?</div>
                <div className="role-pills" style={{ flexWrap:'wrap' }}>
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} className="role-pill" onClick={(e) => e.currentTarget.classList.toggle('sel')}>{d}</div>)}
                </div>
              </div>
              <div id="recur-monthly-hw" style={{ display:'none', marginTop:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', marginBottom:6 }}>Repeat on the same...</div>
                <div className="role-pills">
                  <div className="role-pill sel" data-monthtype="date" onClick={(e) => (window as any).selectMonthlyType(e.currentTarget,'hw')}>"... Date (e.g. 15th)</div>
                  <div className="role-pill" data-monthtype="day" onClick={(e) => (window as any).selectMonthlyType(e.currentTarget,'hw')}>"+ Day (e.g. last Saturday)</div>
                </div>
                <div id="monthly-date-hw" style={{ marginTop:8 }}>
                  <input type="number" min={1} max={31} placeholder="Day of month (e.g. 15)" style={{ width:'100%', padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--bg)', outline:'none' }} />
                </div>
                <div id="monthly-day-hw" style={{ display:'none', marginTop:8 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <select style={{ padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--bg)', outline:'none' }}>
                      <option>First</option><option>Second</option><option>Third</option><option>Fourth</option><option>Last</option>
                    </select>
                    <select style={{ padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--bg)', outline:'none' }}>
                      <option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option>
                    </select>
                  </div>
                </div>
              </div>
              <div id="recur-end-hw" style={{ display:'none', marginTop:12, padding:'12px 14px', background:'var(--bg)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', marginBottom:8 }}>ENDS</div>
                <div className="role-pills" style={{ marginBottom:10 }}>
                  <div className="role-pill sel" data-endtype="never" onClick={(e) => (window as any).selectRecurEnd(e.currentTarget,'hw')}>Never</div>
                  <div className="role-pill" data-endtype="on" onClick={(e) => (window as any).selectRecurEnd(e.currentTarget,'hw')}>On date</div>
                  <div className="role-pill" data-endtype="after" onClick={(e) => (window as any).selectRecurEnd(e.currentTarget,'hw')}>After</div>
                </div>
                <div id="recur-end-on-hw" style={{ display:'none' }}>
                  <input type="date" id="recur-end-date-hw" style={{ width:'100%', padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--surface)', outline:'none' }} />
                </div>
                <div id="recur-end-after-hw" style={{ display:'none', alignItems:'center', gap:8 }}>
                  <input type="number" id="recur-end-count-hw" min={1} max={365} defaultValue={10} style={{ width:80, padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontSize:14, background:'var(--surface)', outline:'none' }} />
                  <span style={{ fontSize:13, color:'var(--text-2)' }}>occurrences</span>
                </div>
              </div>
            </div>
            <div className="modal-field">
              <label>Attachments <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-3)' }}>Optional</span></label>
              <div className="attach-drop" onClick={() => document.getElementById('attach-homework')?.click()}>
                <input type="file" id="attach-homework" multiple accept="image/*,.pdf,.doc,.docx" onChange={(e) => (window as any).handleAttach(e.currentTarget,'homework')} />
                <i className="ti ti-paperclip" style={{ fontSize: 16, color: 'var(--text-3)' }}></i>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Tap to attach files or photos</span>
              </div>
              <div className="attach-list" id="attach-list-homework"></div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => (window as any).closeModal('modal-add-homework')}>Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={() => (window as any).saveAndToast('modal-add-homework','Homework added')}>Add homework</button>
            </div>
          </div>
        </div>
      </div>

      {/* Add exam */}
      <div className="modal-backdrop" id="modal-add-exam" onClick={(e) => (window as any).backdropClose(e,'modal-add-exam')}>
        <div className="modal"><div className="modal-handle"></div>
          <div className="modal-head">
            <div><div className="modal-title">Add exam</div><div className="modal-sub">Track an upcoming test with revision planner.</div></div>
            <button className="modal-close" onClick={() => (window as any).closeModal('modal-add-exam')}><i className="ti ti-x"></i></button>
          </div>
          <div className="modal-body">
            <div className="modal-field"><label>Exam title</label><input type="text" placeholder="e.g. Maths Test" /></div>
            <div className="modal-field">
              <label>Assign to <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-3)' }}>Select one or more</span></label>
              <div className="role-pills" data-multi="true">
                <div className="role-pill sel" data-everyone="true" onClick={(e) => (window as any).selectRole(e.currentTarget)}>Everyone</div>
                {members.map(m => (
                  <div key={m.id} className="role-pill" onClick={(e) => (window as any).selectRole(e.currentTarget)}>{m.display_name.split(' ')[0]}</div>
                ))}
              </div>
            </div>
            <div className="modal-field"><label>Subject</label><select><option>Maths</option><option>English</option><option>Science</option><option>History</option><option>Spelling</option><option>Other</option></select></div>
            <div className="modal-field"><label>Exam date</label><input type="date" /></div>
            <div className="modal-field">
              <label>Urgency</label>
              <div className="urgency-pills">
                <div className="urgency-pill sel-soon" onClick={(e) => (window as any).selectUrgency(e.currentTarget,'soon')}><div className="up-icon">"'</div><div className="up-label">Soon</div><div className="up-sub">Under 5 days</div></div>
                <div className="urgency-pill" onClick={(e) => (window as any).selectUrgency(e.currentTarget,'mid')}><div className="up-icon">[yellow]</div><div className="up-label">Coming up</div><div className="up-sub">5-14 days</div></div>
                <div className="urgency-pill" onClick={(e) => (window as any).selectUrgency(e.currentTarget,'ok')}><div className="up-icon">[green]</div><div className="up-label">Plenty of time</div><div className="up-sub">15+ days</div></div>
              </div>
            </div>
            <div className="modal-field"><label>Notes (optional)</label><input type="text" placeholder="e.g. Chapters 1-5, open book" /></div>
            <div className="modal-actions" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <button className="modal-btn modal-btn-secondary" onClick={() => (window as any).closeModal('modal-add-exam')}>Cancel</button>
              <button className="modal-btn modal-btn-secondary" onClick={() => (window as any).saveExamOnly()}>Save only</button>
              <button className="modal-btn modal-btn-primary" onClick={() => (window as any).saveExamThenRevise()}>Save + add revision →</button>
            </div>
          </div>
        </div>
      </div>

      {/* Add revision */}
      <div className="modal-backdrop" id="modal-add-revision" onClick={(e) => (window as any).backdropClose(e,'modal-add-revision')}>
        <div className="modal"><div className="modal-handle"></div>
          <div className="modal-head">
            <div><div className="modal-title">Add revision sessions</div><div className="modal-sub">Schedule study blocks leading up to the exam.</div></div>
            <button className="modal-close" onClick={() => (window as any).closeModal('modal-add-revision')}><i className="ti ti-x"></i></button>
          </div>
          <div className="modal-body">
            <div className="modal-field"><label>Subject / topic</label><input type="text" id="rev-title" placeholder="e.g. Maths — number patterns" /></div>
            <div className="modal-2col">
              <div className="modal-field"><label>First session date</label><input type="date" id="rev-date" /></div>
              <div className="modal-field"><label>Time <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-3)' }}>Optional</span></label><input type="time" id="rev-time" /></div>
            </div>
            <div className="modal-field">
              <label>Assign to</label>
              <div className="role-pills" data-multi="true" id="rev-assignees">
                <div className="role-pill sel" data-everyone="true" onClick={(e) => (window as any).selectRole(e.currentTarget)}>Everyone</div>
                {members.map(m => (
                  <div key={m.id} className="role-pill" onClick={(e) => (window as any).selectRole(e.currentTarget)}>{m.display_name.split(' ')[0]}</div>
                ))}
              </div>
            </div>
            <div className="modal-field">
              <label>Repeat on days</label>
              <div className="role-pills" data-multi="true" id="rev-days">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                  <div key={d} className={`role-pill${['Mon','Wed'].includes(d) ? ' sel' : ''}`} onClick={(e) => (window as any).selectRole(e.currentTarget)}>{d}</div>
                ))}
              </div>
            </div>
            <div className="modal-field"><label>Repeat until (exam date)</label><input type="date" id="rev-end-date" /></div>
            <div style={{ background: 'var(--amber-lt)', border: '1px solid #FDE68A', borderRadius: 'var(--r-md)', padding: '9px 12px', fontSize: 11, color: 'var(--amber)', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
              <i className="ti ti-info-circle" style={{ flexShrink: 0 }}></i>
              Sessions will repeat on selected days and stop automatically on the exam date.
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => (window as any).closeModal('modal-add-revision')}>Skip</button>
              <button className="modal-btn modal-btn-primary" onClick={() => (window as any).saveRevision()}>Add revision sessions</button>
            </div>
          </div>
        </div>
      </div>

      {/* Add bill */}
      <div className="modal-backdrop" id="modal-add-bill" onClick={(e) => (window as any).backdropClose(e,'modal-add-bill')}>
        <div className="modal"><div className="modal-handle"></div>
          <div className="modal-head">
            <div><div className="modal-title">Add bill</div><div className="modal-sub">Track an upcoming payment.</div></div>
            <button className="modal-close" onClick={() => (window as any).closeModal('modal-add-bill')}><i className="ti ti-x"></i></button>
          </div>
          <div className="modal-body">
            <div className="modal-field"><label>Bill name</label><input type="text" placeholder="e.g. Synergy Energy" /></div>
            <div className="modal-2col">
              <div className="modal-field"><label>Amount (AUD)</label><input type="number" placeholder="0.00" step={0.01} /></div>
              <div className="modal-field"><label>Due date</label><input type="date" /></div>
            </div>
            <div className="modal-field"><label>Category</label>
              <select id="bill-category-select" onChange={(e) => (window as any).onBillCategoryChange(e.currentTarget)}>
                <option>Utilities</option><option>Insurance</option><option>Mortgage / Rent</option><option>Subscription</option><option>School</option><option>Medical</option><option>Other</option>
                <option value="__add__">+ Add new category...</option>
              </select>
            </div>
            <div className="modal-field">
              <label>Attachments <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-3)' }}>Optional</span></label>
              <div className="attach-drop" onClick={() => document.getElementById('attach-bill')?.click()}>
                <input type="file" id="attach-bill" multiple accept="image/*,.pdf,.doc,.docx" onChange={(e) => (window as any).handleAttach(e.currentTarget,'bill')} />
                <i className="ti ti-paperclip" style={{ fontSize: 16, color: 'var(--text-3)' }}></i>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Tap to attach files or photos</span>
              </div>
              <div className="attach-list" id="attach-list-bill"></div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => (window as any).closeModal('modal-add-bill')}>Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={() => (window as any).saveBill()}>Add bill</button>
            </div>
          </div>
        </div>
      </div>

      {/* Member modal - current user (Sarah/admin) */}
      <div className="modal-backdrop" id="modal-member-sarah" onClick={(e) => (window as any).backdropClose(e,'modal-member-sarah')}>
        <div className="modal"><div className="modal-handle"></div>
          <div className="modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--sj-bg)', color: 'var(--sj-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }} id="av-header-sarah">{initials}</div>
              <div><div style={{ fontSize: 17, fontWeight: 800 }}>{displayName}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>Admin . {userEmail}</div></div>
            </div>
            <button className="modal-close" onClick={() => (window as any).closeModal('modal-member-sarah')}><i className="ti ti-x"></i></button>
          </div>
          <div className="modal-body">
            <div className="avatar-upload-wrap">
              <div className="avatar-preview" style={{ background: 'var(--sj-bg)', color: 'var(--sj-fg)' }} id="av-preview-sarah">{initials}</div>
              <div className="avatar-upload-info">
                <label className="avatar-upload-btn"><i className="ti ti-upload" style={{ fontSize: 13 }}></i> Upload photo<input type="file" accept="image/*" onChange={(e) => (window as any).previewAvatar(e.currentTarget,'av-preview-sarah','av-header-sarah')} /></label>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>JPG, PNG or GIF . max 2 MB</p>
              </div>
            </div>
            <div className="modal-field"><label>Display name</label><input type="text" defaultValue={displayName} /></div>
            <div className="modal-field"><label>Colour</label>
              <div className="colour-row">
                {['#9FE1CB','#F5C4B3','#B5D4F4','#F4C0D1','#CECBF6','#FDE68A'].map((c,i) => (
                  <div key={c} className={`colour-swatch${i===0?' sel':''}`} style={{ background: c }} onClick={(e) => (window as any).selectColour(e.currentTarget,'sarah')}></div>
                ))}
              </div>
            </div>
            <div className="modal-field"><label>Notifications</label>
              <div className="toggle-row on" onClick={(e) => e.currentTarget.classList.toggle('on')}>
                <div className="toggle-row-info"><div className="toggle-row-label">Push notifications</div><div className="toggle-row-sub">Event reminders &amp; family updates</div></div>
                <div className="toggle-row-switch"></div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => (window as any).closeModal('modal-member-sarah')}>Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={() => (window as any).saveAndToast('modal-member-sarah','Changes saved')}>Save changes</button>
            </div>
          </div>
        </div>
      </div>

      {/* Member modal - partner/adult 2 */}
      <div className="modal-backdrop" id="modal-member-mark" onClick={(e) => (window as any).backdropClose(e,'modal-member-mark')}>
        <div className="modal"><div className="modal-handle"></div>
          <div className="modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--mj-bg)', color: 'var(--mj-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }} id="av-header-mark">P2</div>
              <div><div style={{ fontSize: 17, fontWeight: 800 }}>Partner / Adult 2</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>Member</div></div>
            </div>
            <button className="modal-close" onClick={() => (window as any).closeModal('modal-member-mark')}><i className="ti ti-x"></i></button>
          </div>
          <div className="modal-body">
            <div className="modal-field"><label>Display name</label><input type="text" defaultValue="Partner / Adult 2" /></div>
            <div className="modal-field"><label>Role</label>
              <div className="role-pills">
                <div className="role-pill" onClick={(e) => (window as any).selectRole(e.currentTarget)}>Admin</div>
                <div className="role-pill sel" onClick={(e) => (window as any).selectRole(e.currentTarget)}>Member</div>
                <div className="role-pill" onClick={(e) => (window as any).selectRole(e.currentTarget)}>Child</div>
                <div className="role-pill" onClick={(e) => (window as any).selectRole(e.currentTarget)}>Guest</div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-danger">Remove member</button>
              <button className="modal-btn modal-btn-primary" onClick={() => (window as any).saveAndToast('modal-member-mark','Changes saved')}>Save changes</button>
            </div>
          </div>
        </div>
      </div>

      {/* Member modal - child 1 */}
      <div className="modal-backdrop" id="modal-member-olivia" onClick={(e) => (window as any).backdropClose(e,'modal-member-olivia')}>
        <div className="modal"><div className="modal-handle"></div>
          <div className="modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--oj-bg)', color: 'var(--oj-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }} id="av-header-olivia">K1</div>
              <div><div style={{ fontSize: 17, fontWeight: 800 }}>Child 1</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>Child . PIN login</div></div>
            </div>
            <button className="modal-close" onClick={() => (window as any).closeModal('modal-member-olivia')}><i className="ti ti-x"></i></button>
          </div>
          <div className="modal-body">
            <div className="modal-field"><label>Display name</label><input type="text" defaultValue="Child 1" /></div>
            <div className="modal-field"><label>Weekly points target</label>
              <div className="rewards-target-wrap">
                <div className="rewards-target-row">
                  <div><div className="rewards-target-label">Points goal</div><div className="rewards-target-sub">Shown on Kids View</div></div>
                  <input className="rewards-target-input" type="number" defaultValue={150} id="target-olivia" onChange={(e) => (window as any).updateBar('olivia',140)} />
                </div>
                <div className="rewards-progress-bar"><div className="rewards-progress-fill" id="progress-olivia" style={{ width: '93%' }}></div></div>
                <div className="rewards-progress-meta"><span>140 pts this week</span><span id="pct-olivia">Goal: 150 pts</span></div>
              </div>
            </div>
            <div className="modal-field"><label>Bedtime lock</label>
              <div className="sleep-wrap">
                <div className="sleep-enabled-row">
                  <div><div style={{ fontSize: 13, fontWeight: 700 }}>Enable bedtime lock</div><div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>App shows a sleep screen during restricted hours</div></div>
                  <div className="toggle-row-switch on" id="sleep-toggle-olivia" onClick={() => (window as any).toggleSleep('olivia')} style={{ cursor: 'pointer' }}></div>
                </div>
                <div className="sleep-times" id="sleep-times-olivia">
                  <div className="sleep-time-field"><label>🌙 Bedtime</label><input id="bedtime-start-input" type="time" defaultValue="20:30" /></div>
                  <div className="sleep-time-field"><label> Wake time</label><input id="bedtime-end-input" type="time" defaultValue="07:00" /></div>
                  <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-lt)' }}>
                    <div><div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>Grant extension</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>15 minutes right now</div></div>
                    <button className="sleep-ext-btn" onClick={() => (window as any).showToast('Extension granted ')}>+15 min</button>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <button className="modal-btn modal-btn-secondary" style={{ width: '100%', marginTop: 4 }} onClick={() => (window as any).showBedtime()}><i className="ti ti-eye" style={{ marginRight: 6 }}></i>Preview sleep screen</button>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <button className="modal-btn modal-btn-primary" style={{ width: '100%' }} onClick={() => (window as any).saveBedtimeSettings()}>
                      <i className="ti ti-device-floppy" style={{ marginRight: 6 }}></i>Save bedtime settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-danger">Remove member</button>
              <button className="modal-btn modal-btn-primary" onClick={() => (window as any).saveAndToast('modal-member-olivia','Changes saved')}>Save changes</button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings modal */}
      <div className="modal-backdrop" id="modal-settings" onClick={(e) => (window as any).backdropClose(e,'modal-settings')}>
        <div className="modal"><div className="modal-handle"></div>
          <div className="modal-head">
            <div><div className="modal-title">Family settings</div></div>
            <button className="modal-close" onClick={() => (window as any).closeModal('modal-settings')}><i className="ti ti-x"></i></button>
          </div>
          <div className="modal-body">
            <div className="settings-section">
              <div className="settings-section-title">Family profile</div>
              <div className="modal-field" style={{ marginBottom: 10 }}><label>Family name</label><input type="text" defaultValue={fName} /></div>
              <div className="modal-field" style={{ marginBottom: 10 }}><label>Location</label><input type="text" placeholder="e.g. Perth, WA" /></div>
              <div className="modal-field" style={{ marginBottom: 0 }}><label>Currency</label>
                <select><option>AUD - Australian Dollar</option><option>NZD - New Zealand Dollar</option><option>GBP - British Pound</option><option>USD - US Dollar</option><option>EUR - Euro</option><option>CAD - Canadian Dollar</option></select>
              </div>
            </div>
            <div className="settings-section">
              <div className="settings-section-title">Notifications</div>
              {[['Event reminders','Push notification before events',true],['Bill due alerts','3 days before due date',true],['Chore reminders','Morning and afternoon nudges for kids',true],['Weekly summary','Sunday evening family digest',false]].map(([label,sub,on]) => (
                <div key={label as string} className="settings-row">
                  <div className="settings-row-left"><div className="settings-row-label">{label}</div><div className="settings-row-sub">{sub}</div></div>
                  <button className={`settings-toggle${on?' on':''}`} onClick={(e) => e.currentTarget.classList.toggle('on')}></button>
                </div>
              ))}
            </div>
            <div className="settings-section">
              <div className="settings-section-title">Kids dashboard</div>
              {[['Points system','Award points for completed chores',true],['Show exam countdown','Days remaining on kids\' view',true],['Show revision sessions','Study blocks on kids\' calendar',true]].map(([label,sub,on]) => (
                <div key={label as string} className="settings-row">
                  <div className="settings-row-left"><div className="settings-row-label">{label}</div><div className="settings-row-sub">{sub}</div></div>
                  <button className={`settings-toggle${on?' on':''}`} onClick={(e) => e.currentTarget.classList.toggle('on')}></button>
                </div>
              ))}
            </div>
            <div className="settings-section">
              <div className="settings-section-title"><i className="ti ti-devices" style={{ fontSize: 12 }}></i> Device modes</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.5 }}>Set the view mode for <strong>this device</strong>.</div>
              <div className="device-mode-grid">
                <div className="device-mode-card sel" onClick={(e) => (window as any).selectDeviceMode(e.currentTarget,'personal')}><div className="device-mode-icon">"+/-</div><div className="device-mode-name">Personal</div><div className="device-mode-sub">Full access for adults</div></div>
                <div className="device-mode-card" onClick={(e) => (window as any).selectDeviceMode(e.currentTarget,'kiosk')}><div className="device-mode-icon">[screen]</div><div className="device-mode-name">Kiosk</div><div className="device-mode-sub">Shared family tablet</div></div>
                <div className="device-mode-card" onClick={(e) => (window as any).selectDeviceMode(e.currentTarget,'kids')}><div className="device-mode-icon">[kid]</div><div className="device-mode-name">Kids</div><div className="device-mode-sub">Child-safe view only</div></div>
              </div>
              <div id="device-mode-desc" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10, padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-lt)' }}>
                <i className="ti ti-info-circle" style={{ verticalAlign: 'middle', marginRight: 4 }}></i>
                <span id="device-mode-desc-text">Personal mode - full dashboard access with all admin controls visible.</span>
              </div>
            </div>
            <div className="settings-section">
              <div className="settings-section-title">Danger zone</div>
              <div className="danger-zone">
                <div className="danger-zone-title">Delete family account</div>
                <div className="danger-zone-text">Permanently deletes all events, tasks, bills, and member data. This cannot be undone.</div>
                <button className="modal-btn modal-btn-danger" style={{ width: '100%' }}>Delete family account</button>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => (window as any).closeModal('modal-settings')}>Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={() => (window as any).saveAndToast('modal-settings','Settings saved')}>Save settings</button>
            </div>
          </div>
        </div>
      </div>

      {/*  FINANCIAL REPORTS MODAL  */}
      <div className="modal-backdrop" id="modal-reports" onClick={(e) => (window as any).backdropClose(e,'modal-reports')}>
        <div className="modal report-modal"><div className="modal-handle"></div>
          <div className="modal-head">
            <div>
              <div className="modal-title">Financial reports</div>
              <div className="modal-sub" id="rep-period-label">Family expenditure by category . AUD</div>
            </div>
            <button className="modal-close" onClick={() => (window as any).closeModal('modal-reports')}><i className="ti ti-x"></i></button>
          </div>
          <div className="modal-body">
            <div className="report-period-tabs">
              <div className="report-tab active" onClick={(e) => (window as any).switchPeriod(e.currentTarget,'month')}>This month</div>
              <div className="report-tab" onClick={(e) => (window as any).switchPeriod(e.currentTarget,'quarter')}>This quarter</div>
              <div className="report-tab" onClick={(e) => (window as any).switchPeriod(e.currentTarget,'year')}>This year</div>
            </div>
            <div className="report-summary-grid">
              <div className="report-summary-card"><div className="report-summary-num" id="rep-total">-</div><div className="report-summary-lbl">Total spent</div></div>
              <div className="report-summary-card paid"><div className="report-summary-num" id="rep-paid">-</div><div className="report-summary-lbl">Paid</div></div>
              <div className="report-summary-card upcoming"><div className="report-summary-num" id="rep-upcoming">-</div><div className="report-summary-lbl">Upcoming</div></div>
              <div className="report-summary-card overdue"><div className="report-summary-num" id="rep-overdue">-</div><div className="report-summary-lbl">Overdue</div></div>
            </div>
            <div className="report-section-label">Spend by category</div>
            <div className="report-category-list" id="rep-cats">
              <div style={{ color:'var(--text-3)', fontSize:13, padding:'12px 0' }}>Loading...</div>
            </div>
            <div className="report-section-label">Bill breakdown</div>
            <div className="report-bills-table">
              <div className="report-table-head"><span>Bill</span><span>Category</span><span>Amount</span><span>Status</span></div>
              <div id="rep-bills-body"><div style={{ color:'var(--text-3)', fontSize:13, padding:'12px' }}>Loading...</div></div>
            </div>
            <div className="report-export-bar">
              <button className="report-export-btn excel" onClick={() => (window as any).exportReportCSV()}><i className="ti ti-file-spreadsheet"></i>Export CSV</button>
              <button className="report-export-btn" onClick={() => (window as any).exportPDF()}><i className="ti ti-file-type-pdf"></i>Export PDF</button>
              <button className="report-export-btn" onClick={() => (window as any).printReport()}><i className="ti ti-printer"></i>Print</button>
            </div>
          </div>
        </div>
      </div>

      {/*  AI SCANNER MODAL  */}
      <div className="modal-backdrop" id="modal-scan" onClick={(e) => (window as any).backdropClose(e,'modal-scan')}>
        <div className="modal scan-modal"><div className="modal-handle"></div>
          <div className="modal-head">
            <div><div className="modal-title">AI document scanner</div><div className="modal-sub">Upload a photo or PDF - Claude reads it and creates a draft entry for your review.</div></div>
            <button className="modal-close" onClick={() => (window as any).closeScan()}><i className="ti ti-x"></i></button>
          </div>
          <div className="modal-body">
            <div id="scan-step-upload">
              <div className="scan-drop-zone" id="scan-drop" onClick={() => document.getElementById('scan-file-input')?.click()}>
                <input type="file" id="scan-file-input" accept="image/*,.pdf" onChange={(e) => (window as any).startScan(e.currentTarget)} />
                <div className="scan-drop-icon"><i className="ti ti-cloud-upload"></i></div>
                <div className="scan-drop-title">Drop a file or tap to upload</div>
                <div className="scan-drop-sub">Photos, PDFs, screenshots - invitations, bills, school newsletters</div>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Claude can read</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { icon: 'ti-calendar-event', color: 'var(--oj-ac)', bg: '#EDF4FE', title: 'Calendar events', sub: 'Party invites, school notices' },
                    { icon: 'ti-receipt', color: 'var(--amber)', bg: 'var(--amber-lt)', title: 'Bills & invoices', sub: 'Utility bills, school fees' },
                    { icon: 'ti-file-text', color: 'var(--lilac)', bg: 'var(--lilac-lt)', title: 'School newsletters', sub: 'Extracts all key dates' },
                    { icon: 'ti-photo', color: 'var(--sj-ac)', bg: 'var(--green-lt)', title: 'Photos of documents', sub: 'Handwritten notes, flyers' },
                  ].map(item => (
                    <div key={item.title} style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className={`ti ${item.icon}`} style={{ color: item.color, fontSize: 16 }}></i>
                      <div><div style={{ fontSize: 12, fontWeight: 700 }}>{item.title}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.sub}</div></div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Or try a demo</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, padding: 9, border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', background: 'var(--bg)', cursor: 'pointer' }} onClick={() => (window as any).runDemoScan('bill')}>"" Demo bill scan</button>
                  <button style={{ flex: 1, padding: 9, border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', background: 'var(--bg)', cursor: 'pointer' }} onClick={() => (window as any).runDemoScan('event')}>"... Demo event scan</button>
                </div>
              </div>
            </div>
            <div className="scan-processing" id="scan-step-processing">
              <div className="scan-spinner"></div>
              <div className="scan-processing-title" id="scan-processing-msg">Reading your document...</div>
              <div className="scan-processing-sub">Claude is extracting dates, amounts, and details</div>
              <div style={{ marginTop: 20, background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '12px 16px' }}>
                <div id="scan-log" style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 2, fontFamily: 'monospace' }}></div>
              </div>
            </div>
            <div className="scan-result" id="scan-step-result">
              <div className="scan-result-header">
                <div className="scan-result-icon"><i className="ti ti-check" id="scan-result-icon"></i></div>
                <div>
                  <div className="scan-result-type" id="scan-result-type">Bill detected</div>
                  <div className="scan-result-title" id="scan-result-title">Synergy Energy - June 2024</div>
                  <div className="scan-confidence">AI confidence: <span id="scan-confidence-val">97%</span> . Review and confirm below</div>
                </div>
              </div>
              <div className="modal-field" style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Extracted fields - tap any to edit</div>
              </div>
              <div className="scan-fields" id="scan-fields-container"></div>
              <div style={{ background: 'var(--amber-lt)', border: '1px solid #FDE68A', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 12, color: 'var(--amber)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ti ti-info-circle" style={{ fontSize: 14, flexShrink: 0 }}></i>
                Always check AI-extracted details before saving. Nothing is saved until you confirm.
              </div>
              <div className="modal-actions">
                <button className="modal-btn modal-btn-secondary" onClick={() => (window as any).resetScan()}><i className="ti ti-arrow-left" style={{ marginRight: 6, fontSize: 13 }}></i>Scan another</button>
                <button className="modal-btn modal-btn-primary" id="scan-confirm-btn" onClick={() => (window as any).confirmScan()}>Save to KYNC</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*  HELP DRAWER  */}
      <div className="help-backdrop" id="help-backdrop" onClick={() => (window as any).closeHelp()}>
        <div className="help-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="help-drawer-head">
            <div className="help-drawer-title">Help &amp; support</div>
            <button className="help-drawer-close" onClick={() => (window as any).closeHelp()}><i className="ti ti-x"></i></button>
          </div>
          <div className="help-drawer-body">
            {/* Quick-start card */}
            <div className="help-qs-card" onClick={() => { (window as any).closeHelp(); (window as any).openModal('modal-wizard'); }}>
              <div className="help-qs-eyebrow">New to KYNC?</div>
              <div className="help-qs-title">Setup Wizard</div>
              <div className="help-qs-sub">Walk through the key features step by step — takes about 2 minutes.</div>
              <div className="help-qs-btn"><i className="ti ti-rocket" style={{ fontSize: 13 }}></i> Start setup wizard</div>
            </div>

            {/* Getting started guide */}
            <div className="help-section-label">Getting started</div>
            <div style={{ marginBottom: 20 }}>
              {[
                { n:1, title:'Invite your family', body:'Tap <strong>Invite member</strong> on the dashboard. Add a partner as Admin or Member so they can manage everything, or add children with PIN-only login so they only see their tasks and chores.' },
                { n:2, title:'Add events to the calendar', body:'Tap <strong>Add event</strong> or open the Calendar and tap any day. Assign it to one person or the whole family. Set it to repeat daily, weekly, or monthly.' },
                { n:3, title:'Set up chores & points', body:'Tap <strong>Add chore</strong> and assign it to a child. Set a points value and a repeat schedule (e.g. daily). Children tick off chores in Kids View and earn points toward their goal.' },
                { n:4, title:'Connect external calendars', body:'Go to <strong>Family Settings → My Profile</strong> and paste in any Google, iCal, or Outlook calendar URL. Your events will sync and show in KYNC\'s colour for that member.' },
                { n:5, title:'Try Kids View', body:'Tap the <strong>Kids View</strong> button on the calendar or dashboard. This shows a child-safe screen with today\'s tasks, a points progress bar, and a personalised greeting you can customise.' },
              ].map(s => (
                <div key={s.n} style={{ display:'flex', gap:12, marginBottom:14, alignItems:'flex-start' }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--green-lt)', border:'1.5px solid var(--green-mid)', color:'var(--green)', fontWeight:800, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, marginBottom:3 }}>{s.title}</div>
                    <div style={{ fontSize:12, color:'var(--text-2)', lineHeight:1.55 }} dangerouslySetInnerHTML={{ __html: s.body }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature cards */}
            <div className="help-section-label">What KYNC can do</div>
            <div className="help-features" style={{ marginBottom: 20 }}>
              {[
                { bg:'#EDF4FE', ic:'ti-calendar', ic_c:'var(--oj-ac)', title:'Family Calendar', sub:'Month, week & day views. Colour-coded per member. Syncs external Google & iCal feeds.' },
                { bg:'var(--lilac-lt)', ic:'ti-notes', ic_c:'var(--lilac)', title:'Exams & Revision', sub:'Add an exam and instantly schedule weekly revision sessions. Countdown bar on the calendar.' },
                { bg:'var(--green-lt)', ic:'ti-list-check', ic_c:'var(--green)', title:'Chores & Tasks', sub:'Recurring AM/PM routines for kids with points, goals and a reward tracker.' },
                { bg:'#D1FAE5', ic:'ti-chart-bar', ic_c:'#059669', title:'Bills & Reports', sub:'Track bills by category. Monthly & annual reports. Export to Excel, PDF, or print.' },
                { bg:'#F2F1FD', ic:'ti-scan', ic_c:'var(--lilac)', title:'AI Document Scan', sub:'Photo or PDF of any bill or school notice — AI reads it and pre-fills the form for you.' },
                { bg:'var(--pink-lt)', ic:'ti-mood-kid', ic_c:'var(--pink)', title:'Kids View', sub:'Child-safe fullscreen view with today\'s tasks, points bar, and a personalised good morning message.' },
                { bg:'#EBEBEB', ic:'ti-device-tablet', ic_c:'var(--text-1)', title:'Kiosk & Bedtime', sub:'Lock the app after bedtime with a night-mode screen. Kids can request extra time.' },
                { bg:'var(--amber-lt)', ic:'ti-calendar-star', ic_c:'var(--amber)', title:'Special Events', sub:'Add school holidays, birthdays & family events as shaded blocks across the calendar.' },
              ].map(f => (
                <div key={f.title} className="help-feat-card">
                  <div className="help-feat-icon" style={{ background: f.bg }}><i className={`ti ${f.ic}`} style={{ color: f.ic_c, fontSize: 18 }}></i></div>
                  <div className="help-feat-title">{f.title}</div>
                  <div className="help-feat-sub">{f.sub}</div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div className="help-section-label">Frequently asked questions</div>
            {[
              { q:'How do I add a child account?', a:'Tap <strong>Invite member</strong> on the dashboard. Enter the child\'s name, set their role to <strong>Child</strong>, and create a 4-digit PIN. Children log in using their PIN only — no email address is needed. They\'ll see a simplified Kids View showing only their tasks and chores.' },
              { q:'What\'s the difference between Admin, Member and Child?', a:'<strong>Admin</strong> can see and manage everything — members, settings, bills, and all calendar entries. <strong>Member</strong> can add and edit calendar entries and tasks but can\'t change family settings or view financial reports. <strong>Child</strong> uses PIN-only login and only sees their own chores and homework in Kids View.' },
              { q:'How does the AI document scanner work?', a:'Tap <strong>AI scan</strong> on the dashboard and upload a photo or PDF — a school newsletter, bill, event invite, or anything else. Claude reads the document, extracts the key details (title, date, amount, assignees), and shows you a draft entry. You can review and edit it before saving. Nothing is saved automatically.' },
              { q:'How do exam countdowns work?', a:'Tap <strong>Add exam</strong> and fill in the subject, date, and who it\'s for. The exam appears on the priority countdown bar at the top of the calendar. When you save, you\'re offered the option to immediately set up weekly revision sessions — these appear as lilac blocks on the calendar and stop automatically on the exam date.' },
              { q:'How do I set up chores and a points system?', a:'Tap <strong>Add chore</strong> from the dashboard, assign it to a child, set a points value (e.g. 5 pts), and choose a repeat schedule (daily, weekly, etc.). In Kids View the child taps a chore to tick it off and earns the points. The points bar shows progress toward their daily goal. You can set the goal in Family Settings.' },
              { q:'Can I connect my Google or iCal calendar?', a:'Yes. Go to <strong>Family → your name → Personal Calendars</strong> and paste in your calendar subscription URL. In Google Calendar: Settings → the calendar → scroll to "Secret address in iCal format". In Apple iCloud: Calendar app → right-click calendar → Copy Link. Your events will appear in KYNC in your member colour.' },
              { q:'How do I add school holidays or special events?', a:'In Family Settings (dashboard → Family Settings), tap <strong>Add special event</strong>. Choose the type (School holiday, Birthday, Family holiday, or Public holiday), set a start and end date, and it will appear as a shaded block across all days in the calendar.' },
              { q:'Can I add files or photos to a calendar entry?', a:'Yes — when adding an event, task, or homework from the calendar, scroll down to the <strong>Attachments</strong> field and tap to attach any file or photo. Files are linked to that entry so you can find them later.' },
              { q:'How do I print or export the calendar?', a:'Open the Calendar on desktop and tap <strong>PDF</strong> or <strong>Print</strong> in the top toolbar. PDF exports the current view as a file. Print opens the browser print dialog with a clean print-friendly layout (controls and navigation are hidden).' },
              { q:'How do I export financial reports?', a:'Tap <strong>Financial reports</strong> from the dashboard. Choose the time period (this month, last month, or annual). The report shows a breakdown by category with totals. Tap <strong>Export Excel</strong> to download a spreadsheet, <strong>Export PDF</strong> for a PDF summary, or <strong>Print</strong> for a printed version.' },
              { q:'How does bedtime mode work?', a:'Go to <strong>Family Settings → Bedtime &amp; Screen Time</strong> and turn on bedtime for a child. Set their bedtime and wake time. When bedtime arrives, KYNC automatically shows a dark sleep screen with the wake time. The child can tap <strong>Ask for extra time</strong> — you\'ll get a notification to approve it.' },
              { q:'Can I personalise Kids View for each child?', a:'Yes. Open Kids View (calendar or dashboard) and tap <strong>Add a personal message</strong> under the greeting. Set a morning message (shown before noon) and an evening message (shown after 6 pm). Each child has their own messages and they\'re saved to the device.' },
            ].map(faq => (
              <div key={faq.q} className="faq-item" onClick={(e) => (window as any).toggleFaq(e.currentTarget)}>
                <div className="faq-q">{faq.q}<i className="ti ti-chevron-down"></i></div>
                <div className="faq-a" dangerouslySetInnerHTML={{ __html: faq.a }}></div>
              </div>
            ))}

            {/* Tips */}
            <div className="help-section-label" style={{ marginTop: 20 }}>Tips &amp; tricks</div>
            {[
              { ic:'ti-repeat', tip:'Set chores to repeat daily or weekly so you only need to create them once.' },
              { ic:'ti-palette', tip:'Each family member gets a unique colour — events assigned to them show in that colour on the calendar.' },
              { ic:'ti-bell', tip:'Enable browser notifications in Family Settings to get reminders for upcoming events and bedtime alerts.' },
              { ic:'ti-device-mobile', tip:'On mobile, use the bottom navigation bar to switch between Month, Week and Day views instantly.' },
            ].map(t => (
              <div key={t.tip} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:12, padding:'10px 12px', background:'var(--bg)', borderRadius:'var(--r-md)', border:'1.5px solid var(--border-lt)' }}>
                <i className={`ti ${t.ic}`} style={{ color:'var(--green)', fontSize:16, flexShrink:0, marginTop:1 }}></i>
                <span style={{ fontSize:12, color:'var(--text-2)', lineHeight:1.55 }}>{t.tip}</span>
              </div>
            ))}

            <div style={{ marginTop: 20, padding: 14, background: 'var(--bg)', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Need more help?</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Full docs at <span style={{ color: 'var(--green)', fontWeight: 600 }}>kync.app/help</span></div>
            </div>
          </div>
        </div>
      </div>

      {/*  SETUP WIZARD  */}
      <div className="modal-backdrop" id="modal-wizard" onClick={(e) => (window as any).backdropClose(e,'modal-wizard')}>
        <div className="modal" style={{ maxWidth: 520 }}><div className="modal-handle"></div>
          <div className="wizard-steps">
            <div className="wizard-dot active" id="wdot-0"></div>
            <div className="wizard-dot" id="wdot-1"></div>
            <div className="wizard-dot" id="wdot-2"></div>
            <div className="wizard-dot" id="wdot-3"></div>
            <div className="wizard-dot" id="wdot-4"></div>
          </div>
          <div className="modal-body" style={{ paddingTop: 8 }}>

            {/* ── Step 0: Welcome ── */}
            <div className="wizard-step active" id="wstep-0">
              <div className="wizard-hero">
                <div className="wizard-hero-icon">🏠</div>
                <div className="wizard-hero-title">Welcome to KYNC!</div>
                <div className="wizard-hero-sub">KYNC is your family&apos;s command centre — one place for your calendar, chores, homework, bills, and kids&apos; routines.</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:18 }}>
                {[
                  { ic:'ti-calendar', c:'var(--oj-ac)', bg:'#EDF4FE', t:'Family Calendar', s:'Events, exams & holidays for everyone' },
                  { ic:'ti-list-check', c:'var(--green)', bg:'var(--green-lt)', t:'Chores & Tasks', s:'Points-based routines for kids' },
                  { ic:'ti-mood-kid', c:'var(--pink)', bg:'var(--pink-lt)', t:'Kids View', s:'Child-safe screen with daily tasks' },
                  { ic:'ti-chart-bar', c:'#059669', bg:'#D1FAE5', t:'Bills & Reports', s:'Track spending by category' },
                ].map(f => (
                  <div key={f.t} style={{ background:f.bg, borderRadius:'var(--r-lg)', padding:'12px 10px', display:'flex', flexDirection:'column', gap:6 }}>
                    <i className={`ti ${f.ic}`} style={{ color:f.c, fontSize:20 }}></i>
                    <div style={{ fontSize:12, fontWeight:700 }}>{f.t}</div>
                    <div style={{ fontSize:11, color:'var(--text-2)', lineHeight:1.4 }}>{f.s}</div>
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button className="modal-btn modal-btn-primary" onClick={() => (window as any).wizNext()}>Let&apos;s get started <i className="ti ti-arrow-right" style={{ marginLeft: 4 }}></i></button>
              </div>
            </div>

            {/* ── Step 1: Family profile ── */}
            <div className="wizard-step" id="wstep-1">
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, marginTop: 8 }}>Your family profile</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 18, lineHeight:1.5 }}>This helps KYNC personalise things like date formats, currency, and how your family name appears across the app.</div>
              <div className="modal-field"><label>Family name</label><input type="text" defaultValue={fName} placeholder="e.g. The Kinahan Family" /></div>
              <div className="modal-2col">
                <div className="modal-field" style={{ marginBottom: 0 }}><label>Location</label><input type="text" placeholder="e.g. Perth, WA" /></div>
                <div className="modal-field" style={{ marginBottom: 0 }}><label>Currency</label>
                  <select><option>AUD</option><option>NZD</option><option>GBP</option><option>USD</option><option>EUR</option></select>
                </div>
              </div>
              <div style={{ marginTop:14, padding:'10px 12px', background:'var(--green-lt)', borderRadius:'var(--r-md)', border:'1.5px solid var(--green-mid)', fontSize:12, color:'var(--text-2)', lineHeight:1.5 }}>
                <i className="ti ti-info-circle" style={{ color:'var(--green)', marginRight:5, verticalAlign:'middle' }}></i>
                You can update all of these settings later from <strong>Family Settings</strong> on the dashboard.
              </div>
              <div className="modal-actions" style={{ marginTop: 18 }}>
                <button className="modal-btn modal-btn-secondary" onClick={() => (window as any).wizBack()}>Back</button>
                <button className="modal-btn modal-btn-primary" onClick={() => (window as any).wizNext()}>Next <i className="ti ti-arrow-right" style={{ marginLeft: 4 }}></i></button>
              </div>
            </div>

            {/* ── Step 2: Add family members ── */}
            <div className="wizard-step" id="wstep-2">
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, marginTop: 8 }}>Add your family</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14, lineHeight:1.5 }}>Invite a partner, children, or other household members. Everyone gets their own colour and calendar view.</div>
              {/* Roles explained */}
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                {[
                  { role:'Admin', ic:'ti-shield-check', c:'var(--green)', desc:'Full access — manages members, settings, bills & all calendar entries. Give this to your partner.' },
                  { role:'Child', ic:'ti-mood-kid', c:'var(--pink)', desc:'PIN-only login. Sees Kids View with their chores & tasks. No access to family settings or bills.' },
                ].map(r => (
                  <div key={r.role} style={{ display:'flex', gap:10, padding:'10px 12px', background:'var(--bg)', borderRadius:'var(--r-md)', border:'1.5px solid var(--border)', alignItems:'flex-start' }}>
                    <i className={`ti ${r.ic}`} style={{ color:r.c, fontSize:18, flexShrink:0, marginTop:1 }}></i>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, marginBottom:2 }}>{r.role}</div>
                      <div style={{ fontSize:11, color:'var(--text-2)', lineHeight:1.4 }}>{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Current member */}
              <div style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1px solid var(--border-lt)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sj-bg)', color: 'var(--sj-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</div>
                    <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>Admin — that&apos;s you</div>
                  </div>
                </div>
                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color:'var(--text-3)' }} onClick={() => { (window as any).closeModal('modal-wizard'); (window as any).openModal('modal-invite'); }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--border-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className="ti ti-plus" style={{ color: 'var(--pink)', fontSize:16 }}></i></div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Invite a family member now →</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 10px', lineHeight: 1.5 }}>
                You can also add members later from the <strong>Invite member</strong> button on the dashboard.
              </div>
              <div className="modal-actions" style={{ marginTop: 14 }}>
                <button className="modal-btn modal-btn-secondary" onClick={() => (window as any).wizBack()}>Back</button>
                <button className="modal-btn modal-btn-primary" onClick={() => (window as any).wizNext()}>Next <i className="ti ti-arrow-right" style={{ marginLeft: 4 }}></i></button>
              </div>
            </div>

            {/* ── Step 3: Calendar & chores ── */}
            <div className="wizard-step" id="wstep-3">
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, marginTop: 8 }}>Calendar, chores &amp; kids</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight:1.5 }}>Here&apos;s how the three main areas of KYNC work together day to day.</div>
              {[
                { ic:'ti-calendar', c:'var(--oj-ac)', bg:'#EDF4FE', title:'Family Calendar', body:'Add events, assign them to one person or everyone, and set them to repeat. Connect your Google or iCal URL in Family Settings to pull in external events automatically. Colour-coded by family member.' },
                { ic:'ti-list-check', c:'var(--green)', bg:'var(--green-lt)', title:'Chores & homework', body:'Create recurring chore routines for children with points. Add homework deadlines with a subject tag. Set up an exam and KYNC will offer to schedule weekly revision sessions automatically.' },
                { ic:'ti-mood-kid', c:'var(--pink)', bg:'var(--pink-lt)', title:'Kids View', body:'Tap Kids View on the calendar to open a fullscreen child-safe view. Each child sees their own tasks and chores, with a points progress bar and a personalised good morning or good evening message you write yourself.' },
              ].map(s => (
                <div key={s.title} style={{ display:'flex', gap:12, marginBottom:14, padding:'12px', background:s.bg, borderRadius:'var(--r-lg)', alignItems:'flex-start' }}>
                  <div style={{ width:36, height:36, borderRadius:'var(--r-md)', background:'rgba(255,255,255,.6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className={`ti ${s.ic}`} style={{ color:s.c, fontSize:18 }}></i>
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>{s.title}</div>
                    <div style={{ fontSize:12, color:'var(--text-1)', lineHeight:1.55, opacity:.8 }}>{s.body}</div>
                  </div>
                </div>
              ))}
              <div className="modal-actions" style={{ marginTop: 4 }}>
                <button className="modal-btn modal-btn-secondary" onClick={() => (window as any).wizBack()}>Back</button>
                <button className="modal-btn modal-btn-primary" onClick={() => (window as any).wizNext()}>Next <i className="ti ti-arrow-right" style={{ marginLeft: 4 }}></i></button>
              </div>
            </div>

            {/* ── Step 4: All set ── */}
            <div className="wizard-step" id="wstep-4">
              <div className="wizard-hero">
                <div className="wizard-hero-icon">🎉</div>
                <div className="wizard-hero-title">You&apos;re ready to go!</div>
                <div className="wizard-hero-sub">KYNC is set up for {fName}. Here are your first three things to do.</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                {[
                  { n:'1', t:'Add your first event', s:'Tap Add event and put something on the family calendar — a school pickup, a dinner, anything.', ic:'ti-calendar-plus', c:'var(--oj-ac)', bg:'#EDF4FE' },
                  { n:'2', t:'Create a chore for a child', s:'Tap Add chore, assign it to a child, set a point value and a daily repeat. They\'ll see it in Kids View.', ic:'ti-list-check', c:'var(--green)', bg:'var(--green-lt)' },
                  { n:'3', t:'Connect an external calendar', s:'Go to Family → your name → Personal Calendars and paste in your Google or iCal URL.', ic:'ti-calendar-share', c:'var(--lilac)', bg:'var(--lilac-lt)' },
                ].map(s => (
                  <div key={s.n} style={{ display:'flex', gap:12, padding:'12px 14px', background:s.bg, borderRadius:'var(--r-lg)', alignItems:'flex-start' }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,.7)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontWeight:800, fontSize:13, color:s.c }}>{s.n}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:2 }}>{s.t}</div>
                      <div style={{ fontSize:11, color:'var(--text-1)', opacity:.75, lineHeight:1.4 }}>{s.s}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button className="modal-btn modal-btn-secondary" onClick={() => (window as any).closeModal('modal-wizard')}>Go to Dashboard</button>
                <button className="modal-btn modal-btn-primary" onClick={() => { (window as any).closeModal('modal-wizard'); window.location.href='/calendar'; }}>
                  <i className="ti ti-calendar" style={{ marginRight: 6 }}></i>Open Calendar
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/*  BEDTIME OVERLAY  */}
      <div id="bedtime-overlay">
        <div className="bedtime-stars" id="bedtime-stars"></div>
        <span className="bedtime-demo-close" onClick={() => (window as any).hideBedtime()}> Close preview</span>
        <div className="bedtime-moon">🌙</div>
        <div className="bedtime-title">Time for bed!</div>
        <div className="bedtime-sub">This app is sleeping. Get some rest - it&apos;ll be ready in the morning.</div>
        <div className="bedtime-wake-card"><div className="bedtime-wake-label">Back at</div><div className="bedtime-wake-time">7:00 AM</div></div>
        <button className="bedtime-ask-btn" onClick={() => { (window as any).showToast('Extension request sent to Mum & Dad "+/-'); (window as any).hideBedtime(); }}>Ask for extra time</button>
      </div>

      {/*  KIDS VIEW OVERLAY  */}
      <div id="kids-view-overlay">
        <div className="kv-topbar">
          <img src="/Kync_logo.png" alt="KYNC" style={{ height: 38 }} />
          <button className="kv-exit" onClick={() => (window as any).closeKidsView()}><i className="ti ti-x" style={{ fontSize: 11, marginRight: 4 }}></i>Exit kids view</button>
        </div>
        <div className="kv-greeting" id="kv-greeting">Hi there! 👋</div>
        <div className="kv-date">{todayStr ? `Today is ${todayStr}` : ''}</div>
        <div className="kv-member-tabs">
          {members.filter(m => m.role?.toLowerCase() === 'child').map((m, i) => {
            const slot = i === 0 ? 'olivia' : 'liam'
            const bg = i === 0 ? 'var(--oj-bg)' : 'var(--lj-bg)'
            const fg = i === 0 ? 'var(--oj-fg)' : 'var(--lj-fg)'
            return (
              <div key={m.id} className={'kv-tab' + (i === 0 ? ' sel' : '')}
                style={i === 0 ? { background: bg, color: fg, borderColor: bg } : {}}
                onClick={() => (window as any).openKidsView(slot, m.display_name)}>
                {m.display_name.split(' ')[0]}
              </div>
            )
          })}
          {members.filter(m => m.role?.toLowerCase() === 'child').length === 0 && (
            <div style={{ width: '100%', maxWidth: 480, textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👶</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>No children added yet</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.5 }}>Add a child account from the family member settings. Children log in with a PIN and see their own tasks and chores here.</div>
              <button onClick={() => { (window as any).closeKidsView(); (window as any).openModal?.('modal-invite') }}
                style={{ padding: '10px 20px', background: 'var(--pink)', color: '#fff', border: 'none', borderRadius: 'var(--r-md)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                <i className="ti ti-user-plus" style={{ marginRight: 6 }}></i>Add a child
              </button>
            </div>
          )}
        </div>
        <div id="kv-olivia" style={{ width: '100%', maxWidth: 480 }}>
          <div className="kv-card">
            <div className="kv-card-head">
              <div className="kv-card-icon" style={{ background: 'var(--oj-bg)', color: 'var(--oj-fg)' }}>K1</div>
              <div>
                <div className="kv-card-title">Today&apos;s chores</div>
                <div className="kv-card-sub" id="kv-date-olivia"></div>
              </div>
            </div>
            <div id="kv-chores-olivia">
              <div style={{ padding: '16px 0', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>Loading chores...</div>
            </div>
            <div className="kv-points-bar">
              <div className="kv-pts-top"><span id="kv-pts-olivia">0 pts today</span><span style={{ color: 'var(--text-3)' }} id="kv-pts-goal-olivia">Goal: 50 pts</span></div>
              <div className="kv-pts-track"><div className="kv-pts-fill" id="kv-pts-fill-olivia" style={{ width: '0%', background: 'var(--oj-ac)' }}></div></div>
            </div>
          </div>
        </div>
        <div id="kv-liam" style={{ width: '100%', maxWidth: 480, display: 'none' }}>
          <div className="kv-card">
            <div className="kv-card-head">
              <div className="kv-card-icon" style={{ background: 'var(--lj-bg)', color: 'var(--lj-fg)' }}>K2</div>
              <div>
                <div className="kv-card-title">Today&apos;s chores</div>
                <div className="kv-card-sub" id="kv-date-liam"></div>
              </div>
            </div>
            <div id="kv-chores-liam">
              <div style={{ padding: '16px 0', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>Loading chores...</div>
            </div>
            <div className="kv-points-bar">
              <div className="kv-pts-top"><span id="kv-pts-liam">0 pts today</span><span style={{ color: 'var(--text-3)' }} id="kv-pts-goal-liam">Goal: 50 pts</span></div>
              <div className="kv-pts-track"><div className="kv-pts-fill" id="kv-pts-fill-liam" style={{ width: '0%', background: 'var(--lj-ac)' }}></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* SheetJS for Excel export */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" async={true}></script>

      {/* Toast */}
      <div className="toast" id="toast"><i className="ti ti-circle-check"></i><span id="toast-msg">Done</span></div>
    </>
  )
}
