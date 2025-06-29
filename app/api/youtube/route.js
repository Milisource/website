import { fetchYouTubeThumbnail, getYouTubeQuotaStatus } from './helpers.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackName = searchParams.get('track');
    const artistName = searchParams.get('artist');
    const albumName = searchParams.get('album');
    const checkQuota = searchParams.get('quota');

    // If checking quota status
    if (checkQuota === 'true') {
      const quotaStatus = getYouTubeQuotaStatus();
      return new Response(
        JSON.stringify({ 
          quotaStatus,
          message: 'YouTube quota status - use /api/music for full functionality'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    if (!trackName || !artistName) {
      return new Response(
        JSON.stringify({ error: 'Track name and artist are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    const thumbnailUrl = await fetchYouTubeThumbnail(trackName, artistName, albumName, process.env.YOUTUBE_API_KEY);

    return new Response(
      JSON.stringify({ 
        track: trackName,
        artist: artistName,
        album: albumName,
        thumbnail: thumbnailUrl 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error in YouTube route:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }
} 