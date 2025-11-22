import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { fetchSellersWithProducts, fetchChapters, getStewardMarketplace, fetchProductCategories } from '@/lib/api';
import type { SellerWithProducts, StewardListing } from '@/lib/api';
import Image from 'next/image';
import Header from '../components/Header';
import VerificationBadge from '../components/VerificationBadge';
import UserRoleBadges from '../components/UserRoleBadges';
import ProductStatusBadge from '../components/ProductStatusBadge';
import ScrollToSeller from './ScrollToSeller';
import Footer from '../components/Footer';
import CollectionsClient from './CollectionsClient';

// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic';

interface CollectionsPageProps {
  searchParams: { seller?: string; steward?: string };
}

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const stewardIdParam = searchParams.steward ? parseInt(searchParams.steward) : null;
  
  // If steward param is provided, fetch steward listings instead of seller products
  // Note: getStewardMarketplace requires auth, so we'll fetch directly from the backend API
  if (stewardIdParam) {
    let stewardListings: StewardListing[] = [];
    try {
      // Get the auth token from cookies (NextAuth stores it in a cookie)
      const cookieStore = await cookies();
      const nextAuthSessionToken = cookieStore.get('next-auth.session-token') || cookieStore.get('__Secure-next-auth.session-token');
      
      // Fetch steward listings directly from backend API
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // If we have a session token, try to get the idToken from the session
      let authHeaders: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (nextAuthSessionToken) {
        // Get session to extract idToken
        const host = headers().get('host') || 'localhost:3000';
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const sessionRes = await fetch(`${protocol}://${host}/api/auth/session`, {
          headers: {
            'Cookie': `${nextAuthSessionToken.name}=${nextAuthSessionToken.value}`,
          },
          cache: 'no-store',
        });
        
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          const idToken = (session as any)?.idToken;
          if (idToken) {
            authHeaders = {
              ...authHeaders,
              'Authorization': `Bearer ${idToken}`,
            };
          }
        }
      }
      
      const res = await fetch(`${backendUrl}/api/stewards/marketplace`, {
        headers: authHeaders,
        cache: 'no-store',
      });
      
      if (res.ok) {
        stewardListings = await res.json();
      } else {
        console.error('Error fetching steward listings:', res.status, res.statusText);
      }
    } catch (err) {
      console.error('Error fetching steward listings:', err);
    }
    
    const chapters = await fetchChapters().catch((err) => {
      console.error('Error fetching chapters:', err);
      return [];
    });

    // Filter to specific steward
    const filteredListings = stewardListings.filter(l => l.steward_id === stewardIdParam);
    const steward = filteredListings.length > 0 ? filteredListings[0].steward : null;
    const stewardMember = steward?.member;

    const getChapterName = (chapterId: number | null) => {
      if (!chapterId) return null;
      const chapter = chapters.find(c => c.id === chapterId);
      return chapter?.name || null;
    };

    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />

        {/* Page Header */}
        <section className="bg-gradient-to-br from-crimson to-midnight-navy text-white py-16 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              {stewardMember ? `Brother ${stewardMember.name}'s Collection` : 'Steward Collection'}
            </h1>
            <p className="text-lg max-w-2xl mx-auto opacity-90">
              Browse items from this steward&apos;s collection. All proceeds support the sponsored chapter.
            </p>
            <div className="mt-6">
              <Link
                href="/shop?role=steward"
                className="inline-block bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full font-semibold transition backdrop-blur-sm"
              >
                View All Steward Listings
              </Link>
            </div>
          </div>
        </section>

        {/* Steward Collection */}
        <section className="max-w-7xl mx-auto py-12 px-4">
          {filteredListings.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-frost-gray">
              {/* Steward Header */}
              <div className="bg-cream border-b border-frost-gray p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  {/* Steward Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h2 className="text-2xl md:text-3xl font-display font-bold text-midnight-navy">
                        {stewardMember ? `Brother ${stewardMember.name}` : 'Steward Collection'}
                      </h2>
                      {stewardMember && (
                        <UserRoleBadges
                          is_member={true}
                          is_seller={false}
                          is_promoter={false}
                          is_steward={true}
                          size="md"
                        />
                      )}
                    </div>
                    {steward && steward.sponsoring_chapter_id && (
                      <p className="text-midnight-navy/70 text-sm md:text-base mb-2">
                        Supporting: {getChapterName(steward.sponsoring_chapter_id)}
                      </p>
                    )}
                    <p className="text-midnight-navy/60 text-sm mt-3">
                      {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'} available
                    </p>
                  </div>
                </div>
              </div>

              {/* Listings Grid */}
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {filteredListings.map((listing) => {
                    const chapterName = getChapterName(listing.sponsoring_chapter_id);
                    const totalCost = (listing.shipping_cost_cents + listing.chapter_donation_cents) / 100;
                    
                    return (
                      <Link
                        key={listing.id}
                        href={`/steward-listing/${listing.id}`}
                        className="group bg-cream rounded-xl overflow-hidden shadow hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                      >
                        <div className="aspect-[4/5] relative bg-white">
                          {listing.image_url ? (
                            <Image
                              src={listing.image_url}
                              alt={listing.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-midnight-navy/30">
                              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-semibold text-sm text-midnight-navy line-clamp-2 mb-1 group-hover:text-crimson transition">
                            {listing.name}
                          </p>
                          {/* Verification badges under title */}
                          <div className="flex flex-col items-start gap-2 mb-2">
                            {stewardMember && (
                              <VerificationBadge type="brother" className="text-xs" />
                            )}
                            {chapterName && (
                              <VerificationBadge 
                                type="sponsored-chapter" 
                                chapterName={chapterName}
                                className="text-xs"
                              />
                            )}
                          </div>
                          <p className="text-crimson font-bold text-sm">
                            ${totalCost.toFixed(2)}
                          </p>
                          <p className="text-xs text-midnight-navy/60 mt-1">
                            Item: FREE
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-display font-bold text-midnight-navy mb-3">
                  Collection Not Found
                </h2>
                <p className="text-midnight-navy/70 mb-6">
                  The steward collection you&apos;re looking for doesn&apos;t exist or has been removed.
                </p>
                <Link
                  href="/shop?role=steward"
                  className="inline-block bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg"
                >
                  View All Steward Listings
                </Link>
              </div>
            </div>
          )}
        </section>

        <Footer />
      </div>
    );
  }

  // Original seller collections logic
  const [sellers, chapters, categories] = await Promise.all([
    fetchSellersWithProducts().catch((err) => {
      console.error('Error fetching sellers:', err);
      return [];
    }),
    fetchChapters().catch((err) => {
      console.error('Error fetching chapters:', err);
      return [];
    }),
    fetchProductCategories().catch((err) => {
      console.error('Error fetching categories:', err);
      return [];
    }),
  ]);

  // Check if seller query param is provided - redirect to new route
  const sellerIdParam = searchParams.seller ? parseInt(searchParams.seller) : null;
  
  // If seller param is provided, redirect to the new store route
  if (sellerIdParam) {
    redirect(`/collections/${sellerIdParam}`);
  }

  const displayedSellers = sellers;

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />

      <Suspense fallback={null}>
        <ScrollToSeller />
      </Suspense>

      {/* Page Header */}
      <section className="bg-gradient-to-br from-crimson to-midnight-navy text-white py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Brotherhood Collections</h1>
          <p className="text-lg max-w-2xl mx-auto opacity-90">
            Shop authentic merchandise from verified Kappa brothers. Each collection represents a unique brother&apos;s curated selection.
          </p>
          {sellerIdParam && (
            <div className="mt-6">
              <Link
                href="/collections"
                className="inline-block bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full font-semibold transition backdrop-blur-sm"
              >
                View All Collections
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Client Component for Interactive Features */}
      <CollectionsClient 
        sellers={displayedSellers}
        chapters={chapters}
        categories={categories}
        sellerIdParam={sellerIdParam}
      />

      {/* Empty State for No Collections */}
      {displayedSellers.length === 0 && !sellerIdParam && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center py-16 bg-white rounded-xl border border-frost-gray">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-crimson/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-2xl font-display font-bold text-midnight-navy mb-3">
                No Collections Yet
              </h2>
              <p className="text-midnight-navy/70 mb-6">
                Be the first to create a collection! Apply to become a seller and start sharing your merchandise with the brotherhood.
              </p>
              <Link
                href="/apply"
                className="inline-block bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg"
              >
                Become a Seller
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

