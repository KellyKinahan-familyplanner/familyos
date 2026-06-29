'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const NAV_ITEMS = [
  { href: '/dashboard', icon: 'ti-layout-dashboard', label: 'Home'     },
  { href: '/calendar',  icon: 'ti-calendar',          label: 'Calendar' },
  { href: '/tasks',     icon: 'ti-circle-check',      label: 'Tasks'    },
  { href: '/family',    icon: 'ti-users',              label: 'Family'   },
]

const CSS = `
.kync-bottom-nav{
  display:none;
  position:fixed;bottom:0;left:0;right:0;z-index:90;
  background:rgba(255,255,255,.96);
  backdrop-filter:blur(16px);
  border-top:1px solid #E8E4DF;
  padding:6px 0 max(8px,env(safe-area-inset-bottom));
  -webkit-tap-highlight-color:transparent;
}
@media(max-width:768px){.kync-bottom-nav{display:flex;}}
.kync-bottom-nav-item{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:3px;padding:4px 0;text-decoration:none;color:#A09893;
  font-size:10px;font-weight:600;letter-spacing:.02em;
  transition:color .15s;min-height:44px;
}
.kync-bottom-nav-item i{font-size:20px;line-height:1;}
.kync-bottom-nav-item.active{color:#1D9E75;}
.kync-bottom-nav-item:active{color:#1D9E75;opacity:.7;}

/* Install banner */
.kync-install-banner{
  position:fixed;bottom:calc(64px + env(safe-area-inset-bottom));left:12px;right:12px;
  background:#1A1714;color:#fff;border-radius:14px;
  padding:12px 16px;display:flex;align-items:center;gap:12px;
  box-shadow:0 4px 20px rgba(0,0,0,.25);z-index:89;
  animation:slideUpBanner .3s ease;
}
@keyframes slideUpBanner{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.kync-install-banner-icon{width:40px;height:40px;border-radius:10px;background:#1D9E75;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px;}
.kync-install-banner-text{flex:1;min-width:0;}
.kync-install-banner-title{font-size:13px;font-weight:700;margin-bottom:2px;}
.kync-install-banner-sub{font-size:11px;color:rgba(255,255,255,.6);}
.kync-install-banner-btn{padding:7px 14px;border-radius:20px;background:#1D9E75;color:#fff;font-size:12px;font-weight:700;border:none;cursor:pointer;white-space:nowrap;flex-shrink:0;}
.kync-install-banner-close{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.12);color:rgba(255,255,255,.6);font-size:12px;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;flex-shrink:0;}

/* iOS tip sheet */
.kync-ios-sheet{
  position:fixed;bottom:0;left:0;right:0;z-index:200;
  background:#fff;border-radius:20px 20px 0 0;
  padding:20px 20px calc(20px + env(safe-area-inset-bottom));
  box-shadow:0 -8px 40px rgba(0,0,0,.18);
  animation:slideUpBanner .25s ease;
}
.kync-ios-sheet-handle{width:36px;height:4px;border-radius:2px;background:#E8E4DF;margin:0 auto 16px;}
.kync-ios-sheet-title{font-size:16px;font-weight:800;color:#1A1714;margin-bottom:12px;}
.kync-ios-step{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #F0EDE9;}
.kync-ios-step:last-child{border-bottom:none;}
.kync-ios-step-num{width:28px;height:28px;border-radius:50%;background:#E8F7F2;color:#1D9E75;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.kync-ios-step-text{font-size:13px;color:#4A4540;line-height:1.4;}
.kync-ios-step-text b{color:#1A1714;}
.kync-ios-got-it{width:100%;margin-top:16px;padding:13px;border-radius:12px;background:#1A1714;color:#fff;font-size:14px;font-weight:700;border:none;cursor:pointer;}

/* Push page body up on mobile so content doesn't hide behind nav */
@media(max-width:768px){
  body{padding-bottom:calc(64px + env(safe-area-inset-bottom));}
}
`

export default function BottomNav() {
  const pathname  = usePathname()
  const [installPrompt, setInstallPrompt]   = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner]         = useState(false)
  const [showIosSheet, setShowIosSheet]     = useState(false)
  const [isIos, setIsIos]                   = useState(false)
  const [isInstalled, setIsInstalled]       = useState(false)
  const dismissed = useRef(false)

  useEffect(() => {
    // Inject CSS
    const s = document.createElement('style')
    s.id = 'kync-bottom-nav-css'
    s.textContent = CSS
    if (!document.getElementById('kync-bottom-nav-css')) document.head.appendChild(s)

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIos(ios)

    // Already installed?
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Android/Chrome/Edge: capture install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      if (!dismissed.current) {
        setTimeout(() => setShowBanner(true), 3000)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS: show banner after delay if not already installed
    if (ios && !dismissed.current) {
      setTimeout(() => setShowBanner(true), 4000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      document.getElementById('kync-bottom-nav-css')?.remove()
    }
  }, [])

  const handleInstall = async () => {
    if (isIos) {
      setShowBanner(false)
      setShowIosSheet(true)
      return
    }
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setShowBanner(false)
    dismissed.current = true
  }

  const dismissBanner = () => {
    setShowBanner(false)
    dismissed.current = true
  }

  // Only show on app pages
  const appPages = ['/dashboard', '/calendar', '/tasks', '/family']
  if (!appPages.some(p => pathname?.startsWith(p))) return null
  if (isInstalled) return null

  return (
    <>
      {/* Bottom nav */}
      <nav className="kync-bottom-nav" role="navigation" aria-label="Main navigation">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`kync-bottom-nav-item${pathname?.startsWith(item.href) ? ' active' : ''}`}
          >
            <i className={`ti ${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Install banner */}
      {showBanner && (
        <div className="kync-install-banner" role="banner">
          <div className="kync-install-banner-icon">📱</div>
          <div className="kync-install-banner-text">
            <div className="kync-install-banner-title">Add KYNC to your home screen</div>
            <div className="kync-install-banner-sub">Works offline · Feels like a native app</div>
          </div>
          <button className="kync-install-banner-btn" onClick={handleInstall}>
            {isIos ? 'How to' : 'Install'}
          </button>
          <button className="kync-install-banner-close" onClick={dismissBanner} aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* iOS step-by-step sheet */}
      {showIosSheet && (
        <div className="kync-ios-sheet" role="dialog" aria-modal="true" aria-label="Add to Home Screen instructions">
          <div className="kync-ios-sheet-handle" />
          <div className="kync-ios-sheet-title">Add KYNC to your Home Screen</div>
          <div className="kync-ios-step">
            <div className="kync-ios-step-num">1</div>
            <div className="kync-ios-step-text">Tap the <b>Share</b> button <b>⬆</b> at the bottom of Safari</div>
          </div>
          <div className="kync-ios-step">
            <div className="kync-ios-step-num">2</div>
            <div className="kync-ios-step-text">Scroll down and tap <b>Add to Home Screen</b></div>
          </div>
          <div className="kync-ios-step">
            <div className="kync-ios-step-num">3</div>
            <div className="kync-ios-step-text">Tap <b>Add</b> in the top right — done! 🎉</div>
          </div>
          <button className="kync-ios-got-it" onClick={() => setShowIosSheet(false)}>Got it</button>
        </div>
      )}
    </>
  )
}
