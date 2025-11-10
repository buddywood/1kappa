'use client';

import { useEffect, useState } from 'react';
import { fetchTotalDonations } from '@/lib/api';

export default function ImpactBanner() {
  const [totalDonations, setTotalDonations] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Always show the banner, even if loading or no data
  const displayAmount = loading ? 0 : (totalDonations !== null ? totalDonations : 0);

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-crimson/10 via-aurora-gold/10 to-crimson/10 rounded-2xl border border-crimson/20 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-crimson/20 flex items-center justify-center flex-shrink-0">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-crimson"
              >
                <path
                  d="M12 2 L15 9 L22 10 L16 15 L18 22 L12 18 L6 22 L8 15 L2 10 L9 9 Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-midnight-navy">Our Impact</h3>
              <p className="text-sm text-midnight-navy/70">
                Supporting chapters through every purchase
              </p>
            </div>
          </div>
          <div className="text-center md:text-right">
            {loading ? (
              <div className="text-midnight-navy/50">Loading...</div>
            ) : (
              <>
                <div className="text-3xl md:text-4xl font-display font-bold text-crimson mb-1">
                  {formatCurrency(displayAmount)}
                </div>
                <p className="text-sm text-midnight-navy/70">
                  given back to chapters this {getCurrentQuarter()}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

