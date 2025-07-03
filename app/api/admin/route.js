import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { createSession, validateSession, removeSession } from '../../lib/sessions'

// Admin credentials - in production, use environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123'

// Profile data file path - handle both development and production
let PROFILE_FILE
if (process.env.NODE_ENV === 'production') {
  // In production, use a data directory that persists
  PROFILE_FILE = path.join(process.cwd(), 'data', 'profile.js')
} else {
  // In development, use the app directory
  PROFILE_FILE = path.join(process.cwd(), 'app', 'profile.js')
}

console.log('Admin API initialized with profile file path:', PROFILE_FILE)

export async function POST(request) {
  try {
    const body = await request.json()
    const { action, username, password, profileData, sessionId } = body

    console.log('=== ADMIN API REQUEST ===')
    console.log('Action:', action)
    console.log('Session ID present:', !!sessionId)
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('Current working directory:', process.cwd())
    console.log('Profile file path:', PROFILE_FILE)
    console.log('Profile file exists:', fs.existsSync(PROFILE_FILE))

    if (action === 'login') {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const sessionId = createSession(username)
        console.log('Login successful for user:', username)
        
        return NextResponse.json({ 
          success: true, 
          sessionId,
          message: 'Login successful' 
        })
      } else {
        console.log('Login failed - invalid credentials')
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid credentials' 
        }, { status: 401 })
      }
    }

    if (action === 'logout') {
      removeSession(sessionId)
      console.log('Logout successful')
      return NextResponse.json({ success: true, message: 'Logged out' })
    }

    if (action === 'updateProfile') {
      // Verify session
      if (!validateSession(sessionId)) {
        console.log('Update profile failed - invalid session')
        return NextResponse.json({ 
          success: false, 
          message: 'Unauthorized' 
        }, { status: 401 })
      }

      // Update profile data
      console.log('=== UPDATING PROFILE ===')
      console.log('Profile data to save:', JSON.stringify(profileData, null, 2))
      
      // Ensure directory exists
      const dir = path.dirname(PROFILE_FILE)
      console.log('Directory path:', dir)
      console.log('Directory exists:', fs.existsSync(dir))
      
      if (!fs.existsSync(dir)) {
        console.log('Creating directory:', dir)
        fs.mkdirSync(dir, { recursive: true })
        console.log('Directory created successfully')
      }
      
      const profileContent = `// Hello, stranger. I like changing my stuff around a lot, so I decided to do future me a favor and make it a separate file that we pull from instead of hardcoding everything.
export const profile = ${JSON.stringify(profileData, null, 2)}
`
      console.log('Profile content to write:')
      console.log(profileContent)

      try {
        fs.writeFileSync(PROFILE_FILE, profileContent, 'utf8')
        console.log('Profile file written successfully')
        
        // Verify the file was written correctly
        const verifyContent = fs.readFileSync(PROFILE_FILE, 'utf8')
        console.log('Verification - file content length:', verifyContent.length)
        console.log('Verification - file content preview:', verifyContent.substring(0, 200) + '...')
        
        // Try to parse the written content to ensure it's valid
        const match = verifyContent.match(/export const profile = ({[\s\S]*?})(?:;|\s*$)/)
        if (match) {
          const parsedProfile = eval('(' + match[1] + ')')
          console.log('Verification - parsed profile successfully:', JSON.stringify(parsedProfile, null, 2))
        } else {
          console.warn('Verification - could not parse written profile content')
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Profile updated successfully' 
        })
      } catch (writeError) {
        console.error('Error writing profile file:', writeError)
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to write profile file' 
        }, { status: 500 })
      }
    }

    if (action === 'getProfile') {
      // Verify session
      if (!validateSession(sessionId)) {
        console.log('Get profile failed - invalid session')
        return NextResponse.json({ 
          success: false, 
          message: 'Unauthorized' 
        }, { status: 401 })
      }

      // Read current profile data
      console.log('=== GETTING PROFILE ===')
      let profile = undefined
      
      try {
        if (process.env.NODE_ENV === 'production') {
          // In production, read from the data file
          console.log('Reading profile from production file:', PROFILE_FILE)
          console.log('File exists:', fs.existsSync(PROFILE_FILE))
          
          if (!fs.existsSync(PROFILE_FILE)) {
            console.error('Profile file does not exist in production!')
            return NextResponse.json({ 
              success: false, 
              message: 'Profile file not found' 
            }, { status: 404 })
          }
          
          const profileContent = fs.readFileSync(PROFILE_FILE, 'utf8')
          console.log('Profile file content length:', profileContent.length)
          console.log('Profile file content preview:', profileContent.substring(0, 200) + '...')
          
          // Extract the profile object from the file content - try multiple patterns
          // Pattern 1: Look for export const profile = { ... } (with or without semicolon)
          const match1 = profileContent.match(/export const profile = ({[\s\S]*?})(?:;|\s*$)/)
          if (match1) {
            console.log('Pattern 1 match found, profile object length:', match1[1].length)
            try {
              profile = eval('(' + match1[1] + ')')
              console.log('Successfully parsed profile with pattern 1 for admin:', JSON.stringify(profile, null, 2))
            } catch (evalError) {
              console.error('Pattern 1 eval error:', evalError.message)
            }
          }
          // Pattern 2: Look for the object after "export const profile ="
          if (!profile) {
            console.log('Pattern 1 failed, trying pattern 2...')
            const exportIndex = profileContent.indexOf('export const profile =')
            if (exportIndex !== -1) {
              console.log('Found export statement at index:', exportIndex)
              const afterExport = profileContent.substring(exportIndex + 'export const profile ='.length)
              console.log('Content after export:', afterExport.substring(0, 100) + '...')
              // Find the closing brace by counting braces
              let braceCount = 0
              let endIndex = -1
              for (let i = 0; i < afterExport.length; i++) {
                if (afterExport[i] === '{') braceCount++
                if (afterExport[i] === '}') {
                  braceCount--
                  if (braceCount === 0) {
                    endIndex = i
                    break
                  }
                }
              }
              if (endIndex !== -1) {
                const profileStr = afterExport.substring(0, endIndex + 1)
                console.log('Extracted profile string length:', profileStr.length)
                console.log('Extracted profile string:', profileStr)
                try {
                  profile = eval('(' + profileStr + ')')
                  console.log('Successfully parsed profile with pattern 2 for admin:', JSON.stringify(profile, null, 2))
                } catch (evalError) {
                  console.error('Pattern 2 eval error:', evalError.message)
                }
              } else {
                console.error('Could not find closing brace for profile object')
              }
            } else {
              console.error('Could not find "export const profile =" in file')
            }
          }
          if (!profile) {
            console.error('Could not parse profile data with any pattern')
            return NextResponse.json({
              success: false,
              message: 'Profile not found or could not be parsed'
            }, { status: 500 })
          }
        } else {
          // In development, use dynamic import
          console.log('Reading profile from development file')
          const profileModule = await import('../../profile.js')
          profile = profileModule.profile
          console.log('Successfully imported profile for admin:', JSON.stringify(profile, null, 2))
        }
        if (!profile) {
          return NextResponse.json({
            success: false,
            message: 'Profile not found or could not be parsed'
          }, { status: 500 })
        }
        return NextResponse.json({ 
          success: true, 
          profile 
        })
      } catch (error) {
        console.error('Error loading profile for admin:', error)
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to load profile data' 
        }, { status: 500 })
      }
    }

    console.log('Invalid action:', action)
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