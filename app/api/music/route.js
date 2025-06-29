import { fetchLastFMCurrentTrack, fetchLastFMRecentTracks } from '../lastfm/helpers.js';
import { fetchSpotifyImage } from '../spotify/helpers.js';
import { fetchYouTubeThumbnail } from '../youtube/helpers.js';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Disable caching for this route
export const revalidate = 0;

// Helper function to get best image from Last.FM images array
function getBestLastFMImage(images) {
  if (!Array.isArray(images)) return null;
  
  const sizePriority = ['large', 'extralarge', 'medium', 'small'];
  
  // Try to find image by size priority
  for (const size of sizePriority) {
    const image = images.find(img => img.size === size)?.['#text'];
    if (image && image.trim() !== '') return image;
  }
  
  // Fallback to first available image
  for (let i = 0; i < images.length; i++) {
    const image = images[i]?.['#text'];
    if (image && image.trim() !== '') return image;
  }
  
  return null;
}

// Helper function to get image with fallbacks
async function getImageWithFallbacks(track, youtubeApiKey) {
  // Try Last.FM first
  let imageUrl = getBestLastFMImage(track.images);
  
  // If no Last.FM image, try Spotify first (more reliable, better quality)
  if (!imageUrl || imageUrl.trim() === '') {
    try {
      imageUrl = await fetchSpotifyImage(track.name, track.artist, track.album);
    } catch (error) {
      console.warn('Spotify fallback failed:', error.message);
    }
  }
  
  // Only try YouTube if we still don't have an image (to conserve quota)
  if (!imageUrl || imageUrl.trim() === '') {
    try {
      imageUrl = await fetchYouTubeThumbnail(track.name, track.artist, track.album, youtubeApiKey);
    } catch (error) {
      console.warn('YouTube fallback failed:', error.message);
    }
  }
  
  return imageUrl;
}

export async function GET(request) {
  const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
  const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  // Add cache-busting timestamp
  const timestamp = Date.now();

  if (!LASTFM_USERNAME || !LASTFM_API_KEY) {
    return new Response(JSON.stringify({ error: 'Last.FM configuration missing' }), { 
      status: 500, 
      headers: { 
        'Content-Type': 'application/json', 
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'X-Timestamp': timestamp.toString()
      } 
    })
  }

  try {
    // First get current track
    const currentTrackRaw = await fetchLastFMCurrentTrack(LASTFM_USERNAME, LASTFM_API_KEY);
    
    // Then get recent tracks, excluding the current track
    const recentTracksRaw = await fetchLastFMRecentTracks(LASTFM_USERNAME, LASTFM_API_KEY, currentTrackRaw);

    // Process current track
    let currentTrack = null;
    if (currentTrackRaw) {
      const imageUrl = await getImageWithFallbacks(currentTrackRaw, YOUTUBE_API_KEY);
      
      currentTrack = {
        name: currentTrackRaw.name,
        artist: currentTrackRaw.artist,
        album: currentTrackRaw.album,
        image: imageUrl,
        isNowPlaying: currentTrackRaw.isNowPlaying,
        url: currentTrackRaw.url
      };
    }

    // Process recent tracks (limit to 4)
    const recentTracks = [];
    const tracksToProcess = recentTracksRaw.slice(0, 4);
    
    // Process all tracks in parallel for better performance
    const trackPromises = tracksToProcess.map(async (track) => {
      const imageUrl = await getImageWithFallbacks(track, YOUTUBE_API_KEY);
      
      return {
        name: track.name,
        artist: track.artist,
        album: track.album,
        image: imageUrl,
        url: track.url
      };
    });

    const processedTracks = await Promise.all(trackPromises);
    
    // Final filter to ensure no duplicates with current track
    const filteredTracks = processedTracks.filter(track => 
      !currentTrack || 
      track.name !== currentTrack.name || 
      track.artist !== currentTrack.artist
    );
    
    recentTracks.push(...filteredTracks);

    return new Response(
      JSON.stringify({ currentTrack, recentTracks, timestamp }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json', 
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'X-Timestamp': timestamp.toString()
        } 
      }
    );
  } catch (error) {
    console.error('Error fetching music data:', error);
    return new Response(
      JSON.stringify({ error: error.message, timestamp }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json', 
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'X-Timestamp': timestamp.toString()
        } 
      }
    );
  }
} 