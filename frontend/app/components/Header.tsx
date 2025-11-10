'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { fetchTotalDonations } from '@/lib/api';
import Logo from './Logo';

export default function Header() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && session?.user;
  const [totalDonations, setTotalDonations] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get first name from user's name
  const getUserFirstName = () => {
    const name = (session?.user as any)?.name;
    if (!name) return null;
    return name.split(' ')[0];
  };
  
  const firstName = getUserFirstName();

  useEffect(() => {
    fetchTotalDonations()
      .then((cents) => {
        setTotalDonations(cents);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching donations:', err);
        setLoading(false);
      });
  }, []);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  // Get current quarter
  const getCurrentQuarter = () => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    const year = now.getFullYear();
    return `Q${quarter} ${year}`;
  };

  const displayAmount = loading ? 0 : (totalDonations !== null ? totalDonations : 0);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-frost-gray">
      <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <Logo href="/" />
        <nav className="hidden md:flex gap-6 text-sm font-medium items-center">
          <a href="#shop" className="hover:text-crimson transition">Shop</a>
          <Link href="/collections" className="hover:text-crimson transition">Collections</Link>
          <Link href="/apply" className="hover:text-crimson transition">Sell</Link>
          <Link href="/promote" className="hover:text-crimson transition">Promote</Link>
          <a href="#events" className="hover:text-crimson transition">Events</a>
          {isAuthenticated && (
            <Link href="/admin" className="hover:text-crimson transition">Dashboard</Link>
          )}
        </nav>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
            <>
              <Link 
                href="/admin" 
                className="text-sm font-medium text-midnight-navy hover:text-crimson transition px-4 py-2"
              >
                {firstName ? `Welcome Brother ${firstName}` : 'Dashboard'}
              </Link>
              <button
                onClick={handleLogout}
                className="bg-crimson text-white px-5 py-2 rounded-full font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg text-sm"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/login" 
                className="text-sm font-medium text-midnight-navy hover:text-crimson transition px-4 py-2"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="bg-crimson text-white px-5 py-2 rounded-full font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg text-sm"
              >
                Join Now
              </Link>
            </>
          )}
          </div>
          <div className="hidden lg:flex items-center ml-4" style={{ marginRight: '20px' }}>
            <div className="relative w-20 h-20 rounded-full bg-crimson flex flex-col items-center justify-center shadow-lg border-2 border-crimson" style={{
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 2px rgba(0, 0, 0, 0.1)'
            }}>
              <div className="text-base font-bold text-white leading-tight">
                {loading ? '...' : formatCurrency(displayAmount)}
              </div>
              <div className="text-[9px] font-bold text-white uppercase leading-tight tracking-wide mt-0.5">Raised</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

