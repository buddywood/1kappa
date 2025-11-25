'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { fetchProduct, createCheckoutSession, fetchChapters } from '@/lib/api';
import type { Product, Chapter } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { Skeleton } from '@/components/ui/skeleton';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);

  const productId = params.productId ? Number(params.productId) : null;

  useEffect(() => {
    if (productId) {
      Promise.all([
        fetchProduct(productId),
        fetchChapters().catch(() => [])
      ])
        .then(([productData, chaptersData]) => {
          setProduct(productData);
          setChapters(chaptersData);
          
          // Check if user needs to sign in for Kappa branded products
          if (productData.is_kappa_branded && sessionStatus !== 'authenticated') {
            setError('Kappa Alpha Psi branded merchandise can only be purchased by verified members. Please sign in to continue.');
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to load product');
        })
        .finally(() => setLoading(false));
    }
  }, [productId, sessionStatus]);

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || null;
  };

  const sponsoringChapterName = product?.sponsoring_chapter_id 
    ? getChapterName(product.sponsoring_chapter_id) 
    : null;

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    // Check if product is Kappa branded - if so, require authentication
    if (product.is_kappa_branded) {
      if (sessionStatus !== 'authenticated' || !session?.user?.email) {
        setError('Kappa Alpha Psi branded merchandise can only be purchased by verified members. Please sign in to continue.');
        return;
      }
    }

    setProcessing(true);
    setError('');

    try {
      const buyerEmail = session?.user?.email || guestEmail;
      
      if (!buyerEmail) {
        setError('Please provide your email address');
        setProcessing(false);
        return;
      }

      // For guest checkout, include email and password in the request
      const guestData = (!session?.user?.email && guestEmail && guestPassword) 
        ? { email: guestEmail, password: guestPassword }
        : undefined;

      const { url } = await createCheckoutSession(product.id, buyerEmail, guestData);
      window.location.href = url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      const errorData = err.errorData || {};
      
      if (errorData.error === 'STRIPE_NOT_CONNECTED' || err.message?.includes('STRIPE_NOT_CONNECTED')) {
        setError(errorData.message || 'The seller is finalizing their payout setup. This item will be available soon.');
      } else if (errorData.error === 'AUTH_REQUIRED_FOR_KAPPA_BRANDED' || errorData.code === 'AUTH_REQUIRED_FOR_KAPPA_BRANDED') {
        setError('Kappa Alpha Psi branded merchandise can only be purchased by verified members. Please sign in to continue.');
      } else if (errorData.error === 'AUTH_REQUIRED' || errorData.code === 'AUTH_REQUIRED') {
        setError('Please sign in to make a purchase.');
      } else {
        setError(err.message || 'Failed to start checkout. Please try again.');
      }
      setProcessing(false);
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
            <button
              onClick={() => router.push('/shop')}
              className="bg-crimson text-white px-6 py-2 rounded-full font-semibold hover:bg-crimson/90 transition"
            >
              Back to Shop
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const buyerEmail = session?.user?.email || '';
  const showGuestForm = !buyerEmail && !product.is_kappa_branded;

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-midnight-navy mb-2">Checkout</h1>
          <p className="text-midnight-navy/70">Review your order and complete your purchase</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">Order Summary</h2>
              
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0].image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-midnight-navy mb-1 truncate">
                    {product.name}
                  </h3>
                  {product.seller_name && (
                    <p className="text-sm text-midnight-navy/70 mb-2">
                      Sold by {product.seller_fraternity_member_id ? 'Brother ' : ''}{product.seller_name}
                    </p>
                  )}
                  {sponsoringChapterName && (
                    <p className="text-xs text-midnight-navy/60">
                      Supports {sponsoringChapterName}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="text-right">
                  <p className="text-xl font-bold text-midnight-navy">
                    {formatPrice(product.price_cents)}
                  </p>
                </div>
              </div>
            </div>

            {/* Guest Checkout Form */}
            {showGuestForm && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">Guest Checkout</h2>
                <p className="text-sm text-midnight-navy/70 mb-4">
                  Create an account to complete your purchase. You'll be able to track your order and view order history.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-midnight-navy">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                      placeholder="your@email.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-midnight-navy">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={guestPassword}
                      onChange={(e) => setGuestPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                      placeholder="At least 8 characters"
                    />
                    <p className="text-xs text-midnight-navy/60 mt-1">
                      We'll create an account for you with this email and password
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Signed In User Info */}
            {buyerEmail && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">Contact Information</h2>
                <div className="space-y-2">
                  <p className="text-midnight-navy/70">
                    <span className="font-medium">Email:</span> {buyerEmail}
                  </p>
                  <p className="text-sm text-midnight-navy/60">
                    Your order confirmation will be sent to this email address
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Order Total & Checkout Button */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">Order Total</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-midnight-navy/70">
                  <span>Subtotal</span>
                  <span>{formatPrice(product.price_cents)}</span>
                </div>
                <div className="flex justify-between text-midnight-navy/70">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t border-frost-gray pt-3 flex justify-between text-lg font-bold text-midnight-navy">
                  <span>Total</span>
                  <span>{formatPrice(product.price_cents)}</span>
                </div>
              </div>

              <form onSubmit={handleCheckout}>
                <button
                  type="submit"
                  disabled={processing || (showGuestForm && (!guestEmail || !guestPassword))}
                  className="w-full bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  {processing ? 'Processing...' : 'Complete Purchase'}
                </button>
              </form>

              <p className="text-xs text-midnight-navy/60 text-center">
                You'll be redirected to Stripe to securely complete your payment
              </p>

              {!buyerEmail && !product.is_kappa_branded && (
                <div className="mt-4 pt-4 border-t border-frost-gray">
                  <p className="text-sm text-midnight-navy/70 text-center mb-2">
                    Already have an account?
                  </p>
                  <Link
                    href={`/login?redirect=${encodeURIComponent(`/checkout/${product.id}`)}`}
                    className="block text-center text-crimson hover:underline font-medium"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back to Product Link */}
        <div className="mt-8 text-center">
          <Link
            href={`/product/${product.id}`}
            className="text-crimson hover:underline"
          >
            ← Back to product details
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

