import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'KYNC – Family Organiser',
  description: 'The all-in-one app for syncing your kin',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KYNC',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: '/Kync_logo.png',
    apple: '/Kync_logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1D9E75',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KYNC" />
        <link rel="apple-touch-icon" href="/Kync_logo.png" />
      </head>
      <body className="min-h-full">
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
