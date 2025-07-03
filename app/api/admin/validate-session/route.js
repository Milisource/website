import { NextResponse } from 'next/server'
import { validateSession } from '../../../lib/sessions'

export async function POST(request) {
  try {
    const body = await request.json()
    const { sessionId } = body

    console.log('=== SESSION VALIDATION ===')
    console.log('Validating sessionId:', sessionId)

    const isValid = validateSession(sessionId)

    console.log('Session validation result:', isValid)

    return NextResponse.json({
      success: true,
      isValid,
      sessionId
    })

  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 