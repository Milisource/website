import { fetchSpotifyImage } from './helpers.js';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Spotify configuration missing' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const trackName = searchParams.get('track');
    const artistName = searchParams.get('artist');
    const albumName = searchParams.get('album');

    if (!trackName || !artistName) {
      return new Response(
        JSON.stringify({ error: 'Track name and artist are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    const imageUrl = await fetchSpotifyImage(trackName, artistName, albumName);

    return new Response(
      JSON.stringify({ 
        track: trackName,
        artist: artistName,
        album: albumName,
        image: imageUrl 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error in Spotify route:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }
} 