# Personal Portfolio Site
A beautiful, personalized website featuring Last.FM integration to showcase your active listening field. Built with Next.js, React, and TailwindCSS.

## ✨ Features
- **Personal Introduction**: Warm, welcoming homepage
- **Last.FM Integration**: Real-time display of current listening status and recent tracks
- **Responsive Design**: Beautiful on all devices
- **Social Links**: Easy connection to Twitter, GitHub, Discord, and more
- **Modern UI**: Clean, comfortable design with smooth animations

## 🚀 Getting Started
### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm (preferrably pnpm)
- [Last.FM account](https://www.last.fm/api/authentication) (for music integration)
   - [Spotify App](https://developer.spotify.com/documentation/web-api/tutorials/getting-started#create-an-app) (fallback thumbnails)
   - [YouTube API Key](https://developers.google.com/youtube/v3/getting-started) (fallback thumbnails)

## Setup
### Project Folder Structure
   ```
   .
   ├── app/                                 # Main Next.js app directory
   │   ├── api/                             # API routes (serverless functions)
   │   │   └── music/
   │   │       └── route.js                 # API endpoint for Last.FM/Spotify/YouTube music integration
   │   ├── components/                      # Reusable React components
   │   │   ├── ProfileHeader.jsx            # Profile header component (name, bio, avatar)
   │   │   └── SocialLinks.jsx              # Social media links component
   │   ├── profile.js                       # Central profile data (name, bio, about, credits, etc.)
   │   └── page.jsx                         # Main page component (homepage layout)
   ├── public/
   │   └── pfp.png                          # Profile picture (static asset)
   ├── tailwind.config.js                   # TailwindCSS configuration
   ├── package.json                         # Project metadata and scripts
   ├── pnpm-lock.yaml                       # pnpm lockfile (dependency versions)
   ├── jsconfig.json                        # JS path aliases and config
   └── README.md                            # Project documentation (this file)
   ```

### Profile.js
- Edit `app/profile.js` to update your name, bio, image, aboutMe, and credits.
    - My `profile.js` will give you a baseplate to go off of.
- Example:
     ```js
     export const profile = {
       name: "Your Name",
       bio: "Your bio here.",
       image: "/pfp.png",
       background: "...",
       aboutMe: "A little about you.",
       credits: {
         profilePicture: {
           url: "https://link-to-artist.com",
           artist: "Artist Name"
         }
       }
     }
     ```
- The site imports this file to display your information throughout the app.

## Enviornment Variables
Your `.env` file should look like this:
```
LASTFM_USERNAME=""
LASTFM_API_KEY=""
SPOTIFY_CLIENT_ID=""
SPOTIFY_CLIENT_SECRET=""
YOUTUBE_API_KEY=""
```

## Notes
- For music integration, set up your Last.FM, Spotify, and YouTube API keys as described above.

## Limitations
- App can sometimes hit YouTube API limits, avoid rapid refreshes, though we tried to combat this as much as possible.
- It's a Next.JS app, so it's bloated by default.
   - I plan to return later and make this in swelvte.
- Currently no support for more pages.