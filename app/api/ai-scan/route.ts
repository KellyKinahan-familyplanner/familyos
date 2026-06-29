import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

const PROMPT = `You are a family organiser assistant. Analyse this document image or PDF and extract key information.

Identify the document type and return ONLY valid JSON in this exact format (no markdown, no explanation):

For a bill or invoice:
{
  "type": "bill",
  "title": "Provider Name — Month Year",
  "confidence": 95,
  "fields": [
    { "label": "Provider", "key": "provider", "value": "..." },
    { "label": "Amount", "key": "amount", "value": "$0.00" },
    { "label": "Due date", "key": "due_date", "value": "DD MMM YYYY" },
    { "label": "Category", "key": "category", "value": "Utilities|Insurance|School|Subscription|Medical|Other" }
  ]
}

For a calendar event, invitation, or school notice:
{
  "type": "event",
  "title": "Event Name",
  "confidence": 95,
  "fields": [
    { "label": "Event", "key": "title", "value": "..." },
    { "label": "Date", "key": "date", "value": "YYYY-MM-DD" },
    { "label": "Time", "key": "time", "value": "HH:MM or empty" },
    { "label": "Location", "key": "location", "value": "..." }
  ]
}

For homework or school assignment:
{
  "type": "homework",
  "title": "Assignment description",
  "confidence": 95,
  "fields": [
    { "label": "Title", "key": "title", "value": "..." },
    { "label": "Subject", "key": "subject", "value": "..." },
    { "label": "Due date", "key": "due_date", "value": "YYYY-MM-DD" },
    { "label": "Notes", "key": "notes", "value": "..." }
  ]
}

If you cannot identify the document type clearly, default to "event" type.
Return ONLY the JSON object. No other text.`

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { contentBlock } = body

    if (!contentBlock?.source?.data || !contentBlock?.source?.media_type) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { data: base64Data, media_type: mimeType } = contentBlock.source

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent([
      PROMPT,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType as string,
        },
      },
    ])

    const raw = result.response.text().trim()

    // Strip markdown code fences if Gemini wraps the JSON
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // Gemini returned something unparseable — return a safe fallback
      return NextResponse.json({
        type: 'event',
        title: 'Scanned document',
        confidence: 70,
        fields: [
          { label: 'Title',  key: 'title',  value: 'Scanned document' },
          { label: 'Date',   key: 'date',   value: new Date().toISOString().slice(0, 10) },
          { label: 'Notes',  key: 'notes',  value: raw.slice(0, 200) },
        ],
      })
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[ai-scan]', err)
    return NextResponse.json(
      { error: 'Scan failed', detail: String(err) },
      { status: 500 }
    )
  }
}
