'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Skeleton, { SkeletonLoader } from '../components/Skeleton';
import {
  fetchPendingSellers,
  updateSellerStatus,
  fetchPendingPromoters,
  updatePromoterStatus,
  fetchOrders,
  fetchDonations,
  fetchPendingStewards,
  updateStewardStatus,
  fetchStewardActivity,
  fetchStewardDonations,
  fetchPlatformSettings,
  updatePlatformSetting,
} from '@/lib/api';
import type { Seller, Promoter, Order, Steward, PlatformSetting } from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboard() {
  const { session, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'sellers' | 'promoters' | 'stewards' | 'orders' | 'donations' | 'steward-donations' | 'steward-activity' | 'platform-settings'>('sellers');
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [stewards, setStewards] = useState<Steward[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [stewardDonations, setStewardDonations] = useState<any[]>([]);
  const [stewardActivity, setStewardActivity] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [processingType, setProcessingType] = useState<'seller' | 'promoter' | 'steward' | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && session) {
      loadData();
    }
  }, [isAuthenticated, session, activeTab]);

  const loadData = async () => {
    if (!session) return;
    
    // Check if user is admin
    if ((session.user as any)?.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
    
    setLoading(true);
    try {
      if (activeTab === 'sellers') {
        const data = await fetchPendingSellers();
        setSellers(data);
      } else if (activeTab === 'promoters') {
        const data = await fetchPendingPromoters();
        setPromoters(data);
      } else if (activeTab === 'stewards') {
        const data = await fetchPendingStewards();
        setStewards(data);
      } else if (activeTab === 'orders') {
        const data = await fetchOrders();
        setOrders(data);
      } else if (activeTab === 'donations') {
        const data = await fetchDonations();
        setDonations(data);
      } else if (activeTab === 'steward-donations') {
        const data = await fetchStewardDonations();
        setStewardDonations(data);
      } else if (activeTab === 'steward-activity') {
        const data = await fetchStewardActivity();
        setStewardActivity(data);
      } else if (activeTab === 'platform-settings') {
        const data = await fetchPlatformSettings();
        setPlatformSettings(data);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('401') || error?.message?.includes('Not authenticated')) {
        alert('Authentication failed. Please login again.');
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId: number) => {
    if (!session) return;
    
    setProcessing(sellerId);
    setProcessingType('seller');
    try {
      await updateSellerStatus(sellerId, 'APPROVED');
      await loadData();
    } catch (error) {
      console.error('Error approving seller:', error);
      alert('Failed to approve seller');
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const handleReject = async (sellerId: number) => {
    if (!session) return;
    
    setProcessing(sellerId);
    setProcessingType('seller');
    try {
      await updateSellerStatus(sellerId, 'REJECTED');
      await loadData();
    } catch (error) {
      console.error('Error rejecting seller:', error);
      alert('Failed to reject seller');
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const handleApprovePromoter = async (promoterId: number) => {
    if (!session) return;
    
    setProcessing(promoterId);
    setProcessingType('promoter');
    try {
      await updatePromoterStatus(promoterId, 'APPROVED');
      await loadData();
    } catch (error) {
      console.error('Error approving promoter:', error);
      alert('Failed to approve promoter');
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const handleRejectPromoter = async (promoterId: number) => {
    if (!session) return;
    
    setProcessing(promoterId);
    setProcessingType('promoter');
    try {
      await updatePromoterStatus(promoterId, 'REJECTED');
      await loadData();
    } catch (error) {
      console.error('Error rejecting promoter:', error);
      alert('Failed to reject promoter');
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const handleApproveSteward = async (stewardId: number) => {
    if (!session) return;
    
    setProcessing(stewardId);
    setProcessingType('steward');
    try {
      await updateStewardStatus(stewardId, 'APPROVED');
      await loadData();
    } catch (error) {
      console.error('Error approving steward:', error);
      alert('Failed to approve steward');
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const handleRejectSteward = async (stewardId: number) => {
    if (!session) return;
    
    setProcessing(stewardId);
    setProcessingType('steward');
    try {
      await updateStewardStatus(stewardId, 'REJECTED');
      await loadData();
    } catch (error) {
      console.error('Error rejecting steward:', error);
      alert('Failed to reject steward');
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const exportCSV = () => {
    const headers = ['Chapter Name', 'Total Donations (cents)', 'Total Donations ($)'];
    const rows = donations.map((d) => [
      d.chapter_name || 'Unknown',
      d.total_donations_cents,
      (d.total_donations_cents / 100).toFixed(2),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <main className="min-h-screen bg-cream">
      <nav className="bg-white shadow-sm border-b border-frost-gray">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-display font-bold text-crimson">
              1Kappa - Admin
            </Link>
            <Link
              href="/api/auth/signout"
              className="text-midnight-navy hover:text-crimson transition font-medium"
            >
              Logout
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg border border-frost-gray">
          <div className="border-b border-frost-gray">
            <div className="flex">
              <button
                onClick={() => setActiveTab('sellers')}
                className={`px-6 py-4 font-semibold ${
                  activeTab === 'sellers'
                    ? 'border-b-2 border-crimson text-crimson'
                    : 'text-midnight-navy/70 hover:text-crimson'
                }`}
              >
                Pending Sellers
              </button>
              <button
                onClick={() => setActiveTab('promoters')}
                className={`px-6 py-4 font-semibold ${
                  activeTab === 'promoters'
                    ? 'border-b-2 border-crimson text-crimson'
                    : 'text-midnight-navy/70 hover:text-crimson'
                }`}
              >
                Pending Promoters
              </button>
              <button
                onClick={() => setActiveTab('stewards')}
                className={`px-6 py-4 font-semibold ${
                  activeTab === 'stewards'
                    ? 'border-b-2 border-crimson text-crimson'
                    : 'text-midnight-navy/70 hover:text-crimson'
                }`}
              >
                Pending Stewards
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-4 font-semibold ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-crimson text-crimson'
                    : 'text-midnight-navy/70 hover:text-crimson'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab('donations')}
                className={`px-6 py-4 font-semibold ${
                  activeTab === 'donations'
                    ? 'border-b-2 border-crimson text-crimson'
                    : 'text-midnight-navy/70 hover:text-crimson'
                }`}
              >
                Donations
              </button>
              <button
                onClick={() => setActiveTab('steward-donations')}
                className={`px-6 py-4 font-semibold ${
                  activeTab === 'steward-donations'
                    ? 'border-b-2 border-crimson text-crimson'
                    : 'text-midnight-navy/70 hover:text-crimson'
                }`}
              >
                Steward Donations
              </button>
              <button
                onClick={() => setActiveTab('steward-activity')}
                className={`px-6 py-4 font-semibold ${
                  activeTab === 'steward-activity'
                    ? 'border-b-2 border-crimson text-crimson'
                    : 'text-midnight-navy/70 hover:text-crimson'
                }`}
              >
                Steward Activity
              </button>
              <button
                onClick={() => setActiveTab('platform-settings')}
                className={`px-6 py-4 font-semibold ${
                  activeTab === 'platform-settings'
                    ? 'border-b-2 border-crimson text-crimson'
                    : 'text-midnight-navy/70 hover:text-crimson'
                }`}
              >
                Platform Settings
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-4 py-8">
                <Skeleton variant="card" className="h-24 w-full" />
                <Skeleton variant="card" className="h-24 w-full" />
                <Skeleton variant="card" className="h-24 w-full" />
              </div>
            ) : activeTab === 'sellers' ? (
              <div className="space-y-4">
                {sellers.length === 0 ? (
                  <p className="text-center py-8 text-midnight-navy/70">No pending sellers</p>
                ) : (
                  sellers.map((seller) => (
                    <div
                      key={seller.id}
                      className="border border-frost-gray rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        {seller.headshot_url && (
                          <img
                            src={seller.headshot_url}
                            alt={seller.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{seller.name}</h3>
                          <p className="text-sm text-gray-600">{seller.email}</p>
                          <p className="text-sm text-gray-600">
                            Membership #: {seller.membership_number}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(seller.id)}
                          disabled={processing === seller.id && processingType === 'seller'}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {processing === seller.id && processingType === 'seller' ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(seller.id)}
                          disabled={processing === seller.id && processingType === 'seller'}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {processing === seller.id && processingType === 'seller' ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === 'promoters' ? (
              <div className="space-y-4">
                {promoters.length === 0 ? (
                  <p className="text-center py-8 text-midnight-navy/70">No pending promoters</p>
                ) : (
                  promoters.map((promoter) => (
                    <div
                      key={promoter.id}
                      className="border border-frost-gray rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        {promoter.headshot_url && (
                          <img
                            src={promoter.headshot_url}
                            alt={promoter.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{promoter.name}</h3>
                          <p className="text-sm text-gray-600">{promoter.email}</p>
                          <p className="text-sm text-gray-600">
                            Membership #: {promoter.membership_number}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprovePromoter(promoter.id)}
                          disabled={processing === promoter.id && processingType === 'promoter'}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {processing === promoter.id && processingType === 'promoter' ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleRejectPromoter(promoter.id)}
                          disabled={processing === promoter.id && processingType === 'promoter'}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {processing === promoter.id && processingType === 'promoter' ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === 'stewards' ? (
              <div className="space-y-4">
                {stewards.length === 0 ? (
                  <p className="text-center py-8 text-midnight-navy/70">No pending stewards</p>
                ) : (
                  stewards.map((steward) => (
                    <div
                      key={steward.id}
                      className="border border-frost-gray rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        {steward.member?.headshot_url && (
                          <img
                            src={steward.member.headshot_url}
                            alt={steward.member.name || 'Steward'}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{steward.member?.name || 'Unknown'}</h3>
                          <p className="text-sm text-gray-600">{steward.member?.email || 'N/A'}</p>
                          <p className="text-sm text-gray-600">
                            Sponsoring Chapter: {steward.chapter?.name || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveSteward(steward.id)}
                          disabled={processing === steward.id && processingType === 'steward'}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {processing === steward.id && processingType === 'steward' ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleRejectSteward(steward.id)}
                          disabled={processing === steward.id && processingType === 'steward'}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {processing === steward.id && processingType === 'steward' ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === 'orders' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Order ID</th>
                      <th className="text-left py-2">Product</th>
                      <th className="text-left py-2">Buyer</th>
                      <th className="text-left py-2">Amount</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="py-2">{order.id}</td>
                        <td className="py-2">{order.product_name || 'N/A'}</td>
                        <td className="py-2">{order.buyer_email}</td>
                        <td className="py-2">
                          ${(order.amount_cents / 100).toFixed(2)}
                        </td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              order.status === 'PAID'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : activeTab === 'donations' ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Chapter Donations</h2>
                  <button
                    onClick={exportCSV}
                    className="bg-crimson text-white px-4 py-2 rounded hover:bg-crimson/90 transition shadow-md"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Chapter</th>
                        <th className="text-left py-2">Total Donations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.map((donation, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2">
                            {donation.chapter_name || 'Unknown'}
                          </td>
                          <td className="py-2">
                            ${(donation.total_donations_cents / 100).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'steward-donations' ? (
              <div>
                <h2 className="text-xl font-semibold mb-4">Steward Chapter Donations</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Chapter</th>
                        <th className="text-left py-2">Total Donations</th>
                        <th className="text-left py-2">Claim Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stewardDonations.map((donation) => (
                        <tr key={donation.chapter_id} className="border-b">
                          <td className="py-2">{donation.chapter_name}</td>
                          <td className="py-2">
                            ${(donation.total_donations_cents / 100).toFixed(2)}
                          </td>
                          <td className="py-2">{donation.claim_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'steward-activity' ? (
              <div>
                <h2 className="text-xl font-semibold mb-4">Steward Activity</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Steward</th>
                        <th className="text-left py-2">Total Listings</th>
                        <th className="text-left py-2">Active</th>
                        <th className="text-left py-2">Claimed</th>
                        <th className="text-left py-2">Total Donations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stewardActivity.map((activity) => (
                        <tr key={activity.steward_id} className="border-b">
                          <td className="py-2">{activity.steward_name}</td>
                          <td className="py-2">{activity.total_listings}</td>
                          <td className="py-2">{activity.active_listings}</td>
                          <td className="py-2">{activity.claimed_listings}</td>
                          <td className="py-2">
                            ${(activity.total_donations_cents / 100).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'platform-settings' ? (
              <div>
                <h2 className="text-xl font-semibold mb-4">Platform Settings</h2>
                <div className="space-y-4">
                  {platformSettings.map((setting) => (
                    <div key={setting.id} className="border border-frost-gray rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{setting.key}</h3>
                          {setting.description && (
                            <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                          )}
                          <p className="text-sm text-midnight-navy mt-2">
                            Current Value: <strong>{setting.value || 'Not set'}</strong>
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const newValue = prompt(`Enter new value for ${setting.key}:`, setting.value || '');
                            if (newValue !== null) {
                              updatePlatformSetting(setting.key, newValue, setting.description || null)
                                .then(() => loadData())
                                .catch((err) => alert('Failed to update setting: ' + err.message));
                            }
                          }}
                          className="bg-crimson text-white px-4 py-2 rounded hover:bg-crimson/90 transition"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                  {platformSettings.length === 0 && (
                    <p className="text-center py-8 text-midnight-navy/70">No platform settings configured</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

