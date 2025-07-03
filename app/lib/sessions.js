// Shared session management for admin and upload APIs
// Using global variable to ensure sessions persist across API routes

// Initialize global sessions if it doesn't exist
if (!global.adminSessions) {
  global.adminSessions = new Map()
}

const sessions = global.adminSessions

// Clean up old sessions (older than 24 hours)
if (!global.sessionCleanupInterval) {
  global.sessionCleanupInterval = setInterval(() => {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    for (const [sessionId, session] of sessions.entries()) {
      if (now - session.timestamp > maxAge) {
        sessions.delete(sessionId)
      }
    }
  }, 60 * 60 * 1000) // Run cleanup every hour
}

export function createSession(username) {
  const sessionId = Math.random().toString(36).substring(2)
  sessions.set(sessionId, { username, timestamp: Date.now() })
  console.log('Created session:', sessionId, 'for user:', username)
  console.log('Total sessions:', sessions.size)
  return sessionId
}

export function validateSession(sessionId) {
  console.log('Validating session:', sessionId, 'exists:', sessions.has(sessionId))
  console.log('Total sessions:', sessions.size)
  console.log('Available sessions:', Array.from(sessions.keys()))
  
  if (!sessionId || !sessions.has(sessionId)) {
    return false
  }
  
  // Update timestamp to keep session alive
  const session = sessions.get(sessionId)
  session.timestamp = Date.now()
  sessions.set(sessionId, session)
  
  return true
}

export function removeSession(sessionId) {
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId)
    console.log('Removed session:', sessionId)
  }
}

export { sessions } 