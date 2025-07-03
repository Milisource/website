import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Function to parse profile content
function parseProfileContent(content) {
  // Pattern 1: Look for export const profile = { ... } (with or without semicolon)
  const match1 = content.match(/export const profile = ({[\s\S]*?})(?:;|\s*$)/)
  if (match1) {
    try {
      const profile = eval('(' + match1[1] + ')')
      return { success: true, profile, method: 'pattern1' }
    } catch (evalError) {
      return { success: false, error: `Pattern 1 eval error: ${evalError.message}`, method: 'pattern1' }
    }
  }
  
  // Pattern 2: Look for the object after "export const profile ="
  const exportIndex = content.indexOf('export const profile =')
  if (exportIndex !== -1) {
    const afterExport = content.substring(exportIndex + 'export const profile ='.length)
    
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
      try {
        const profile = eval('(' + profileStr + ')')
        return { success: true, profile, method: 'pattern2' }
      } catch (evalError) {
        return { success: false, error: `Pattern 2 eval error: ${evalError.message}`, method: 'pattern2' }
      }
    }
  }
  
  return { success: false, error: 'Could not parse profile content', method: 'none' }
}

export async function GET() {
  console.log('=== DEBUG ENDPOINT CALLED ===')
  
  try {
    const debugInfo = {
      nodeEnv: process.env.NODE_ENV,
      currentWorkingDirectory: process.cwd(),
      timestamp: new Date().toISOString(),
      fileSystem: {}
    }

    // Check both possible profile file locations
    const possiblePaths = [
      path.join(process.cwd(), 'data', 'profile.js'),
      path.join(process.cwd(), 'app', 'profile.js')
    ]

    for (const filePath of possiblePaths) {
      debugInfo.fileSystem[filePath] = {
        exists: fs.existsSync(filePath),
        size: fs.existsSync(filePath) ? fs.statSync(filePath).size : null,
        lastModified: fs.existsSync(filePath) ? fs.statSync(filePath).mtime.toISOString() : null,
        content: null
      }

      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8')
          debugInfo.fileSystem[filePath].content = content
          debugInfo.fileSystem[filePath].contentLength = content.length
          debugInfo.fileSystem[filePath].contentPreview = content.substring(0, 500) + '...'
          
          // Try to parse the content
          const parseResult = parseProfileContent(content)
          debugInfo.fileSystem[filePath].parsedSuccessfully = parseResult.success
          if (parseResult.success) {
            debugInfo.fileSystem[filePath].parsedProfile = parseResult.profile
            debugInfo.fileSystem[filePath].parseMethod = parseResult.method
          } else {
            debugInfo.fileSystem[filePath].parseError = parseResult.error
            debugInfo.fileSystem[filePath].parseMethod = parseResult.method
          }
        } catch (readError) {
          debugInfo.fileSystem[filePath].readError = readError.message
        }
      }
    }

    // Check data directory
    const dataDir = path.join(process.cwd(), 'data')
    debugInfo.dataDirectory = {
      exists: fs.existsSync(dataDir),
      contents: fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : null
    }

    console.log('Debug info:', JSON.stringify(debugInfo, null, 2))

    return NextResponse.json({
      success: true,
      debugInfo
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 