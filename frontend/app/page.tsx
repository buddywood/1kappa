import Link from 'next/link';
import { fetchProducts, fetchChapters } from '@/lib/api';
import Image from 'next/image';
import Logo from './components/Logo';

export default async function Home() {
  const [products, chapters] = await Promise.all([
    fetchProducts().catch(() => []),
    fetchChapters().catch(() => []),
  ]);

  // Group products by chapter for featured sections
  const featuredChapters = chapters.slice(0, 4);

  return (
    <main className="min-h-screen bg-white">
      {/* Header Navigation */}
      <nav className="bg-white border-b border-frost-gray sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Logo />
            
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for anything"
                  className="w-full px-4 py-2 pl-10 pr-4 border border-frost-gray rounded-full focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-midnight-navy/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/apply" className="text-midnight-navy hover:text-crimson transition font-medium text-sm">
                Become a Seller
              </Link>
              <Link href="/admin" className="text-midnight-navy hover:text-crimson transition font-medium text-sm">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Multiple Promotional Blocks */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {/* Promotional Block 1 */}
          <div className="bg-midnight-navy rounded-lg p-8 text-white flex flex-col justify-between min-h-[300px]">
            <div>
              <h2 className="text-3xl font-display font-extrabold mb-4">
                Shop Authentic Kappa Merch
              </h2>
              <p className="text-white/90 mb-6">
                Verified fraternity members. Authentic designs. Brotherhood pride.
              </p>
            </div>
            <Link
              href="#products"
              className="inline-block bg-crimson text-white px-6 py-3 rounded-lg font-semibold hover:bg-crimson/90 transition text-center"
            >
              Start shopping
            </Link>
          </div>

          {/* Promotional Block 2 */}
          <div className="bg-crimson rounded-lg p-8 text-white flex flex-col justify-between min-h-[300px] relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-display font-extrabold mb-4">
                Support Your Chapter
              </h2>
              <p className="text-white/90 mb-6">
                Every purchase supports chapter initiatives and brotherhood programs.
              </p>
            </div>
            <Link
              href="#products"
              className="inline-block bg-white text-crimson px-6 py-3 rounded-lg font-semibold hover:bg-cream transition text-center relative z-10"
            >
              Shop now
            </Link>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-aurora-gold/20 rounded-full -mr-16 -mb-16"></div>
          </div>

          {/* Promotional Block 3 */}
          <div className="bg-gradient-to-br from-aurora-gold/20 to-crimson/10 rounded-lg p-8 text-midnight-navy flex flex-col justify-between min-h-[300px] border border-frost-gray">
            <div>
              <h2 className="text-3xl font-display font-extrabold mb-4">
                Join the Marketplace
              </h2>
              <p className="text-midnight-navy/80 mb-6">
                Become a seller and share your Kappa-inspired creations with brothers nationwide.
              </p>
            </div>
            <Link
              href="/apply"
              className="inline-block bg-crimson text-white px-6 py-3 rounded-lg font-semibold hover:bg-crimson/90 transition text-center"
            >
              Start selling
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Interests - Chapters */}
      {featuredChapters.length > 0 && (
        <section className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-2xl font-display font-extrabold text-midnight-navy mb-6">
            Shop by Chapter
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredChapters.map((chapter) => {
              const chapterProducts = products.filter(p => p.sponsored_chapter_id === chapter.id);
              return (
                <Link
                  key={chapter.id}
                  href={`#chapter-${chapter.id}`}
                  className="group bg-white rounded-lg overflow-hidden border border-frost-gray hover:shadow-lg transition"
                >
                  <div className="aspect-square bg-gradient-to-br from-crimson/10 to-aurora-gold/10 flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="text-4xl mb-2">⭐</div>
                      <h3 className="font-display font-extrabold text-midnight-navy text-sm mb-1">
                        {chapter.name}
                      </h3>
                      <p className="text-xs text-midnight-navy/60">
                        {chapter.city}, {chapter.state}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 border-t border-frost-gray">
                    <p className="text-xs text-midnight-navy/70">
                      {chapterProducts.length} {chapterProducts.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Products Grid */}
      {products.length > 0 && (
        <section id="products" className="container mx-auto px-4 py-8 mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display font-extrabold text-midnight-navy">
              Shop the Marketplace
            </h2>
            {products.length > 12 && (
              <Link href="#products" className="text-crimson hover:underline text-sm font-medium">
                See all
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {products.slice(0, 12).map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group bg-white rounded-lg overflow-hidden hover:shadow-lg transition"
              >
                <div className="aspect-square relative bg-cream">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
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
                </div>
                <div className="p-3">
                  <p className="text-sm text-midnight-navy/70 line-clamp-2 mb-1 min-h-[2.5rem]">
                    {product.name}
                  </p>
                  {product.seller_name && (
                    <p className="text-xs text-midnight-navy/50 mb-1 truncate">
                      {product.seller_name}
                    </p>
                  )}
                  <p className="text-base font-bold text-crimson">
                    ${(product.price_cents / 100).toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Chapters Section */}
      {chapters.length > 4 && (
        <section className="bg-cream py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-display font-extrabold text-midnight-navy mb-6">
              All Chapters
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {chapters.map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`#chapter-${chapter.id}`}
                  className="bg-white p-4 rounded-lg border border-frost-gray hover:shadow-md transition text-center"
                >
                  <h3 className="font-semibold text-sm text-midnight-navy mb-1">{chapter.name}</h3>
                  <p className="text-xs text-midnight-navy/60">
                    {chapter.city}, {chapter.state}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
