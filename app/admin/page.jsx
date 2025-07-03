'use client'

import { useState, useEffect } from 'react'
import ToastManager from '../components/ToastManager'

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState(null)
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    image: '/pfp.png',
    background: 'bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900',
    aboutMe: '',
    credits: {
      profilePicture: {
        url: '',
        artist: ''
      }
    },
    socialLinks: []
  })

  // Check if user is already logged in
  useEffect(() => {
    const savedSessionId = localStorage.getItem('adminSessionId')
    console.log('Loading saved sessionId:', savedSessionId)
    if (savedSessionId) {
      setSessionId(savedSessionId)
      setIsLoggedIn(true)
      loadProfile(savedSessionId)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    
    // Check for lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingTime = Math.ceil((lockoutUntil - Date.now()) / 1000)
      window.showToast(`Account temporarily locked. Try again in ${remainingTime} seconds.`, 'error')
      return
    }
    
    setLoading(true)

    const formData = new FormData(e.target)
    const username = formData.get('username')
    const password = formData.get('password')

    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password })
      })

      const data = await response.json()

      if (data.success) {
        console.log('Login successful, sessionId:', data.sessionId)
        setIsLoggedIn(true)
        setSessionId(data.sessionId)
        localStorage.setItem('adminSessionId', data.sessionId)
        setLoginAttempts(0)
        setLockoutUntil(null)
        window.showToast('Login successful!', 'success')
        loadProfile(data.sessionId)
      } else {
        const newAttempts = loginAttempts + 1
        setLoginAttempts(newAttempts)
        
        if (newAttempts >= 5) {
          const lockoutTime = Date.now() + (15 * 60 * 1000) // 15 minutes
          setLockoutUntil(lockoutTime)
          window.showToast('Too many failed attempts. Account locked for 15 minutes.', 'error', 8000)
        } else {
          window.showToast(`Login failed. ${5 - newAttempts} attempts remaining.`, 'error')
        }
      }
    } catch (error) {
      window.showToast('Login failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (sessionId) {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', sessionId })
      })
    }
    
    setIsLoggedIn(false)
    setSessionId(null)
    localStorage.removeItem('adminSessionId')
    window.showToast('Logged out successfully', 'success')
  }

  const loadProfile = async (sid) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getProfile', sessionId: sid })
      })

      const data = await response.json()
      if (data.success) {
        console.log('Loaded profile data:', data.profile)
        
        // Ensure credits structure exists
        const profileWithDefaults = {
          ...data.profile,
          credits: {
            profilePicture: {
              url: data.profile.credits?.profilePicture?.url || '',
              artist: data.profile.credits?.profilePicture?.artist || ''
            }
          },
          socialLinks: data.profile.socialLinks || []
        }
        
        console.log('Profile with defaults:', profileWithDefaults)
        setProfile(profileWithDefaults)
      } else if (response.status === 401) {
        // Session expired or invalid - redirect to login
        console.log('Session expired, redirecting to login')
        handleSessionExpired()
      } else {
        window.showToast('Failed to load profile', 'error')
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      // On network errors, also redirect to login
      handleSessionExpired()
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'updateProfile', 
          sessionId, 
          profileData: profile 
        })
      })

      const data = await response.json()

      if (data.success) {
        window.showToast('Profile updated successfully!', 'success')
      } else if (response.status === 401) {
        // Session expired or invalid - redirect to login
        console.log('Session expired during update, redirecting to login')
        handleSessionExpired()
      } else {
        window.showToast(data.message || 'Update failed', 'error')
      }
    } catch (error) {
      window.showToast('Update failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    console.log('Updating field:', field, 'with value:', value)
    
    if (field.includes('.')) {
      const parts = field.split('.')
      setProfile(prev => {
        let updated = { ...prev }
        let current = updated
        
        // Navigate to the parent object
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {}
          }
          current = current[parts[i]]
        }
        
        // Set the final property
        current[parts[parts.length - 1]] = value
        
        console.log('Updated profile:', updated)
        return updated
      })
    } else {
      setProfile(prev => {
        const updated = { ...prev, [field]: value }
        console.log('Updated profile:', updated)
        return updated
      })
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)

    console.log('Uploading file with sessionId:', sessionId)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('sessionId', sessionId)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        console.log('Upload successful, filename:', data.filename)
        setProfile(prev => ({ ...prev, image: data.filename }))
        window.showToast('Profile image uploaded successfully!', 'success')
      } else if (response.status === 401) {
        // Session expired or invalid - redirect to login
        console.log('Session expired during upload, redirecting to login')
        handleSessionExpired()
      } else {
        window.showToast(data.message || 'Upload failed', 'error')
      }
    } catch (error) {
      window.showToast('Upload failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLinkChange = (index, field, value) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }))
  }

  const addSocialLink = () => {
    setProfile(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, {
        name: '',
        url: '',
        icon: 'Globe',
        color: 'hover:text-gray-500 dark:hover:text-gray-400',
        bgColor: 'hover:bg-gray-50 dark:hover:bg-gray-900/20'
      }]
    }))
  }

  const removeSocialLink = (index) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }))
  }

  const handleSessionExpired = () => {
    // Clear session data
    setIsLoggedIn(false)
    setSessionId(null)
    localStorage.removeItem('adminSessionId')
    window.showToast('Session expired. Please log in again.', 'warning')
  }

  if (!isLoggedIn) {
      return (
    <>
      <ToastManager />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">
            Admin Login
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-pink-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

  return (
    <>
      <ToastManager />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Profile Editor
            </h1>
            <button
              onClick={handleLogout}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <input
                  type="text"
                  value={profile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profile Image
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={profile.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    placeholder="/pfp.png"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="profile-upload"
                  />
                  <label
                    htmlFor="profile-upload"
                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Upload
                  </label>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Upload a new image or enter a custom path
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background CSS Classes (<a href="https://tailwindcss.com/docs/background-color" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600">TailwindCSS</a>)
              </label>
              <input
                type="text"
                value={profile.background}
                onChange={(e) => handleInputChange('background', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                About Me
              </label>
              <textarea
                value={profile.aboutMe}
                onChange={(e) => handleInputChange('aboutMe', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                Profile Picture Credits <span className="text-sm text-gray-500 font-normal">(Optional)</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                If your profile picture was created by someone else, you can credit them here. Leave blank if you created it yourself or don't want to show credits.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Artist URL
                  </label>
                  <input
                    type="url"
                    value={profile.credits.profilePicture.url}
                    onChange={(e) => handleInputChange('credits.profilePicture.url', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Artist Name
                  </label>
                  <input
                    type="text"
                    value={profile.credits.profilePicture.artist}
                    onChange={(e) => handleInputChange('credits.profilePicture.artist', e.target.value)}
                    placeholder="Artist name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  Social Links
                </h3>
                <button
                  type="button"
                  onClick={addSocialLink}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                >
                  Add Link
                </button>
              </div>
              
              {profile.socialLinks.map((link, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Link {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeSocialLink(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={link.name}
                        onChange={(e) => handleSocialLinkChange(index, 'name', e.target.value)}
                        placeholder="e.g., Twitter, GitHub"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        URL
                      </label>
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Icon
                      </label>
                      <select
                        value={link.icon}
                        onChange={(e) => handleSocialLinkChange(index, 'icon', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="Globe">Globe</option>
                        <option value="Twitter">Twitter</option>
                        <option value="Github">GitHub</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Linkedin">LinkedIn</option>
                        <option value="Mail">Email</option>
                        <option value="Youtube">YouTube</option>
                        <option value="Twitch">Twitch</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Discord">Discord</option>
                        <option value="Disc2">Music</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color Theme
                      </label>
                      <select
                        value={`${link.color} ${link.bgColor}`}
                        onChange={(e) => {
                          const [color, bgColor] = e.target.value.split(' | ')
                          handleSocialLinkChange(index, 'color', color)
                          handleSocialLinkChange(index, 'bgColor', bgColor)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="hover:text-blue-500 dark:hover:text-blue-400 | hover:bg-blue-50 dark:hover:bg-blue-900/20">Blue</option>
                        <option value="hover:text-green-500 dark:hover:text-green-400 | hover:bg-green-50 dark:hover:bg-green-900/20">Green</option>
                        <option value="hover:text-purple-500 dark:hover:text-purple-400 | hover:bg-purple-50 dark:hover:bg-purple-900/20">Purple</option>
                        <option value="hover:text-red-500 dark:hover:text-red-400 | hover:bg-red-50 dark:hover:bg-red-900/20">Red</option>
                        <option value="hover:text-pink-500 dark:hover:text-pink-400 | hover:bg-pink-50 dark:hover:bg-pink-900/20">Pink</option>
                        <option value="hover:text-gray-500 dark:hover:text-gray-400 | hover:bg-gray-50 dark:hover:bg-gray-900/20">Gray</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  )
}