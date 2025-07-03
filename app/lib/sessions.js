// Shared session management for admin and upload APIs
// Using global variable to ensure sessions persist across API routes

// Initialize global sessions if it doesn't exist
if (!global.adminSessions) {
  global.adminSessions = new Map()
}

const sessions = global.adminSessions

// Clean up old sessions (older than 24 hours) - less aggressive
if (!global.sessionCleanupInterval) {
  global.sessionCleanupInterval = setInterval(() => {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    console.log('=== SESSION CLEANUP ===')
    console.log('Current sessions before cleanup:', sessions.size)
    console.log('Available sessions:', Array.from(sessions.keys()))
    
    let cleanedCount = 0
    for (const [sessionId, session] of sessions.entries()) {
      const age = now - session.timestamp
      console.log(`Session ${sessionId}: age = ${Math.round(age / 1000 / 60)} minutes`)
      
      if (age > maxAge) {
        sessions.delete(sessionId)
        cleanedCount++
        console.log(`Cleaned up old session: ${sessionId}`)
      }
    }
    
    console.log(`Cleaned up ${cleanedCount} sessions`)
    console.log('Sessions after cleanup:', sessions.size)
  }, 60 * 60 * 1000) // Run cleanup every hour instead of more frequently
}

export function createSession(username) {
  const sessionId = Math.random().toString(36).substring(2)
  sessions.set(sessionId, { username, timestamp: Date.now() })
  console.log('=== SESSION CREATED ===')
  console.log('Created session:', sessionId, 'for user:', username)
  console.log('Total sessions:', sessions.size)
  console.log('Available sessions:', Array.from(sessions.keys()))
  return sessionId
}

export function validateSession(sessionId) {
  console.log('=== SESSION VALIDATION ===')
  console.log('Validating session:', sessionId)
  console.log('Session exists:', sessions.has(sessionId))
  console.log('Total sessions:', sessions.size)
  console.log('Available sessions:', Array.from(sessions.keys()))
  
  if (!sessionId) {
    console.log('No sessionId provided')
    return false
  }
  
  if (!sessions.has(sessionId)) {
    console.log('Session not found in sessions map')
    return false
  }
  
  // Update timestamp to keep session alive
  const session = sessions.get(sessionId)
  const oldTimestamp = session.timestamp
  session.timestamp = Date.now()
  sessions.set(sessionId, session)
  
  console.log('Session validated successfully')
  console.log('Session age before refresh:', Math.round((Date.now() - oldTimestamp) / 1000 / 60), 'minutes')
  
  return true
}

export function removeSession(sessionId) {
  console.log('=== SESSION REMOVAL ===')
  console.log('Removing session:', sessionId)
  console.log('Session exists:', sessions.has(sessionId))
  
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId)
    console.log('Successfully removed session:', sessionId)
    console.log('Remaining sessions:', sessions.size)
  } else {
    console.log('Session not found for removal:', sessionId)
  }
}

export { sessions } 