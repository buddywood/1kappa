'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { 
  getSellerOrders,
  type SellerOrder
} from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function SellerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrders() {
      try {
        const ordersData = await getSellerOrders();
        setOrders(ordersData);
      } catch (err: any) {
        console.error('Error loading orders:', err);
        if (err.message === 'Not authenticated' || err.message === 'Not a seller') {
          router.push('/login');
          return;
        }
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [router]);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Paid</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-black">
        <div className="p-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-6 w-80" />
          </div>

          {/* Orders Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right space-y-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-black">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-2">
            Orders
          </h1>
          <p className="text-lg text-midnight-navy/70 dark:text-gray-400">
            View and manage all your customer orders
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Orders List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>
                  {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No orders yet</p>
                <p className="text-sm">Orders from your customers will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-midnight-navy dark:text-gray-100">
                        {order.product_name}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {order.buyer_email} • {formatDate(order.created_at)}
                      </div>
                      {order.chapter_name && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Chapter: {order.chapter_name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-semibold text-crimson">
                          {formatPrice(order.amount_cents)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Order #{order.id}
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

