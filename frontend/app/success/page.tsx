'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Logo from '../components/Logo';
import { getOrderBySessionId, type OrderDetails } from '../../lib/api';

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
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
      } catch (err: any) {
        console.error('Error fetching order details:', err);
        setError(err.message || 'Failed to verify order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [sessionId]);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-cream dark:bg-black flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg text-center max-w-md border border-frost-gray">
          <div className="mb-4">
            <Logo />
          </div>
          <div className="text-midnight-navy dark:text-gray-100">Loading order details...</div>
        </div>
      </main>
    );
  }

  if (error || !orderDetails) {
    return (
      <main className="min-h-screen bg-cream dark:bg-black flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg text-center max-w-md border border-frost-gray">
          <div className="mb-4">
            <Logo />
          </div>
          <div className="text-red-600 text-6xl mb-4">⚠</div>
          <h1 className="text-2xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-4">
            Unable to Verify Order
          </h1>
          <p className="text-midnight-navy/70 dark:text-gray-400 mb-6">
            {error || 'We could not verify your order. Please contact support if you were charged.'}
          </p>
          <Link
            href="/"
            className="inline-block bg-crimson text-white px-6 py-2 rounded-lg hover:bg-crimson/90 transition shadow-md hover:shadow-lg"
          >
            Return to Homepage
          </Link>
        </div>
      </main>
    );
  }

  const { order, product } = orderDetails;
  const isPaid = order.status === 'PAID';

  return (
    <main className="min-h-screen bg-cream dark:bg-black flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg text-center max-w-md w-full border border-frost-gray">
        <div className="mb-4">
          <Logo />
        </div>
        
        {isPaid ? (
          <>
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h1 className="text-2xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-4">
              Payment Successful!
            </h1>
          </>
        ) : (
          <>
            <div className="text-yellow-600 text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-4">
              Payment Processing
            </h1>
          </>
        )}

        {product && (
          <div className="text-left mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h2 className="font-semibold text-midnight-navy dark:text-gray-100 mb-2">Order Details</h2>
            <p className="text-midnight-navy/70 dark:text-gray-400 mb-1">
              <span className="font-medium">Product:</span> {product.name}
            </p>
            <p className="text-midnight-navy/70 dark:text-gray-400 mb-1">
              <span className="font-medium">Amount:</span> {formatPrice(order.amount_cents)}
            </p>
            <p className="text-midnight-navy/70 dark:text-gray-400 mb-1">
              <span className="font-medium">Status:</span>{' '}
              <span className={isPaid ? 'text-green-600' : 'text-yellow-600'}>
                {order.status}
              </span>
            </p>
            <p className="text-midnight-navy/70 dark:text-gray-400 text-sm mt-2">
              Order ID: #{order.id}
            </p>
          </div>
        )}

        <p className="text-midnight-navy/70 dark:text-gray-400 mb-6">
          {isPaid
            ? 'Thank you for your purchase! You will receive a confirmation email shortly.'
            : 'Your payment is being processed. You will receive a confirmation email once it is complete.'}
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="inline-block bg-crimson text-white px-6 py-2 rounded-lg hover:bg-crimson/90 transition shadow-md hover:shadow-lg"
          >
            Return to Homepage
          </Link>
          {product && (
            <Link
              href={`/product/${product.id}`}
              className="inline-block bg-gray-200 dark:bg-gray-700 text-midnight-navy dark:text-gray-100 px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              View Product
            </Link>
          )}
        </div>
      </div>
    </main>
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

