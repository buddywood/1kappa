import Link from 'next/link';
import { FaApple, FaGooglePlay } from 'react-icons/fa';

interface AppStoreButtonsProps {
  className?: string;
}

export default function AppStoreButtons({ className = '' }: AppStoreButtonsProps) {
  return (
    <div className={`flex flex-wrap justify-center gap-4 ${className}`}>
      {/* Apple App Store */}
      <Link 
        href="https://apps.apple.com/us/app/1kappa/id6755639624" 
        target="_blank" 
        rel="noopener noreferrer"
        className="group relative inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg border border-white/20 shadow-md hover:scale-105 transition-all duration-300 w-[160px]"
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
        <FaApple className="w-8 h-8 text-white" />
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] opacity-80 font-medium">Download on the</span>
          <span className="text-[16px] font-bold font-display tracking-wide">App Store</span>
        </div>
      </Link>

      {/* Google Play Store */}
      <Link 
        href="https://play.google.com/store/apps/details?id=com.onekappa.mobile" 
        target="_blank" 
        rel="noopener noreferrer"
        className="group relative inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg border border-white/20 shadow-md hover:scale-105 transition-all duration-300 w-[160px]"
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
        <FaGooglePlay className="w-7 h-7 text-white" />
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] opacity-80 font-medium">GET IT ON</span>
          <span className="text-[16px] font-bold font-display tracking-wide">Google Play</span>
        </div>
      </Link>
    </div>
  );
}
