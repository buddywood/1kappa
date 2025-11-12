'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { getStewardListing, claimStewardListing, createStewardCheckoutSession } from '@/lib/api';
import type { StewardListing } from '@/lib/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import VerificationBadge from '../../components/VerificationBadge';

export default function StewardListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = parseInt(params.id as string);
  
  const [listing, setListing] = useState<StewardListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [platformFee, setPlatformFee] = useState<number | null>(null);

  useEffect(() => {
    async function loadListing() {
      try {
        const data = await getStewardListing(listingId);
        setListing(data);
        
        // Calculate platform fee (this would ideally come from backend, but we'll estimate)
        // For now, we'll fetch it from the checkout endpoint or use a default
        try {
          // Try to get platform fee from settings or use default 5%
          const estimatedFee = Math.round((data.shipping_cost_cents + data.chapter_donation_cents) * 0.05);
          setPlatformFee(estimatedFee);
        } catch (err) {
          // Use default if calculation fails
          setPlatformFee(Math.round((data.shipping_cost_cents + data.chapter_donation_cents) * 0.05));
        }
      } catch (err: any) {
        console.error('Error loading listing:', err);
        if (err.message === 'VERIFICATION_REQUIRED' || err.message.includes('verified')) {
          setError('You must be a verified member to view this listing.');
        } else if (err.message === 'Not authenticated') {
          router.push('/login');
          return;
        } else {
          setError(err.message || 'Failed to load listing');
        }
      } finally {
        setLoading(false);
      }
    }

    if (listingId) {
      loadListing();
    }
  }, [listingId, router]);

  const handleClaim = async () => {
    if (!listing) return;

    setClaiming(true);
    setError('');

    try {
      // First claim the listing
      await claimStewardListing(listingId);
      
      // Then create checkout session
      const { url } = await createStewardCheckoutSession(listingId);
      
      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      console.error('Error claiming listing:', err);
      setError(err.message || 'Failed to claim listing');
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center py-12">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-2xl font-display font-bold text-midnight-navy mb-4">
              {error.includes('verified') ? 'Verification Required' : 'Error'}
            </h1>
            <p className="text-midnight-navy/70 mb-6">{error}</p>
            {error.includes('verified') && (
              <button
                onClick={() => router.push('/profile')}
                className="bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition"
              >
                Go to Profile
              </button>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">Listing not found</div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalAmount = listing.shipping_cost_cents + (platformFee || 0) + listing.chapter_donation_cents;

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Image */}
            <div className="aspect-square relative bg-cream rounded-lg overflow-hidden">
              {listing.image_url ? (
                <Image
                  src={listing.image_url}
                  alt={listing.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-midnight-navy/30">
                  <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <div className="mb-4">
                <h1 className="text-3xl font-display font-bold text-midnight-navy mb-2">
                  {listing.name}
                </h1>
                {listing.chapter && (
                  <VerificationBadge 
                    type="sponsored-chapter" 
                    chapterName={listing.chapter.name}
                  />
                )}
              </div>

              {listing.description && (
                <p className="text-midnight-navy/70 mb-6">{listing.description}</p>
              )}

              <div className="bg-cream p-4 rounded-lg mb-6">
                <p className="text-sm text-midnight-navy/70 mb-4">
                  <strong>This item is FREE!</strong> You only pay shipping, platform fees, and a donation to the steward&apos;s chapter.
                </p>
                
                <div className="space-y-2 text-sm">
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
                    <span className="font-semibold">${((platformFee || 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-midnight-navy/60">Chapter Donation:</span>
                    <span className="font-semibold text-crimson">${(listing.chapter_donation_cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-midnight-navy/20 pt-2 mt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-crimson">${(totalAmount / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {listing.status === 'ACTIVE' ? (
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {claiming ? 'Processing...' : 'Claim This Item'}
                </button>
              ) : listing.status === 'CLAIMED' ? (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-center">
                  This item has been claimed
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg text-center">
                  This listing is no longer available
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

