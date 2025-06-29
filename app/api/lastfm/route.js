import { fetchLastFMCurrentTrack, fetchLastFMRecentTracks } from './helpers.js';

export async function GET() {
  const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
  const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

  if (!LASTFM_USERNAME || !LASTFM_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Last.FM configuration missing' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }

  try {
    // Get current track from Last.FM
    const currentTrackRaw = await fetchLastFMCurrentTrack(LASTFM_USERNAME, LASTFM_API_KEY);
    let currentTrack = null;
    if (currentTrackRaw) {
      // Get image from Last.FM
      let imageUrl = null;
      if (Array.isArray(currentTrackRaw.images)) {
        imageUrl = currentTrackRaw.images.find(img => img.size === 'large')?.['#text'] ||
                   currentTrackRaw.images.find(img => img.size === 'medium')?.['#text'] ||
                   currentTrackRaw.images.find(img => img.size === 'small')?.['#text'] ||
                   currentTrackRaw.images.find(img => img.size === 'extralarge')?.['#text'] ||
                   currentTrackRaw.images[2]?.['#text'] ||
                   currentTrackRaw.images[1]?.['#text'] ||
                   currentTrackRaw.images[0]?.['#text'];
      }
      if (!imageUrl || imageUrl.trim() === '') imageUrl = null;
      currentTrack = {
        name: currentTrackRaw.name,
        artist: currentTrackRaw.artist,
        album: currentTrackRaw.album,
        image: imageUrl,
        isNowPlaying: currentTrackRaw.isNowPlaying,
        url: currentTrackRaw.url
      };
    }

    // Get recent tracks from Last.FM
    const recentTracksRaw = await fetchLastFMRecentTracks(LASTFM_USERNAME, LASTFM_API_KEY, currentTrackRaw);
    const recentTracks = [];
    for (const track of recentTracksRaw) {
      let imageUrl = null;
      if (Array.isArray(track.images)) {
        imageUrl = track.images.find(img => img.size === 'medium')?.['#text'] ||
                   track.images.find(img => img.size === 'large')?.['#text'] ||
                   track.images.find(img => img.size === 'small')?.['#text'] ||
                   track.images[1]?.['#text'] ||
                   track.images[0]?.['#text'];
      }
      if (!imageUrl || imageUrl.trim() === '') imageUrl = null;
      recentTracks.push({
        name: track.name,
        artist: track.artist,
        album: track.album,
        image: imageUrl,
        url: track.url
      });
      if (recentTracks.length === 4) break;
    }

    return new Response(
      JSON.stringify({ currentTrack, recentTracks }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching Last.FM data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }
} 