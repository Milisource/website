import { profile } from './profile'
import ProfileHeader from './components/ProfileHeader.jsx'
import SocialLinks from './components/SocialLinks.jsx'

export default function Page() {
  return (
    <main className={profile.background + " min-h-screen"}>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <ProfileHeader />
        {/* About Section */}
        <section className="my-16 animate-on-load animate-fade-in-up animate-delay-300">
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-2xl p-8 shadow-lg border border-pink-100 dark:border-pink-900/20">
            <h2 className="text-2xl font-bold mb-3 text-center text-gray-800 dark:text-gray-200 animate-on-load animate-fade-in-up animate-delay-400">
              About Me
            </h2>
            {/* See profile.js. */}
            <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-2xl mx-auto animate-on-load animate-fade-in-up animate-delay-500">
              {profile.aboutMe}
            </p>
            
            {/* Credits Section - Only show if credits are provided */}
            {profile.credits?.profilePicture?.artist && profile.credits?.profilePicture?.url && (
              <>
                <br />
                <br />
                <h2 className="text-2xl font-bold mb-3 text-center text-gray-800 dark:text-gray-200 animate-on-load animate-fade-in-up animate-delay-400">
                  Credits
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-2xl mx-auto animate-on-load animate-fade-in-up animate-delay-500">
                  <b>Profile Picture: </b><a href={profile.credits.profilePicture.url} target="_blank" rel="noopener noreferrer" className="gradient-link">{profile.credits.profilePicture.artist}</a>
                </p>
              </>
            )}
          </div>
        </section>
        {/* Social Links */}
        <section className="my-16 animate-on-load animate-fade-in-up animate-delay-600">
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-2xl p-8 shadow-lg border border-pink-100 dark:border-pink-900/20">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200 animate-on-load animate-fade-in-up animate-delay-700">
              Socials
            </h2>
            <SocialLinks />
          </div>
        </section>
        {/* Footer */}
        <footer className="text-center text-gray-500 dark:text-gray-400 text-sm mt-16 animate-on-load animate-fade-in-up animate-delay-800">
          <p>Remember that you are human. <span className="text-pink-500">♥</span></p>
        </footer>
      </div>
    </main>
  )
}
