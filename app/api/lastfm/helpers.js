const cache = new Map();

export async function fetchLastFMCurrentTrack(username, apiKey) {
  const cacheKey = `current_${username}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 30 * 1000) { // 30 second cache for current track
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=1`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      if (res.status === 404) {
        console.warn('Last.FM API: User not found');
        return null;
      }
      if (res.status === 403) {
        console.warn('Last.FM API: Invalid API key');
        return null;
      }
      throw new Error(`Last.FM API error: ${res.status}`);
    }
    
    const data = await res.json();
    const track = data.recenttracks?.track?.[0];
    
    if (!track) {
      cache.set(cacheKey, { data: null, ts: Date.now() });
      return null;
    }
    
    const result = {
      name: track.name,
      artist: track.artist['#text'],
      album: track.album['#text'],
      images: track.image,
      isNowPlaying: track['@attr']?.nowplaying === 'true',
      url: track.url
    };
    
    cache.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('Last.FM API: Request timeout');
    } else {
      console.warn('Last.FM API error:', error.message);
    }
    return null;
  }
}

export async function fetchLastFMRecentTracks(username, apiKey, excludeTrack) {
  const cacheKey = `recent_${username}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 5 * 60 * 1000) { // 5 minute cache for recent tracks
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=10`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      if (res.status === 404) {
        console.warn('Last.FM API: User not found');
        return [];
      }
      if (res.status === 403) {
        console.warn('Last.FM API: Invalid API key');
        return [];
      }
      throw new Error(`Last.FM API error: ${res.status}`);
    }
    
    const data = await res.json();
    const seen = new Set();
    const tracks = [];
    
    for (const track of data.recenttracks?.track || []) {
      const key = track.name + '|' + track.artist['#text'];
      
      // Skip if it's the current track and it's now playing
      if (excludeTrack && 
          track.name === excludeTrack.name && 
          track.artist['#text'] === excludeTrack.artist && 
          excludeTrack.isNowPlaying) {
        continue;
      }
      
      if (!seen.has(key)) {
        tracks.push({
          name: track.name,
          artist: track.artist['#text'],
          album: track.album['#text'],
          images: track.image,
          url: track.url
        });
        seen.add(key);
      }
      
      if (tracks.length === 4) break;
    }
    
    cache.set(cacheKey, { data: tracks, ts: Date.now() });
    return tracks;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('Last.FM API: Request timeout');
    } else {
      console.warn('Last.FM API error:', error.message);
    }
    return [];
  }
} 