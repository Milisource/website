import ProfileHeader from './components/ProfileHeader.jsx'
import SocialLinks from './components/SocialLinks.jsx'
import fs from 'fs'
import path from 'path'

// Function to load profile data with comprehensive logging
async function loadProfile() {
  console.log('=== PROFILE LOADING START ===')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  console.log('Current working directory:', process.cwd())
  
  if (process.env.NODE_ENV === 'production') {
    // In production, read from the data file
    const PROFILE_FILE = path.join(process.cwd(), 'data', 'profile.js')
    console.log('Production profile file path:', PROFILE_FILE)
    console.log('File exists:', fs.existsSync(PROFILE_FILE))
    
    if (!fs.existsSync(PROFILE_FILE)) {
      console.error('Profile file does not exist!')
      throw new Error(`Profile file not found at ${PROFILE_FILE}`)
    }
    
    try {
      const profileContent = fs.readFileSync(PROFILE_FILE, 'utf8')
      console.log('Profile file content length:', profileContent.length)
      console.log('Profile file content preview:', profileContent.substring(0, 200) + '...')
      
      // Extract the profile object from the file content - try multiple patterns
      let profile = null
      
      // Pattern 1: Look for export const profile = { ... } (with or without semicolon)
      const match1 = profileContent.match(/export const profile = ({[\s\S]*?})(?:;|\s*$)/)
      if (match1) {
        console.log('Pattern 1 match found, profile object length:', match1[1].length)
        try {
          profile = eval('(' + match1[1] + ')')
          console.log('Successfully parsed profile with pattern 1:', JSON.stringify(profile, null, 2))
          console.log('=== PROFILE LOADING END ===')
          return profile
        } catch (evalError) {
          console.error('Pattern 1 eval error:', evalError.message)
        }
      }
      
      // Pattern 2: Look for the object after "export const profile ="
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
            console.log('Successfully parsed profile with pattern 2:', JSON.stringify(profile, null, 2))
            console.log('=== PROFILE LOADING END ===')
            return profile
          } catch (evalError) {
            console.error('Pattern 2 eval error:', evalError.message)
          }
        } else {
          console.error('Could not find closing brace for profile object')
        }
      } else {
        console.error('Could not find "export const profile =" in file')
      }
      
      // If we get here, both patterns failed
      throw new Error('Could not parse profile data with any pattern')
    } catch (error) {
      console.error('Error reading/parsing profile file:', error)
      throw error
    }
  } else {
    // In development, use dynamic import
    console.log('Development mode - using dynamic import')
    try {
      const profileModule = await import('./profile.js')
      console.log('Successfully imported profile module')
      console.log('Profile data:', JSON.stringify(profileModule.profile, null, 2))
      console.log('=== PROFILE LOADING END ===')
      return profileModule.profile
    } catch (error) {
      console.error('Error importing profile module:', error)
      throw error
    }
  }
}

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
  console.log('=== PAGE RENDER START ===')
  
  try {
    const profile = await loadProfile()
    console.log('Profile loaded successfully for page render')
    console.log('Profile name:', profile.name)
    console.log('Profile aboutMe:', profile.aboutMe)
    console.log('=== PAGE RENDER END ===')
    
    return (
      <main className={profile.background + " min-h-screen"}>
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <ProfileHeader profile={profile} />
          {/* About Section */}
          <section className="my-16 animate-on-load animate-fade-in-up animate-delay-300">
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-2xl p-8 shadow-lg border border-pink-100 dark:border-pink-900/20">
              <h2 className="text-2xl font-bold mb-3 text-center text-gray-800 dark:text-gray-200 animate-on-load animate-fade-in-up animate-delay-400">
                About Me
              </h2>
              {/* See profile.js. */}
              <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-2xl mx-auto animate-on-load animate-fade-in-up animate-delay-500">
                {profile.aboutMe}
              </p>
              
              {/* Credits Section - Only show if credits are provided */}
              {profile.credits?.profilePicture?.artist && profile.credits?.profilePicture?.url && (
                <>
                  <br />
                  <br />
                  <h2 className="text-2xl font-bold mb-3 text-center text-gray-800 dark:text-gray-200 animate-on-load animate-fade-in-up animate-delay-400">
                    Credits
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-2xl mx-auto animate-on-load animate-fade-in-up animate-delay-500">
                    <b>Profile Picture: </b><a href={profile.credits.profilePicture.url} target="_blank" rel="noopener noreferrer" className="gradient-link">{profile.credits.profilePicture.artist}</a>
                  </p>
                </>
              )}
            </div>
          </section>
          {/* Social Links */}
          <section className="my-16 animate-on-load animate-fade-in-up animate-delay-600">
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-2xl p-8 shadow-lg border border-pink-100 dark:border-pink-900/20">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200 animate-on-load animate-fade-in-up animate-delay-700">
                Socials
              </h2>
              <SocialLinks profile={profile} />
            </div>
          </section>
          {/* Footer */}
          <footer className="text-center text-gray-500 dark:text-gray-400 text-sm mt-16 animate-on-load animate-fade-in-up animate-delay-800">
            <p>Remember that you are human. <span className="text-pink-500">♥</span></p>
          </footer>
        </div>
      </main>
    )
  } catch (error) {
    console.error('Error rendering page:', error)
    return (
      <main className="bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-2xl p-8 shadow-lg border border-pink-100 dark:border-pink-900/20">
            <h1 className="text-2xl font-bold mb-4 text-center text-red-600 dark:text-red-400">
              Error Loading Profile
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 text-center">
              There was an error loading the profile data. Please check the server logs for more details.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
              Error: {error.message}
            </p>
          </div>
        </div>
      </main>
    )
  }
}
