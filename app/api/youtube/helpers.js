const cache = new Map();
let quotaExceeded = false;
let quotaResetTime = 0;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

// Check if we should skip YouTube API calls
function shouldSkipYouTubeAPI() {
  // If quota is exceeded, check if it's time to reset
  if (quotaExceeded) {
    const now = Date.now();
    if (now >= quotaResetTime) {
      quotaExceeded = false;
      quotaResetTime = 0;
      console.log('YouTube API: Quota reset, resuming API calls');
    } else {
      return true;
    }
  }
  
  // Rate limiting: ensure minimum interval between requests
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    return true;
  }
  
  return false;
}

// Mark quota as exceeded
function markQuotaExceeded() {
  quotaExceeded = true;
  // Reset quota after 1 hour (3600000 ms)
  quotaResetTime = Date.now() + 3600000;
  console.warn('YouTube API: Quota exceeded, pausing API calls for 1 hour');
}

export async function fetchYouTubeThumbnail(trackName, artistName, albumName, apiKey) {
  if (!apiKey) return null;
  
  // Check if we should skip this request
  if (shouldSkipYouTubeAPI()) {
    return null;
  }
  
  const key = `${trackName}|${artistName}|${albumName}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < 10 * 60 * 1000) {
    return cached.url;
  }

  try {
    // Update last request time
    lastRequestTime = Date.now();
    
    // Create a more specific search query
    const searchTerms = [trackName, artistName];
    if (albumName && albumName.trim()) searchTerms.push(albumName);
    searchTerms.push('audio', 'music'); // Add music-specific terms
    
    const q = encodeURIComponent(searchTerms.join(' ').trim());
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${q}&key=${apiKey}&videoCategoryId=10`; // Music category
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const res = await fetch(url, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      if (res.status === 403) {
        console.warn('YouTube API: Forbidden - check API key or quota');
        markQuotaExceeded();
        return null;
      }
      if (res.status === 429) {
        console.warn('YouTube API: Rate limited');
        // For rate limiting, wait a bit longer
        quotaExceeded = true;
        quotaResetTime = Date.now() + 300000; // 5 minutes
        return null;
      }
      return null;
    }
    
    const data = await res.json();
    const video = data.items?.[0];
    
    if (video && video.snippet && video.snippet.thumbnails) {
      // Prefer high quality thumbnails
      const thumbnail = video.snippet.thumbnails.high || 
                       video.snippet.thumbnails.medium || 
                       video.snippet.thumbnails.default;
      
      const urlResult = thumbnail?.url;
      
      if (urlResult) {
        cache.set(key, { url: urlResult, ts: Date.now() });
        return urlResult;
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('YouTube API: Request timeout');
    } else {
      console.warn('YouTube API error:', error.message);
    }
  }
  
  return null;
}

// Export function to check quota status (for debugging)
export function getYouTubeQuotaStatus() {
  return {
    quotaExceeded,
    quotaResetTime: quotaResetTime > 0 ? new Date(quotaResetTime).toISOString() : null,
    timeUntilReset: quotaResetTime > 0 ? Math.max(0, quotaResetTime - Date.now()) : 0
  };
} 