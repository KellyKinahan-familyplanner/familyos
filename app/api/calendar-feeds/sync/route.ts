import { createServerSideClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// Minimal ICS parser — handles VEVENT blocks
function parseICS(text: string) {
  const events: Array<{
    uid: string; summary: string; dtstart: string; dtend: string;
    description?: string; location?: string; allDay: boolean
  }> = []

  const blocks = text.split(/BEGIN:VEVENT/i).slice(1)
  for (const block of blocks) {
    const get = (key: string) => {
      const m = block.match(new RegExp(`^${key}[;:][^\r\n]*`, 'mi'))
      if (!m) return ''
      return m[0].replace(new RegExp(`^${key}[^:]*:`, 'i'), '').replace(/\r/g, '').trim()
    }

    const uid     = get('UID')
    const summary = get('SUMMARY').replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';')
    const dtstart = get('DTSTART')
    const dtend   = get('DTEND') || get('DUE')
    const description = get('DESCRIPTION').replace(/\\n/g, '\n').replace(/\\,/g, ',') || undefined
    const location = get('LOCATION').replace(/\\,/g, ',') || undefined

    if (!uid || !summary || !dtstart) continue

    const allDay = /^\d{8}$/.test(dtstart.replace(/VALUE=DATE:/i, ''))
    const parseDate = (s: string): string => {
      const raw = s.replace(/^VALUE=DATE:/i, '').replace(/Z$/, '')
      if (/^\d{8}$/.test(raw)) {
        return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
      }
      // YYYYMMDDTHHMMSS
      try { return new Date(raw.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6')).toISOString().slice(0, 10) }
      catch { return raw.slice(0, 10) }
    }

    events.push({ uid, summary, dtstart: parseDate(dtstart), dtend: parseDate(dtend || dtstart), description, location, allDay })
  }
  return events
}

function detectSpecialType(summary: string): string {
  const s = summary.toLowerCase()
  if (/birthday|bday|b-day/.test(s)) return 'birthday'
  if (/school.*(hol|break|term|vacat)|term.*(hol|break)|pupil.free/.test(s)) return 'school-holiday'
  if (/public.hol|national.hol|anzac|christmas|easter|queen|king|labour|new.year/.test(s)) return 'public-holiday'
  return 'event'
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('family_members').select('family_id').eq('user_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'No family' }, { status: 404 })

  // Optionally sync a specific feed_id, otherwise sync all enabled feeds
  const body = await request.json().catch(() => ({}))
  const feedQuery = supabase
    .from('calendar_feeds')
    .select('*')
    .eq('family_id', member.family_id)
    .eq('enabled', true)

  if (body.feed_id) feedQuery.eq('id', body.feed_id)

  const { data: feeds } = await feedQuery
  if (!feeds?.length) return NextResponse.json({ synced: 0 })

  let totalSynced = 0
  const errors: string[] = []

  for (const feed of feeds) {
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'KYNC-FamilyOS/1.0' },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) { errors.push(`${feed.name}: HTTP ${res.status}`); continue }

      const text = await res.text()
      const events = parseICS(text)

      for (const ev of events) {
        const type = detectSpecialType(ev.summary)
        const colour = type === 'birthday' ? 'pink'
          : type === 'school-holiday' ? 'blue'
          : type === 'public-holiday' ? 'amber'
          : feed.colour || 'green'

        await supabase.from('calendar_entries').upsert({
          family_id:   member.family_id,
          created_by:  user.id,
          feed_id:     feed.id,
          feed_uid:    `${feed.id}::${ev.uid}`,
          source:      'feed',
          title:       ev.summary,
          date:        ev.dtstart,
          time_start:  ev.allDay ? null : null,
          type,
          colour,
          assignees:   feed.member_id ? [] : ['Everyone'],
          notes:       [ev.description, ev.location].filter(Boolean).join('\n') || null,
          completed:   false,
          points:      0,
          recur:       'none',
        }, { onConflict: 'feed_uid' })

        totalSynced++
      }

      await supabase.from('calendar_feeds').update({ last_synced: new Date().toISOString() }).eq('id', feed.id)
    } catch (e: any) {
      errors.push(`${feed.name}: ${e.message}`)
    }
  }

  return NextResponse.json({ synced: totalSynced, errors })
}
