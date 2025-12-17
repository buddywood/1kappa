import Link from 'next/link';
import { fetchProducts, fetchFeaturedProducts, fetchFeaturedBrothers, fetchChapters, fetchUpcomingEvents, type Product } from '@/lib/api';
import { SEED_PRODUCTS, SEED_EVENTS, SEED_FEATURED_BROTHERS } from '@/lib/seedData';
import Image from 'next/image';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import VerificationBadge from './components/VerificationBadge';
import UserRoleBadges from './components/UserRoleBadges';
import ProductStatusBadge from './components/ProductStatusBadge';
import FeaturedProductsSection from './components/FeaturedProductsSection';
import ImpactBanner from './components/ImpactBanner';
import EventCard from './components/EventCard';
import Footer from './components/Footer';

// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic';

export default async function Home() {
  let [allProducts, featuredProducts, featuredBrothers, chapters, events] = await Promise.all([
    fetchProducts().catch((err) => {
      console.error('Error fetching products:', err);
      return [];
    }),
    fetchFeaturedProducts().catch((err) => {
      console.error('Error fetching featured products:', err);
      return [];
    }),
    fetchFeaturedBrothers().catch((err) => {
      console.error('Error fetching featured brothers:', err);
      return [];
    }),
    fetchChapters().catch((err) => {
      console.error('Error fetching chapters:', err);
      return [];
    }),
    fetchUpcomingEvents().catch((err) => {
      console.error('Error fetching upcoming events:', err);
      return [];
    }),
  ]);

  // Fallback to seed data if API returns empty
  if (allProducts.length === 0) allProducts = SEED_PRODUCTS;
  if (featuredProducts.length === 0) featuredProducts = SEED_PRODUCTS.slice(0, 4);
  if (featuredBrothers.length === 0) featuredBrothers = SEED_FEATURED_BROTHERS;
  if (events.length === 0) events = SEED_EVENTS;

  // Use all products for seller grouping, featured products for featured section
  const products = allProducts;

  console.log(`Fetched ${products.length} products, ${featuredBrothers.length} featured brothers, and ${chapters.length} chapters`);

  // Get chapter names for sellers
  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || null;
  };

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />

      {/* Hero Banner */}
      <HeroBanner />

      {/* Product Highlights */}
      {featuredProducts.length > 0 && (
        <FeaturedProductsSection products={featuredProducts} />
      )}

      {/* Our Impact Banner */}
      <ImpactBanner />

      {/* Featured Brothers */}
      {featuredBrothers.length > 0 && (
        <section className="max-w-7xl mx-auto py-16 px-4">
          <h2 className="text-2xl font-display font-bold text-crimson mb-6 text-center">Featured Brothers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {featuredBrothers.map((brother) => {
              // Generate initials for avatar
              const initials = brother.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              
              return (
                <div key={brother.id} className="bg-card rounded-xl shadow dark:shadow-black/50 p-6 flex flex-col items-center text-center relative">
                  {/* Brother verification badge */}
                  <div className="absolute top-3 right-3">
                    <VerificationBadge type="brother" />
                  </div>
                  <div className="relative w-24 h-24 rounded-full overflow-hidden mb-3">
                    {brother.headshot_url ? (
                      <Image
                        src={brother.headshot_url}
                        alt={brother.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Image
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(brother.name)}&background=8A0C13&color=fff&size=200&bold=true&font-size=0.5`}
                        alt={brother.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2 mb-2">
                    <p className="font-semibold text-card-foreground">{brother.name}</p>
                    {/* Role badges - all featured brothers are member sellers */}
                    <UserRoleBadges
                      is_member={true}
                      is_seller={true}
                      is_promoter={false}
                      is_steward={false}
                      size="sm"
                    />
                  </div>
                  {brother.chapter_name && (
                    <div className="mt-2 mb-3">
                      <VerificationBadge 
                        type="sponsored-chapter" 
                        chapterName={brother.chapter_name}
                      />
                    </div>
                  )}
                  <Link 
                    href={`/collections/${brother.id}`}
                    className="text-sm text-crimson font-medium hover:underline"
                  >
                    Shop Collection ({brother.product_count} {brother.product_count === 1 ? 'item' : 'items'})
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Events Section */}
      <section id="events" className="max-w-7xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-display font-bold text-crimson mb-6 text-center">Upcoming Events</h2>
        {events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              // Use chapter_name from the event if available (from the API)
              const chapterName = event.chapter_name || (event.sponsored_chapter_id 
                ? getChapterName(event.sponsored_chapter_id) 
                : null);
              return (
                <EventCard 
                  key={event.id} 
                  event={event}
                  chapterName={chapterName}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No upcoming events at this time. Check back soon!</p>
          </div>
        )}
      </section>

      {/* Impact Section */}
      <section id="impact" className="bg-midnight-navy text-cream text-center py-16 px-6">
        <h2 className="text-3xl font-display font-bold mb-4">Excellence Through Contribution</h2>
        <p className="max-w-2xl mx-auto mb-6 text-lg">
          Every purchase and event ticket creates impact — revenue sharing with sponsoring chapters supports scholarship, leadership, and service. This is how we build distinction together.
        </p>
        <Link 
          href="#about"
          className="inline-block bg-crimson text-white px-8 py-3 rounded-full font-semibold hover:bg-aurora-gold dark:hover:bg-crimson/80 transition"
        >
          Learn More
        </Link>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
