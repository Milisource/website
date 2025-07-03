import { NextResponse } from 'next/server'
import { sessions } from '../../../lib/sessions'

export async function GET() {
  const sessionData = Array.from(sessions.entries()).map(([id, session]) => ({
    id,
    username: session.username,
    timestamp: session.timestamp,
    age: Date.now() - session.timestamp
  }))

  return NextResponse.json({
    totalSessions: sessions.size,
    sessions: sessionData
  })
} 