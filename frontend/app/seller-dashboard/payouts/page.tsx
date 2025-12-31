'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Wallet, TrendingUp, AlertCircle, CreditCard } from 'lucide-react';
import { 
  getSellerMetrics,
  getSellerProfile,
  type SellerMetrics,
  type Seller
} from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SellerPayoutsPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<SellerMetrics | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsData, sellerData] = await Promise.all([
          getSellerMetrics(),
          getSellerProfile(),
        ]);
        setMetrics(metricsData);
        setSeller(sellerData);
      } catch (err: any) {
        console.error('Error loading payout data:', err);
        if (err.message === 'Not authenticated' || err.message === 'Not a seller') {
          router.push('/login');
          return;
        }
        setError(err.message || 'Failed to load payout data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const calculatePlatformFee = (salesCents: number) => {
    // Assuming 10% platform fee (adjust based on your actual fee structure)
    return Math.round(salesCents * 0.10);
  };

  const stripeConnected = seller?.stripe_account_id ? true : false;
  const platformFee = metrics ? calculatePlatformFee(metrics.totalSalesCents) : 0;
  const netEarnings = metrics ? metrics.totalSalesCents - platformFee : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-black">
        <div className="p-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-6 w-80" />
          </div>

          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-5 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payout Info Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
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
            Payouts & Earnings
          </h1>
          <p className="text-lg text-midnight-navy/70 dark:text-gray-400">
            Track your earnings and payout information
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!stripeConnected && (
          <Alert className="mb-6">
            <CreditCard className="h-4 w-4" />
            <AlertTitle>Stripe Account Required</AlertTitle>
            <AlertDescription>
              Connect your Stripe account to receive payouts. 
              <Link href="/seller-dashboard/stripe-setup" className="ml-2 text-crimson hover:underline font-semibold">
                Set up Stripe →
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-crimson">
                {metrics ? formatPrice(metrics.totalSalesCents) : '$0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-midnight-navy dark:text-gray-300">
                {formatPrice(platformFee)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">10% of total sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatPrice(netEarnings)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">After platform fees</p>
            </CardContent>
          </Card>
        </div>

        {/* Payout Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Payout Information</CardTitle>
            <CardDescription>
              How your earnings are processed and paid out
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-crimson mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-midnight-navy dark:text-gray-100">
                    Automatic Payouts
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Stripe automatically transfers your earnings to your connected bank account. Payouts are typically processed within 2-7 business days after a sale.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-crimson mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-midnight-navy dark:text-gray-100">
                    Platform Fees
                  </p>
                  <p className="text-sm text-muted-foreground">
                    A 10% platform fee is deducted from each sale to support the platform and chapter donations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-crimson mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-midnight-navy dark:text-gray-100">
                    Chapter Donations
                  </p>
                  <p className="text-sm text-muted-foreground">
                    A portion of platform fees goes to support collegiate chapters through the donation program.
                  </p>
                </div>
              </div>
            </div>

            {stripeConnected && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  View detailed payout history and manage your Stripe account settings:
                </p>
                <Button asChild variant="outline">
                  <a 
                    href="https://dashboard.stripe.com/payouts" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Open Stripe Dashboard
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Metrics */}
        {metrics && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Metrics</CardTitle>
              <CardDescription>
                Additional information about your earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-midnight-navy dark:text-gray-100">
                    {metrics.orderCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Chapter Donations</p>
                  <p className="text-2xl font-bold text-crimson">
                    {formatPrice(metrics.totalUndergradDonationsCents || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Donated to collegiate chapters
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

