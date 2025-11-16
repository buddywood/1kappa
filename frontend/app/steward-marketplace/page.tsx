'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getStewardMarketplace, fetchChapters, type StewardListing, type Chapter } from '@/lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VerificationBadge from '../components/VerificationBadge';

export default function StewardMarketplacePage() {
  const router = useRouter();
  const [listings, setListings] = useState<StewardListing[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [listingsData, chaptersData] = await Promise.all([
          getStewardMarketplace(),
          fetchChapters(),
        ]);
        console.log('Steward Marketplace - Loaded listings:', listingsData.length, listingsData);
        setListings(listingsData);
        setChapters(chaptersData);
      } catch (err: any) {
        console.error('Error loading marketplace:', err);
        if (err.message === 'VERIFICATION_REQUIRED') {
          setError('You must be a verified member to view the Steward Marketplace. Please complete your verification first.');
        } else if (err.message === 'Not authenticated') {
          router.push('/login');
          return;
        } else {
          setError(err.message || 'Failed to load marketplace');
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const filteredListings = useMemo(() => {
    let filtered = [...listings];
    console.log('Steward Marketplace - Filtering listings. Total:', listings.length, 'Search:', searchQuery, 'Chapter:', selectedChapter);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(listing =>
        listing.name.toLowerCase().includes(query) ||
        listing.description?.toLowerCase().includes(query)
      );
    }

    if (selectedChapter) {
      filtered = filtered.filter(listing => listing.sponsoring_chapter_id === selectedChapter);
    }

    console.log('Steward Marketplace - Filtered results:', filtered.length, filtered);
    return filtered;
  }, [listings, searchQuery, selectedChapter]);

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-12">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-midnight-navy mb-4">
            Steward Marketplace
          </h1>
          <p className="text-lg text-midnight-navy/70 max-w-2xl mx-auto">
            Claim legacy fraternity paraphernalia from verified brothers. Items are free - you only pay shipping, platform fees, and a donation to the steward&apos;s chapter.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
            {error.includes('verified member') && (
              <Link href="/profile" className="block mt-2 text-red-600 underline">
                Go to Profile to Complete Verification
              </Link>
            )}
          </div>
        )}

        {!error && (
          <>
            {/* Filters */}
            <div className="mb-8 space-y-4">
              <div className="relative">
                <svg 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-midnight-navy/40" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy bg-white"
                />
              </div>

              <select
                value={selectedChapter || ''}
                onChange={(e) => setSelectedChapter(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy bg-white"
              >
                <option value="">All Chapters</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Listings Grid */}
            {filteredListings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-frost-gray">
                <h3 className="text-xl font-semibold text-midnight-navy mb-2">
                  {searchQuery || selectedChapter ? 'No listings found' : 'No listings available'}
                </h3>
                <p className="text-midnight-navy/60">
                  {searchQuery || selectedChapter
                    ? 'Try adjusting your filters.'
                    : 'Check back soon for new listings!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/steward-listing/${listing.id}`}
                    className="bg-white rounded-xl overflow-hidden shadow hover:shadow-md transition relative group"
                  >
                    <div className="aspect-square relative bg-cream">
                      {listing.image_url ? (
                        <Image
                          src={listing.image_url}
                          alt={listing.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-midnight-navy/30">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {listing.chapter && (
                        <div className="absolute top-2 left-2 z-10">
                          <VerificationBadge 
                            type="sponsored-chapter" 
                            chapterName={getChapterName(listing.sponsoring_chapter_id)}
                          />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 z-10">
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          FREE
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm text-midnight-navy line-clamp-2 mb-1 group-hover:text-crimson transition">
                        {listing.name}
                      </p>
                      <div className="text-xs text-midnight-navy/60 space-y-0.5">
                        <div>Shipping: ${(listing.shipping_cost_cents / 100).toFixed(2)}</div>
                        <div>Donation: ${(listing.chapter_donation_cents / 100).toFixed(2)}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

