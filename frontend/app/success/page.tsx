'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '../contexts/CartContext';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getOrderBySessionId, fetchProduct, type OrderDetails, type Product } from '../../lib/api';
import { Skeleton } from '@/components/ui/skeleton';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { items, removeFromCart } = useCart();
  const sessionId = searchParams.get('session_id');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [fullProduct, setFullProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const details = await getOrderBySessionId(sessionId);
        setOrderDetails(details);
        
        // Remove the purchased item from cart if it exists
        if (details.product) {
          removeFromCart(details.product.id);
          
          // Fetch full product details to get image
          try {
            const product = await fetchProduct(details.product.id);
            setFullProduct(product);
          } catch (productError) {
            console.error('Error fetching full product details:', productError);
            // Continue without full product details
          }
        }
      } catch (err: any) {
        console.error('Error fetching order details:', err);
        setError(err.message || 'Failed to verify order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [sessionId, removeFromCart]);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton className="h-10 w-64 mb-8" />
          <Skeleton className="h-64 w-full mb-6" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠</div>
            <h1 className="text-2xl font-display font-bold text-midnight-navy mb-4">
              Unable to Verify Order
            </h1>
            <p className="text-midnight-navy/70 mb-6">
              {error || 'We could not verify your order. Please contact support if you were charged.'}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/"
                className="inline-block bg-crimson text-white px-6 py-2 rounded-lg hover:bg-crimson/90 transition"
              >
                Return to Homepage
              </Link>
              <Link
                href="/orders"
                className="inline-block bg-gray-200 text-midnight-navy px-6 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                View Orders
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { order, product } = orderDetails;
  const isPaid = order.status === 'PAID';
  const hasMoreItems = items.length > 0;

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          {isPaid ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-4xl font-display font-bold text-midnight-navy mb-2">
                Purchase Complete!
              </h1>
              <p className="text-xl text-midnight-navy/70">
                Thank you for your purchase
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-4xl font-display font-bold text-midnight-navy mb-2">
                Payment Processing
              </h1>
              <p className="text-xl text-midnight-navy/70">
                Your payment is being processed
              </p>
            </>
          )}
        </div>

        {/* Order Confirmation Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-display font-semibold text-midnight-navy mb-6">Order Confirmation</h2>
          
          {product && (
            <div className="mb-6">
              <div className="flex gap-4 mb-4">
                {/* Product Image */}
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {(fullProduct?.images && fullProduct.images.length > 0) ? (
                    <Image
                      src={fullProduct.images[0].image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (fullProduct?.image_url || product.image_url) ? (
                    <Image
                      src={fullProduct?.image_url || product.image_url || ''}
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
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-midnight-navy mb-1">
                    {product.name}
                  </h3>
                  <p className="text-midnight-navy/70 text-sm mb-2">
                    Order #{order.id}
                  </p>
                  <p className="text-2xl font-bold text-crimson">
                    {formatPrice(order.amount_cents)}
                  </p>
                </div>

                {/* Status Badge */}
                <div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    isPaid 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Order Details */}
          <div className="border-t border-frost-gray pt-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-midnight-navy/70">Order Date</span>
              <span className="text-midnight-navy font-medium">
                {formatDate(order.created_at)}
              </span>
            </div>
            {order.buyer_email && (
              <div className="flex justify-between">
                <span className="text-midnight-navy/70">Email</span>
                <span className="text-midnight-navy font-medium">
                  {order.buyer_email}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-midnight-navy/70">Total Amount</span>
              <span className="text-midnight-navy font-bold text-lg">
                {formatPrice(order.amount_cents)}
              </span>
            </div>
          </div>
        </div>

        {/* What's Next Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-display font-semibold text-midnight-navy mb-4">What's Next?</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-crimson/10 rounded-full flex items-center justify-center">
                <span className="text-crimson font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-midnight-navy mb-1">Order Confirmation</h3>
                <p className="text-midnight-navy/70 text-sm">
                  {isPaid 
                    ? 'A confirmation email has been sent to your email address with your order details.'
                    : 'You will receive a confirmation email once your payment is processed.'}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-crimson/10 rounded-full flex items-center justify-center">
                <span className="text-crimson font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-midnight-navy mb-1">Seller Notification</h3>
                <p className="text-midnight-navy/70 text-sm">
                  The seller has been notified of your order and will prepare it for shipment.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-crimson/10 rounded-full flex items-center justify-center">
                <span className="text-crimson font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-midnight-navy mb-1">Shipping Updates</h3>
                <p className="text-midnight-navy/70 text-sm">
                  You'll receive email updates when your order ships. Track your order in your order history.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Shopping / More Items */}
        {hasMoreItems && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">You have more items in your cart</h3>
            <p className="text-blue-800 text-sm mb-4">
              Complete checkout for your remaining {items.length} item{items.length > 1 ? 's' : ''} to finish your purchase.
            </p>
            <Link
              href="/checkout"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition"
            >
              Continue Checkout
            </Link>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/orders"
            className="inline-block bg-crimson text-white px-8 py-3 rounded-full font-semibold hover:bg-crimson/90 transition text-center"
          >
            View Order History
          </Link>
          <Link
            href="/shop"
            className="inline-block bg-gray-200 text-midnight-navy px-8 py-3 rounded-full font-semibold hover:bg-gray-300 transition text-center"
          >
            Continue Shopping
          </Link>
          {product && (
            <Link
              href={`/product/${product.id}`}
              className="inline-block bg-frost-gray text-midnight-navy px-8 py-3 rounded-full font-semibold hover:bg-frost-gray/80 transition text-center"
            >
              View Product
            </Link>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-cream dark:bg-black flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg text-center max-w-md border border-frost-gray">
          <div className="mb-4">
            <Logo />
          </div>
          <div className="text-midnight-navy dark:text-gray-100">Loading...</div>
        </div>
      </main>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}

