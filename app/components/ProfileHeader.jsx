import Image from 'next/image'
import { profile } from '../profile'
import LastFMStatus from './LastFMStatus'

// See profile.js for how this works.
export default function ProfileHeader() {
  return (
    <div className="w-full max-w-2xl mx-auto mt-10 p-6 bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-lg flex flex-col items-center gap-6 animate-on-load animate-fade-in-up">
      <div className="flex flex-col items-center gap-3">
        <div className="w-24 h-24 aspect-square rounded-full overflow-hidden border border-black animate-on-load animate-scale-in animate-delay-200">
          <Image
            src={profile.image}
            alt={profile.name + ' profile picture'}
            width={96}
            height={96}
            className="object-cover w-full h-full rounded-full"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 animate-on-load animate-fade-in-up animate-delay-300">{profile.name}</h1>
        <p className="text-gray-600 dark:text-gray-300 text-center max-w-md animate-on-load animate-fade-in-up animate-delay-400">{profile.bio}</p>
      </div>
      <div className="animate-on-load animate-fade-in-up animate-delay-500">
        <LastFMStatus />
      </div>
    </div>
  )
} 