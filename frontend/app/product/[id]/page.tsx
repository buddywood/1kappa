'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchProduct, createCheckoutSession } from '@/lib/api';
import type { Product } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import Logo from '../components/Logo';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchProduct(Number(params.id))
        .then(setProduct)
        .catch((err) => {
          console.error(err);
          setError('Failed to load product');
        })
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !email) return;

    setCheckingOut(true);
    setError('');

    try {
      const { url } = await createCheckoutSession(product.id, email);
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout');
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-xl text-midnight-navy">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-extrabold text-midnight-navy mb-4">Product not found</h1>
          <Link href="/" className="text-crimson hover:underline">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <nav className="bg-white shadow-sm border-b border-frost-gray">
        <div className="container mx-auto px-4 py-4">
          <Logo />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-frost-gray">
          <div className="md:flex">
            {product.image_url && (
              <div className="md:w-1/2 relative h-64 md:h-auto">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="md:w-1/2 p-8">
              <h1 className="text-3xl font-display font-extrabold text-midnight-navy mb-4">{product.name}</h1>
              <p className="text-midnight-navy/70 mb-6">{product.description}</p>
              <p className="text-4xl font-bold text-crimson mb-8">
                ${(product.price_cents / 100).toFixed(2)}
              </p>

              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2 text-midnight-navy">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                    placeholder="your@email.com"
                  />
                </div>

                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={checkingOut || !email}
                  className="w-full bg-crimson text-white py-3 rounded-lg font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {checkingOut ? 'Processing...' : 'Buy Now'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

