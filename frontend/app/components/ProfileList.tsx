'use client';

import Image from 'next/image';
import Link from 'next/link';

interface Profile {
  id: number;
  name: string;
  avatar?: string;
  hasNewStory?: boolean;
}

// This will be replaced with actual API data
const mockProfiles: Profile[] = [
  { id: 1, name: 'James Bruno', hasNewStory: true },
  { id: 2, name: 'Fernando Smith', hasNewStory: true },
  { id: 3, name: 'Michael Bruno', hasNewStory: false },
  { id: 4, name: 'Emma Stone', hasNewStory: true },
  { id: 5, name: 'Sarah Jhonn', hasNewStory: false },
];

export default function ProfileList() {
  return (
    <div className="mb-6 pb-4 border-b border-gray-200">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {mockProfiles.map((profile) => (
          <Link
            key={profile.id}
            href={`/connect/profile/${profile.id}`}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div className="relative">
              <div
                className={`w-16 h-16 rounded-full p-0.5 ${
                  profile.hasNewStory
                    ? 'bg-gradient-to-tr from-crimson to-aurora-gold'
                    : 'bg-gray-300'
                }`}
              >
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-200">
                    {profile.avatar ? (
                      <Image
                        src={profile.avatar}
                        alt={profile.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-crimson font-bold text-lg">
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {profile.hasNewStory && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-crimson rounded-full border-2 border-white"></div>
              )}
            </div>
            <p className="text-xs text-midnight-navy font-medium max-w-[64px] truncate">
              {profile.name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

