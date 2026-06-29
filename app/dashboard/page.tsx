import { createServerSideClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { LogoutButton } from './logout-button'

export default async function DashboardPage() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: member } = await supabase
    .from('family_members')
    .select('display_name, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) {
    redirect('/onboarding')
  }

  const { data: family } = member
    ? await supabase
        .from('families')
        .select('name')
        .eq('id', (
          await supabase
            .from('family_members')
            .select('family_id')
            .eq('user_id', user.id)
            .maybeSingle()
        ).data?.family_id)
        .maybeSingle()
    : { data: null }

  const displayName = member?.display_name ?? user.email ?? 'there'
  const familyName = family?.name ?? null

  const sections = [
    { icon: '📅', label: 'Calendar', href: '/calendar', desc: 'Family events & schedule' },
    { icon: '✅', label: 'Tasks', href: '/tasks', desc: 'Chores & to-dos' },
    { icon: '💰', label: 'Bills', href: '/bills', desc: 'Track your expenses' },
    { icon: '⭐', label: 'Kids', href: '/kids', desc: 'Points & rewards' },
    { icon: '👨‍👩‍👧‍👦', label: 'Family', href: '/family', desc: 'Members & settings' },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: '#F7F5F2',
      fontFamily: "'Inter', sans-serif", padding: '0',
    }}>
      {/* Header */}
      <header style={{
        background: '#1A1714', color: '#fff',
        padding: '16px 24px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🏠</span>
          <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.03em' }}>
            KY<span style={{ color: '#1D9E75' }}>NC</span>
          </span>
          {familyName && (
            <span style={{ fontSize: '13px', color: '#A09893', marginLeft: '6px' }}>
              · {familyName}
            </span>
          )}
        </div>
        <LogoutButton />
      </header>

      {/* Main content */}
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1714', marginBottom: '6px' }}>
            Welcome back, {displayName.split(' ')[0]}! 👋
          </div>
          <div style={{ fontSize: '14px', color: '#6B6561' }}>
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Quick links grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px', marginBottom: '32px',
        }}>
          {sections.map(s => (
            <a
              key={s.href}
              href={s.href}
              style={{
                background: '#fff', border: '1px solid #E8E4DF',
                borderRadius: '18px', padding: '20px',
                textDecoration: 'none', color: 'inherit',
                display: 'block', boxShadow: '0 2px 12px rgba(0,0,0,.04)',
                transition: 'box-shadow .15s',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{s.icon}</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A1714', marginBottom: '3px' }}>{s.label}</div>
              <div style={{ fontSize: '12px', color: '#A09893' }}>{s.desc}</div>
            </a>
          ))}
        </div>

        {/* Coming soon notice */}
        <div style={{
          background: '#fff', border: '1.5px solid #E8E4DF',
          borderRadius: '18px', padding: '24px',
          textAlign: 'center', color: '#A09893', fontSize: '13px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🧙✨</div>
          <div style={{ fontWeight: 700, color: '#6B6561', fontSize: '15px', marginBottom: '6px' }}>
            Your family hub is being set up!
          </div>
          More features are on the way. Your data is safe and your account is ready.
        </div>
      </main>
    </div>
  )
}
