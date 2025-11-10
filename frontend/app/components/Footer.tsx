import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-cream border-t border-frost-gray py-8 text-center text-sm text-midnight-navy/60">
      <p className="font-medium">One Kappa. Infinite Brotherhood.</p>
      <p className="mt-1">Connected by the Bond.</p>
      <p className="mt-4">© 2025 1Kappa – All Rights Reserved</p>
      <div className="mt-6 pt-6 border-t border-frost-gray max-w-2xl mx-auto">
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          <Link 
            href="/terms" 
            className="text-crimson hover:text-aurora-gold hover:underline transition"
          >
            Terms & Conditions
          </Link>
          <span className="text-midnight-navy/30">|</span>
          <Link 
            href="/privacy" 
            className="text-crimson hover:text-aurora-gold hover:underline transition"
          >
            Privacy Policy
          </Link>
        </div>
        <p className="text-xs text-midnight-navy/50 mb-2">
          This website is not affiliated with or endorsed by Kappa Alpha Psi Fraternity, Inc.
        </p>
        <p className="text-xs text-midnight-navy/50">
          For official information, please visit the{' '}
          <a 
            href="https://www.kappaalphapsi1911.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-crimson hover:text-aurora-gold hover:underline transition"
          >
            Kappa Alpha Psi Fraternity, Inc. official website
          </a>
          .
        </p>
      </div>
    </footer>
  );
}

