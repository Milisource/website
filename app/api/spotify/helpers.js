const cache = new Map();
let accessToken = null;
let tokenExpiry = 0;

// Get Spotify access token using Client ID and Client Secret
async function getSpotifyAccessToken() {
  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.warn('Spotify: Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
    return null;
  }

  // Check if we have a valid cached token
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      console.warn('Spotify: Failed to get access token');
      return null;
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Expire 1 minute early
    
    return accessToken;
  } catch (error) {
    console.warn('Spotify: Error getting access token:', error.message);
    return null;
  }
}

export async function fetchSpotifyImage(trackName, artistName, albumName) {
  const key = `${trackName}|${artistName}|${albumName}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < 10 * 60 * 1000) {
    return cached.url;
  }

  try {
    const token = await getSpotifyAccessToken();
    if (!token) return null;

    // Create a more specific search query
    const searchTerms = [trackName, artistName];
    if (albumName && albumName.trim()) searchTerms.push(albumName);
    
    const q = encodeURIComponent(searchTerms.join(' ').trim());
    const url = `https://api.spotify.com/v1/search?q=${q}&type=track&limit=1&market=US`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const res = await fetch(url, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      if (res.status === 401) {
        console.warn('Spotify API: Unauthorized - token may be expired');
        // Clear the token so we get a new one next time
        accessToken = null;
        tokenExpiry = 0;
        return null;
      }
      if (res.status === 429) {
        console.warn('Spotify API: Rate limited');
        return null;
      }
      return null;
    }
    
    const data = await res.json();
    const item = data.tracks?.items?.[0];
    
    if (item && item.album && item.album.images && item.album.images.length > 0) {
      // Prefer high quality images
      const image = item.album.images.find(img => img.height >= 300) || item.album.images[0];
      const urlResult = image?.url;
      
      if (urlResult) {
        cache.set(key, { url: urlResult, ts: Date.now() });
        return urlResult;
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('Spotify API: Request timeout');
    } else {
      console.warn('Spotify API error:', error.message);
    }
  }
  
  return null;
} 