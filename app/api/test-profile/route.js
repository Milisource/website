import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  console.log('=== TEST PROFILE ENDPOINT CALLED ===')
  
  try {
    const result = {
      success: false,
      nodeEnv: process.env.NODE_ENV,
      currentWorkingDirectory: process.cwd(),
      timestamp: new Date().toISOString(),
      profile: null,
      error: null
    }

    if (process.env.NODE_ENV === 'production') {
      // In production, read from the data file
      const PROFILE_FILE = path.join(process.cwd(), 'data', 'profile.js')
      console.log('Test endpoint - Production profile file path:', PROFILE_FILE)
      console.log('Test endpoint - File exists:', fs.existsSync(PROFILE_FILE))
      
      if (!fs.existsSync(PROFILE_FILE)) {
        result.error = `Profile file not found at ${PROFILE_FILE}`
        console.error('Test endpoint - Profile file does not exist!')
        return NextResponse.json(result)
      }
      
      try {
        const profileContent = fs.readFileSync(PROFILE_FILE, 'utf8')
        console.log('Test endpoint - Profile file content length:', profileContent.length)
        console.log('Test endpoint - Profile file content preview:', profileContent.substring(0, 200) + '...')
        
        // Extract the profile object from the file content - try multiple patterns
        let profile = null
        
        // Pattern 1: Look for export const profile = { ... } (with or without semicolon)
        const match1 = profileContent.match(/export const profile = ({[\s\S]*?})(?:;|\s*$)/)
        if (match1) {
          console.log('Test endpoint - Pattern 1 match found, profile object length:', match1[1].length)
          try {
            profile = eval('(' + match1[1] + ')')
            console.log('Test endpoint - Successfully parsed profile with pattern 1:', JSON.stringify(profile, null, 2))
            result.success = true
            result.profile = profile
          } catch (evalError) {
            console.error('Test endpoint - Pattern 1 eval error:', evalError.message)
          }
        }
        
        // Pattern 2: Look for the object after "export const profile ="
        if (!profile) {
          console.log('Test endpoint - Pattern 1 failed, trying pattern 2...')
          const exportIndex = profileContent.indexOf('export const profile =')
          if (exportIndex !== -1) {
            console.log('Test endpoint - Found export statement at index:', exportIndex)
            const afterExport = profileContent.substring(exportIndex + 'export const profile ='.length)
            console.log('Test endpoint - Content after export:', afterExport.substring(0, 100) + '...')
            
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
              console.log('Test endpoint - Extracted profile string length:', profileStr.length)
              console.log('Test endpoint - Extracted profile string:', profileStr)
              try {
                profile = eval('(' + profileStr + ')')
                console.log('Test endpoint - Successfully parsed profile with pattern 2:', JSON.stringify(profile, null, 2))
                result.success = true
                result.profile = profile
              } catch (evalError) {
                console.error('Test endpoint - Pattern 2 eval error:', evalError.message)
              }
            } else {
              result.error = 'Could not find closing brace for profile object'
              console.error('Test endpoint - Could not find closing brace for profile object')
            }
          } else {
            result.error = 'Could not find "export const profile =" in file'
            console.error('Test endpoint - Could not find "export const profile =" in file')
          }
        }
        
        if (!profile) {
          result.error = 'Could not parse profile data with any pattern'
        }
      } catch (error) {
        result.error = `Error reading/parsing profile file: ${error.message}`
        console.error('Test endpoint - Error reading/parsing profile file:', error)
      }
    } else {
      // In development, use dynamic import
      console.log('Test endpoint - Development mode - using dynamic import')
      try {
        const profileModule = await import('../../profile.js')
        console.log('Test endpoint - Successfully imported profile module')
        console.log('Test endpoint - Profile data:', JSON.stringify(profileModule.profile, null, 2))
        result.success = true
        result.profile = profileModule.profile
      } catch (error) {
        result.error = `Error importing profile module: ${error.message}`
        console.error('Test endpoint - Error importing profile module:', error)
      }
    }

    console.log('Test endpoint - Final result:', JSON.stringify(result, null, 2))
    return NextResponse.json(result)

  } catch (error) {
    console.error('Test endpoint - Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 