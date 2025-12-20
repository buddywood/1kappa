import Link from 'next/link';
import { SUPPORT_URL } from '@/lib/constants';
import AppStoreButtons from './AppStoreButtons';

export default function Footer() {
  return (
    <footer className="bg-cream dark:bg-black border-t border-frost-gray dark:border-gray-900 py-8 text-center text-sm text-midnight-navy/60 dark:text-gray-400">
      <p className="font-medium">One Kappa. Infinite Brotherhood.</p>
      <p className="mt-1">Connected by the Bond.</p>
      <p className="mt-4">© 2025 1Kappa – All Rights Reserved</p>
      <div className="mt-6 pt-6 border-t border-frost-gray dark:border-gray-900 max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-sm font-semibold mb-3 tracking-wide text-midnight-navy/80 dark:text-gray-300">GET THE APP</p>
          <AppStoreButtons />
        </div>
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          <Link 
            href="/terms" 
            className="text-crimson hover:text-aurora-gold dark:hover:text-crimson/80 hover:underline transition"
          >
            Terms & Conditions
          </Link>
          <span className="text-midnight-navy/30 dark:text-gray-600">|</span>
          <Link 
            href="/privacy" 
            className="text-crimson hover:text-aurora-gold dark:hover:text-crimson/80 hover:underline transition"
          >
            Privacy Policy
          </Link>
          <span className="text-midnight-navy/30 dark:text-gray-600">|</span>
          <Link 
            href={SUPPORT_URL}
            className="text-crimson hover:text-aurora-gold dark:hover:text-crimson/80 hover:underline transition"
          >
            Support
          </Link>
        </div>
        <p className="text-xs text-midnight-navy/50 dark:text-gray-500 mb-2">
          This website is not affiliated with or endorsed by Kappa Alpha Psi Fraternity, Inc.
        </p>
        <p className="text-xs text-midnight-navy/50 dark:text-gray-500">
          For official information, please visit the{' '}
          <a 
            href="https://www.kappaalphapsi1911.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-crimson hover:text-aurora-gold dark:hover:text-crimson/80 hover:underline transition"
          >
            Kappa Alpha Psi Fraternity, Inc. official website
          </a>
          .
        </p>
      </div>
    </footer>
  );
}


