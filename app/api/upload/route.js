import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { validateSession } from '../../lib/sessions'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const sessionId = formData.get('sessionId')

    console.log('Upload request - sessionId:', sessionId ? 'present' : 'missing')

    // Validate session
    if (!validateSession(sessionId)) {
      console.log('Session validation failed for sessionId:', sessionId)
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 })
    }

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: 'No file provided' 
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        message: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    // Create public directory if it doesn't exist
    const publicDir = path.join(process.cwd(), 'public')
    await mkdir(publicDir, { recursive: true })

    // Generate filename with original extension
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Get file extension from original file or MIME type
    let ext = path.extname(file.name)
    if (!ext) {
      // Fallback to MIME type if no extension
      switch (file.type) {
        case 'image/jpeg':
        case 'image/jpg':
          ext = '.jpg'
          break
        case 'image/png':
          ext = '.png'
          break
        case 'image/gif':
          ext = '.gif'
          break
        case 'image/webp':
          ext = '.webp'
          break
        default:
          ext = '.png' // Default fallback
      }
    }
    const filename = `pfp${ext}`
    const filepath = path.join(publicDir, filename)
    
    console.log('File upload details:', {
      originalName: file.name,
      extension: ext,
      filename: filename,
      filepath: filepath
    })

    // Write file
    await writeFile(filepath, buffer)

    return NextResponse.json({ 
      success: true, 
      filename: `/${filename}`,
      message: 'File uploaded successfully' 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Upload failed' 
    }, { status: 500 })
  }
} 