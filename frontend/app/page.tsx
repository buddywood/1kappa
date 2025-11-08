import Link from 'next/link';
import { fetchProducts, fetchChapters } from '@/lib/api';
import Image from 'next/image';

export default async function Home() {
  const [products, chapters] = await Promise.all([
    fetchProducts().catch(() => []),
    fetchChapters().catch(() => []),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-900">
              North Star Nupes
            </Link>
            <div className="space-x-4">
              <Link href="/apply" className="text-gray-700 hover:text-blue-900">
                Become a Seller
              </Link>
              <Link href="/admin" className="text-gray-700 hover:text-blue-900">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Verified Fraternity Member Marketplace
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Shop authentic merchandise from verified fraternity members
          </p>
          <Link
            href="/apply"
            className="inline-block bg-blue-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
          >
            Start Selling
          </Link>
        </div>

        {products.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Featured Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.slice(0, 6).map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  {product.image_url && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      ${(product.price_cents / 100).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {chapters.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-8">Chapters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-semibold">{chapter.name}</h3>
                  <p className="text-sm text-gray-600">
                    {chapter.city}, {chapter.state}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
