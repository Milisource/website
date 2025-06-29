"use client";

import { useState, useEffect } from "react";
import { Play, Clock, Disc2 } from "lucide-react";

// The thingy! It's the thingy!
export default function LastFMStatus() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [recentTracks, setRecentTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  useEffect(() => {
    let interval;
    let isActive = true;

    async function fetchLastFMData() {
      if (!isActive) return;

      // Prevent fetching if we've already fetched in the last 3 minutes
      const now = Date.now();
      if (now - lastFetchTime < 180000) return;

      try {
        setIsLoading(true);
        // my fucking cache!!!!!!! useless!!!!!! do not cache!!!!!!!!
        const response = await fetch("/api/music", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch music data");
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setCurrentTrack(data.currentTrack);
        setRecentTracks(data.recentTracks);
        setHasLoaded(true);
        setLastFetchTime(now);
      } catch (err) {
        console.error("Error fetching Last.FM data:", err);
        setError(err.message);
        setHasLoaded(true);
      } finally {
        setIsLoading(false);
      }
    }

    function handleVisibility() {
      isActive = document.visibilityState === "visible";
      // Did we fetch in the last 3 minutes and is the page visible? If all are true, fetch.
      if (isActive && Date.now() - lastFetchTime > 180000) {
        fetchLastFMData();
      }
    }

    fetchLastFMData();
    interval = setInterval(() => {
      // Update every 3 minutes
      if (document.visibilityState === "visible") fetchLastFMData();
    }, 180000);

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [lastFetchTime]);

  // Loading screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 animate-fade-in-up">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">
          Loading music...
        </span>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="text-center py-8 animate-fade-in-up">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">
            Unable to load music data.
          </p>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="space-y-8">
      {/* Current Track */}
      {currentTrack && (
        <div
          className={`animate-on-load animate-fade-in-up ${
            hasLoaded ? "animate-delay-100" : ""
          }`}
        >

          {/* Now Playing & Recently Played Titles */}
          {/* There used to be a feature here that would delete my Last.FM account if a bbno$ song showed up, I wish it was still here. */}
          <div className="flex items-center justify-center gap-2 mb-4 animate-on-load animate-fade-in-up animate-delay-200">
            {currentTrack.isNowPlaying ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Play className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-medium">Now Playing</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Recently Played</span>
              </div>
            )}
          </div>

          {/* Album Art & Song Info */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-pink-200 dark:border-pink-800 relative flex items-center justify-center animate-on-load animate-scale-in animate-delay-300">

            {/* Spinning Vinyl */}
            <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none animate-on-load animate-fade-in animate-delay-400">
              <img
                src="/vinyl-record.svg"
                alt="Spinning vinyl record"
                className="w-32 h-32 opacity-40 animate-spin"
                style={{ animationDuration: "4s" }}
                draggable="false"
              />
            </div>

            {/* Content Layout */}
            <div className="relative z-10 w-full flex items-center gap-6">

              {/* Song Info - Left Side */}
              <div className="flex-1 text-left animate-on-load animate-fade-in-up animate-delay-500">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  {currentTrack.name}
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-1">
                  {currentTrack.artist}
                </p>
                {currentTrack.album && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {currentTrack.album}
                  </p>
                )}
                {currentTrack.url && (
                  <a
                    href={currentTrack.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 text-sm font-medium transition-colors"
                  >
                    <Disc2 className="w-4 h-4" />
                    View on Last.FM
                  </a>
                )}
              </div>

              {/* Album Art - Right Side */}
              {currentTrack.image && (
                <div className="flex-shrink-0 animate-on-load animate-scale-in animate-delay-600">
                  <img
                    src={currentTrack.image}
                    alt={`${currentTrack.album} cover`}
                    className="w-32 h-32 rounded-lg shadow-lg object-cover aspect-square"
                    onError={(e) => {
                      // Hide the image if it fails to load
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Recent Tracks */}
      {recentTracks.length > 0 && (
        <div
          className={`animate-on-load animate-fade-in-up ${
            hasLoaded ? "animate-delay-400" : ""
          }`}
        >
          {/* Recently Listened Titles */}
          {/* these comments suck donkey balls and i'm not changing them */}
          <h3 className="text-lg font-semibold mb-4 text-center text-gray-700 dark:text-gray-300 animate-on-load animate-fade-in-up animate-delay-500">
            Recently Listened
          </h3>

          {/* List of Recently Listened Titles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentTracks.map((track, index) => (
              <a
                key={index}
                href={track.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`bg-white/50 dark:bg-gray-700/50 rounded-lg p-4 text-center transition-all duration-300 animate-on-load animate-scale-in hover:bg-gradient-to-br hover:from-pink-50 hover:to-purple-50 dark:hover:from-pink-900/20 dark:hover:to-purple-900/20 hover:shadow-lg hover:scale-105 cursor-pointer group`}
                style={{ animationDelay: `${0.6 + index * 0.1}s` }}
              >
                {track.image && (
                  <img
                    src={track.image}
                    alt={`${track.album} cover`}
                    className="w-16 h-16 mx-auto mb-3 rounded-md shadow-sm object-cover"
                    onError={(e) => {
                      // Hide the image if it fails to load
                      e.target.style.display = "none";
                    }}
                  />
                )}
                <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-1 truncate group-hover:text-gray-900 dark:group-hover:text-gray-100">
                  {track.name}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {track.artist}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}