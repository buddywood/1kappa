'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getStewardListing, type StewardListing } from '@/lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function StewardCheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const listingId = parseInt(params.listingId as string);
  const sessionId = searchParams.get('session_id');

  const [listing, setListing] = useState<StewardListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [platformFee, setPlatformFee] = useState<number>(0);

  useEffect(() => {
    async function loadListing() {
      try {
        const data = await getStewardListing(listingId);
        setListing(data);
        
        // Estimate platform fee (5% default, actual will be shown in Stripe checkout)
        const estimatedFee = Math.round((data.shipping_cost_cents + data.chapter_donation_cents) * 0.05);
        setPlatformFee(estimatedFee);
      } catch (err: any) {
        console.error('Error loading listing:', err);
        setError(err.message || 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    }

    if (listingId) {
      loadListing();
    }
  }, [listingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center py-12">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-2xl font-display font-bold text-midnight-navy mb-4">
              {error || 'Listing not found'}
            </h1>
            <button
              onClick={() => router.push('/steward-marketplace')}
              className="bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition"
            >
              Back to Marketplace
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalAmount = listing.shipping_cost_cents + platformFee + listing.chapter_donation_cents;

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />
      
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-display font-bold text-midnight-navy mb-6">
            {sessionId ? 'Payment Successful!' : 'Checkout'}
          </h1>

          {sessionId ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-midnight-navy mb-4">
                Your claim has been processed!
              </h2>
              <p className="text-midnight-navy/70 mb-6">
                The steward will be notified and will ship the item to you.
              </p>
              <button
                onClick={() => router.push('/steward-marketplace')}
                className="bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition"
              >
                Back to Marketplace
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-midnight-navy mb-4">{listing.name}</h2>
                
                <div className="bg-cream p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-midnight-navy/60">Item:</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-midnight-navy/60">Shipping:</span>
                    <span className="font-semibold">${(listing.shipping_cost_cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-midnight-navy/60">Platform Fee:</span>
                    <span className="font-semibold">${(platformFee / 100).toFixed(2)}</span>
                    <span className="text-xs text-midnight-navy/50">(admin-configured)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-midnight-navy/60">Chapter Donation:</span>
                    <span className="font-semibold text-crimson">${(listing.chapter_donation_cents / 100).toFixed(2)}</span>
                  </div>
                  {listing.chapter && (
                    <div className="text-xs text-midnight-navy/50 mt-2">
                      Donation goes to: {listing.chapter.name}
                    </div>
                  )}
                  <div className="border-t border-midnight-navy/20 pt-3 mt-3 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-crimson">${(totalAmount / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-midnight-navy/60 mb-6">
                You will be redirected to Stripe to complete payment. The actual platform fee may vary slightly based on admin settings.
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

