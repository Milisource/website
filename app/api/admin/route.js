import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { createSession, validateSession, removeSession } from '../../lib/sessions'

// Admin credentials - in production, use environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123'

// Profile data file path
const PROFILE_FILE = path.join(process.cwd(), 'app', 'profile.js')

export async function POST(request) {
  try {
    const body = await request.json()
    const { action, username, password, profileData, sessionId } = body

    console.log('Admin API request - action:', action, 'sessionId:', sessionId ? 'present' : 'missing')

    if (action === 'login') {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const sessionId = createSession(username)
        
        return NextResponse.json({ 
          success: true, 
          sessionId,
          message: 'Login successful' 
        })
      } else {
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid credentials' 
        }, { status: 401 })
      }
    }

    if (action === 'logout') {
      removeSession(sessionId)
      return NextResponse.json({ success: true, message: 'Logged out' })
    }

    if (action === 'updateProfile') {
      // Verify session
      if (!validateSession(sessionId)) {
        return NextResponse.json({ 
          success: false, 
          message: 'Unauthorized' 
        }, { status: 401 })
      }

      // Update profile data
      console.log('Saving profile data:', JSON.stringify(profileData, null, 2))
      
      const profileContent = `// Hello, stranger. I like changing my stuff around a lot, so I decided to do future me a favor and make it a separate file that we pull from instead of hardcoding everything.
export const profile = ${JSON.stringify(profileData, null, 2)}
`

      fs.writeFileSync(PROFILE_FILE, profileContent, 'utf8')

      return NextResponse.json({ 
        success: true, 
        message: 'Profile updated successfully' 
      })
    }

    if (action === 'getProfile') {
      // Verify session
      if (!validateSession(sessionId)) {
        return NextResponse.json({ 
          success: false, 
          message: 'Unauthorized' 
        }, { status: 401 })
      }

      // Read current profile data
      const { profile } = await import('../../profile.js')
      
      console.log('Loading profile data:', JSON.stringify(profile, null, 2))
      
      return NextResponse.json({ 
        success: true, 
        profile 
      })
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Invalid action' 
    }, { status: 400 })

  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
} 