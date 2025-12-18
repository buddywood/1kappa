'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonLoader } from '../components/SkeletonLoader';
import {
  fetchPendingSellers,
  updateSellerStatus,
  fetchPendingPromoters,
  updatePromoterStatus,
  fetchOrders,
  fetchDonations,
  fetchStewardActivity,
  fetchStewardDonations,
  fetchPlatformSettings,
  updatePlatformSetting,
  fetchPendingMembers,
  updateMemberVerificationStatus,
  fetchChapters,
  adminFetchAllProducts,
  adminFetchProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminFetchAllEvents,
  adminFetchEvent,
  adminUpdateEvent,
  adminDeleteEvent,
  adminUploadImage,
  fetchProductCategories,
  fetchEventTypes,
} from '@/lib/api';
import type { Seller, Promoter, Order, PlatformSetting, MemberProfile, Chapter, Product, Event, ProductCategory, EventType } from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboard() {
  const { session, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'members' | 'sellers' | 'promoters' | 'products' | 'events' | 'orders' | 'donations' | 'steward-donations' | 'steward-activity' | 'platform-settings'>('members');
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [stewardDonations, setStewardDonations] = useState<any[]>([]);
  const [stewardActivity, setStewardActivity] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [processingType, setProcessingType] = useState<'member' | 'seller' | 'promoter' | 'steward' | 'product' | 'event' | null>(null);
  const [selectedItem, setSelectedItem] = useState<MemberProfile | Seller | Promoter | Product | Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [adminReason, setAdminReason] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && session) {
      loadData();
      // Load chapters, categories, and event types for dropdowns
      fetchChapters().then(setChapters).catch(console.error);
      fetchProductCategories().then(setCategories).catch(console.error);
      fetchEventTypes().then(setEventTypes).catch(console.error);
    }
  }, [isAuthenticated, session, activeTab]);

  const loadData = async () => {
    if (!session) return;
    
    // Check if user is admin
    if ((session.user as any)?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    
    setLoading(true);
    try {
      if (activeTab === 'members') {
        const data = await fetchPendingMembers();
        setMembers(data);
      } else if (activeTab === 'sellers') {
        const data = await fetchPendingSellers();
        setSellers(data);
      } else if (activeTab === 'promoters') {
        const data = await fetchPendingPromoters();
        setPromoters(data);
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
      } else if (activeTab === 'products') {
        const data = await adminFetchAllProducts();
        setProducts(data);
      } else if (activeTab === 'events') {
        const data = await adminFetchAllEvents();
        setEvents(data);
      } else if (activeTab === 'platform-settings') {
        const data = await fetchPlatformSettings();
        setPlatformSettings(data);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('401') || error?.message?.includes('Not authenticated')) {
        toast({
          title: 'Authentication failed',
          description: 'Please login again.',
          variant: 'destructive',
        });
        router.push('/');
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
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error approving seller:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve seller',
        variant: 'destructive',
      });
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
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error rejecting seller:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject seller',
        variant: 'destructive',
      });
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
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error approving promoter:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve promoter',
        variant: 'destructive',
      });
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
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error rejecting promoter:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject promoter',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const handleVerifyMember = async (memberId: number) => {
    if (!session) return;
    
    setProcessing(memberId);
    setProcessingType('member');
    try {
      await updateMemberVerificationStatus(memberId, 'VERIFIED');
      await loadData();
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error verifying member:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify member',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const handleRejectMember = async (memberId: number) => {
    if (!session) return;
    
    const notes = prompt('Please provide a reason for rejection (optional):');
    setProcessing(memberId);
    setProcessingType('member');
    try {
      await updateMemberVerificationStatus(memberId, 'FAILED', notes || null);
      await loadData();
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error rejecting member:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject member',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const getChapterName = (chapterId: number | null | undefined): string => {
    if (!chapterId) return 'N/A';
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || `Chapter ID: ${chapterId}`;
  };

  const handleUpdateProduct = async (productId: number, updates: any) => {
    if (!session || !adminReason) {
      toast({ title: 'Reason Required', description: 'Please provide a reason for the modification', variant: 'destructive' });
      return;
    }
    
    setProcessing(productId);
    setProcessingType('product');
    try {
      await adminUpdateProduct(productId, { ...updates, reason: adminReason });
      await loadData();
      setIsEditModalOpen(false);
      setAdminReason('');
      toast({ title: 'Success', description: 'Product updated successfully' });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({ title: 'Error', description: 'Failed to update product', variant: 'destructive' });
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!session) return;
    const reason = prompt('Please provide a reason for deleting this product:');
    if (!reason) return;
    
    setProcessing(productId);
    setProcessingType('product');
    try {
      await adminDeleteProduct(productId, reason);
      await loadData();
      toast({ title: 'Success', description: 'Product deleted (soft delete) successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const handleUpdateEvent = async (eventId: number, updates: any) => {
    if (!session || !adminReason) {
      toast({ title: 'Reason Required', description: 'Please provide a reason for the modification', variant: 'destructive' });
      return;
    }
    
    setProcessing(eventId);
    setProcessingType('event');
    try {
      await adminUpdateEvent(eventId, { ...updates, reason: adminReason });
      await loadData();
      setIsEditModalOpen(false);
      setAdminReason('');
      toast({ title: 'Success', description: 'Event updated successfully' });
    } catch (error) {
      console.error('Error updating event:', error);
      toast({ title: 'Error', description: 'Failed to update event', variant: 'destructive' });
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!session) return;
    const reason = prompt('Please provide a reason for cancelling this event:');
    if (!reason) return;
    
    setProcessing(eventId);
    setProcessingType('event');
    try {
      await adminDeleteEvent(eventId, reason);
      await loadData();
      toast({ title: 'Success', description: 'Event cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling event:', error);
      toast({ title: 'Error', description: 'Failed to cancel event', variant: 'destructive' });
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const openDetailModal = (item: MemberProfile | Seller | Promoter | Product | Event) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleMarkForReview = async (memberId: number) => {
    if (!session) return;
    
    const notes = prompt('Please provide notes for manual review (optional):');
    setProcessing(memberId);
    setProcessingType('member');
    try {
      await updateMemberVerificationStatus(memberId, 'MANUAL_REVIEW', notes || null);
      await loadData();
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error marking member for review:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark member for review',
        variant: 'destructive',
      });
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

  if (!isAuthenticated) {
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
            <button
              onClick={async () => {
                await signOut({ callbackUrl: '/' });
              }}
              className="text-midnight-navy hover:text-crimson transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg border border-frost-gray">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
            <div className="border-b border-frost-gray">
              <TabsList className="w-full justify-start bg-transparent h-auto p-0">
                <TabsTrigger value="members" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Pending Members
                </TabsTrigger>
                <TabsTrigger value="sellers" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Pending Sellers
                </TabsTrigger>
                <TabsTrigger value="promoters" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Pending Promoters
                </TabsTrigger>
                <TabsTrigger value="products" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Products
                </TabsTrigger>
                <TabsTrigger value="events" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Events
                </TabsTrigger>
                <TabsTrigger value="orders" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Orders
                </TabsTrigger>
                <TabsTrigger value="donations" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Donations
                </TabsTrigger>
                <TabsTrigger value="steward-donations" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Steward Donations
                </TabsTrigger>
                <TabsTrigger value="steward-activity" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Steward Activity
                </TabsTrigger>
                <TabsTrigger value="platform-settings" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Platform Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="space-y-4 py-8">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <>
                  <TabsContent value="members" className="mt-0">
                    <div className="space-y-4">
                      {members.length === 0 ? (
                        <p className="text-center py-8 text-midnight-navy/70">No pending members</p>
                      ) : (
                        members.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => openDetailModal(member)}
                      className="border border-frost-gray rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {member.headshot_url && (
                          <img
                            src={member.headshot_url}
                            alt={member.name || 'Member'}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{member.name || 'Unknown'}</h3>
                          <p className="text-sm text-gray-600">{member.email}</p>
                          {member.membership_number && (
                            <p className="text-sm text-gray-600">
                              Membership #: {member.membership_number}
                            </p>
                          )}
                          {member.chapter_name && (
                            <p className="text-sm text-gray-600">
                              Chapter: {member.chapter_name}
                            </p>
                          )}
                          {member.verification_status && (
                            <p className="text-sm text-gray-600">
                              Status: <span className="font-medium">{member.verification_status}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleVerifyMember(member.id)}
                          disabled={processing === member.id && processingType === 'member'}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {processing === member.id && processingType === 'member' ? 'Processing...' : 'Verify'}
                        </button>
                        <button
                          onClick={() => handleMarkForReview(member.id)}
                          disabled={processing === member.id && processingType === 'member'}
                          className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
                        >
                          {processing === member.id && processingType === 'member' ? 'Processing...' : 'Review'}
                        </button>
                        <button
                          onClick={() => handleRejectMember(member.id)}
                          disabled={processing === member.id && processingType === 'member'}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {processing === member.id && processingType === 'member' ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="sellers" className="mt-0">
                    <div className="space-y-4">
                      {sellers.length === 0 ? (
                        <p className="text-center py-8 text-midnight-navy/70">No pending sellers</p>
                      ) : (
                        sellers.map((seller) => (
                    <div
                      key={seller.id}
                      onClick={() => openDetailModal(seller)}
                      className="border border-frost-gray rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
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
                          {seller.fraternity_member_id && (
                            <p className="text-sm text-gray-600">
                              Member ID: {seller.fraternity_member_id}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
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
                  </TabsContent>
                  <TabsContent value="promoters" className="mt-0">
                    <div className="space-y-4">
                      {promoters.length === 0 ? (
                        <p className="text-center py-8 text-midnight-navy/70">No pending promoters</p>
                      ) : (
                        promoters.map((promoter) => (
                    <div
                      key={promoter.id}
                      onClick={() => openDetailModal(promoter)}
                      className="border border-frost-gray rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
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
                      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
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
                  </TabsContent>
                  <TabsContent value="products" className="mt-0">
                    <div className="space-y-4">
                      {products.length === 0 ? (
                        <p className="text-center py-8 text-midnight-navy/70">No products found</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 font-semibold text-midnight-navy">ID</th>
                                <th className="text-left py-2 font-semibold text-midnight-navy">Img</th>
                                <th className="text-left py-2 font-semibold text-midnight-navy">Name</th>
                                <th className="text-left py-2 font-semibold text-midnight-navy">Seller</th>
                                <th className="text-left py-2 font-semibold text-midnight-navy">Price</th>
                                <th className="text-left py-2 font-semibold text-midnight-navy">Status</th>
                                <th className="text-left py-2 font-semibold text-midnight-navy">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {products.map((product) => (
                                <tr key={product.id} className="border-b hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openDetailModal(product)}>
                                  <td className="py-3 text-sm">{product.id}</td>
                                  <td className="py-3 text-sm">
                                    {product.image_url ? (
                                      <img src={product.image_url} alt="" className="w-10 h-10 rounded object-cover border" />
                                    ) : (
                                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">No img</div>
                                    )}
                                  </td>
                                  <td className="py-3 text-sm font-medium">{product.name}</td>
                                  <td className="py-3 text-sm text-gray-600">{product.seller_name || 'N/A'}</td>
                                  <td className="py-3 text-sm">${(product.price_cents / 100).toFixed(2)}</td>
                                  <td className="py-3 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      product.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                      product.status === 'ADMIN_DELETE' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {product.status}
                                    </span>
                                  </td>
                                  <td className="py-3 text-sm flex space-x-3" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => { setSelectedItem(product); setIsEditModalOpen(true); }}
                                      className="text-crimson hover:text-crimson/80 transition font-medium"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(product.id)}
                                      className="text-midnight-navy/60 hover:text-crimson transition font-medium"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="events" className="mt-0">
                    <div className="space-y-4">
                      {events.length === 0 ? (
                        <p className="text-center py-8 text-midnight-navy/70">No events found</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 font-semibold text-midnight-navy">ID</th>
                                <th className="text-left py-2 font-semibold text-midnight-navy">Img</th>
                                <th className="text-left py-2 font-semibold text-midnight-navy">Title</th>
                                <th className="text-left py-2 font-semibold text-midnight-navy">Promoter</th>
                                <th className="text-left py-2 font-semibold text-midnight-navy">Date</th>
                                <th className="text-left py-2 font-semibold text-midnight-navy">Status</th>
                                <th className="text-left py-2 font-semibold text-midnight-navy">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {events.map((event) => (
                                <tr key={event.id} className="border-b hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openDetailModal(event)}>
                                  <td className="py-3 text-sm">{event.id}</td>
                                  <td className="py-3 text-sm">
                                    {event.image_url ? (
                                      <img src={event.image_url} alt="" className="w-10 h-10 rounded object-cover border" />
                                    ) : (
                                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">No img</div>
                                    )}
                                  </td>
                                  <td className="py-3 text-sm font-medium">{event.title}</td>
                                  <td className="py-3 text-sm text-gray-600">{event.promoter_name || 'N/A'}</td>
                                  <td className="py-3 text-sm">{new Date(event.event_date).toLocaleDateString()}</td>
                                  <td className="py-3 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      event.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                      event.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {event.status}
                                    </span>
                                  </td>
                                  <td className="py-3 text-sm flex space-x-3" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => { setSelectedItem(event); setIsEditModalOpen(true); }}
                                      className="text-crimson hover:text-crimson/80 transition font-medium"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEvent(event.id)}
                                      className="text-midnight-navy/60 hover:text-crimson transition font-medium"
                                    >
                                      Cancel
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="orders" className="mt-0">
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
            </TabsContent>
            <TabsContent value="donations" className="mt-0">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Chapter Donations</h2>
                  <Button
                    onClick={exportCSV}
                    className="bg-crimson text-white hover:bg-crimson/90"
                  >
                    Export CSV
                  </Button>
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
            </TabsContent>
            <TabsContent value="steward-donations" className="mt-0">
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
            </TabsContent>
            <TabsContent value="steward-activity" className="mt-0">
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
            </TabsContent>
            <TabsContent value="platform-settings" className="mt-0">
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
                        <Button
                          onClick={() => {
                            const newValue = prompt(`Enter new value for ${setting.key}:`, setting.value || '');
                            if (newValue !== null) {
                              updatePlatformSetting(setting.key, newValue, setting.description || null)
                                .then(() => loadData())
                                .catch((err) => {
                                  toast({
                                    title: 'Error',
                                    description: `Failed to update setting: ${err.message}`,
                                    variant: 'destructive',
                                  });
                                });
                            }
                          }}
                          className="bg-crimson text-white hover:bg-crimson/90"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                  {platformSettings.length === 0 && (
                    <p className="text-center py-8 text-midnight-navy/70">No platform settings configured</p>
                  )}
                </div>
              </div>
            </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
      </div>

      {/* Application Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-midnight-navy">
              {activeTab === 'members' ? 'Member Application' : 
               activeTab === 'sellers' ? 'Seller Application' : 
               activeTab === 'promoters' ? 'Promoter Application' :
               activeTab === 'products' ? 'Product Details' :
               activeTab === 'events' ? 'Event Details' : 'Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              {/* Common fields with type checking */}
              {('headshot_url' in selectedItem || 'store_logo_url' in selectedItem) && (
                <div className="flex justify-center">
                  <img
                    src={(('headshot_url' in selectedItem ? selectedItem.headshot_url : 'store_logo_url' in selectedItem ? selectedItem.store_logo_url : '') as string) || ''}
                    alt={('name' in selectedItem ? selectedItem.name : 'title' in selectedItem ? (selectedItem as any).title : 'Profile') || 'Profile picture'}
                    className="w-32 h-32 rounded-full object-cover border-4 border-frost-gray shadow-md"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 block">Name/Title</label>
                  <p className="text-lg font-medium">{'name' in selectedItem ? selectedItem.name : 'title' in selectedItem ? (selectedItem as any).title : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 block">Email/ID</label>
                  <p className="text-lg font-medium">{'email' in selectedItem ? selectedItem.email : 'id' in selectedItem ? `ID: ${selectedItem.id}` : 'N/A'}</p>
                </div>
              </div>

              {/* Product Info */}
              {'price_cents' in selectedItem && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="font-bold text-midnight-navy mb-2 uppercase text-xs tracking-wider">Product Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block">Price</label>
                      <p className="text-base">${(selectedItem.price_cents / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block">Status</label>
                      <p className="text-base">{selectedItem.status}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-500 block">Description</label>
                      <p className="text-sm text-gray-700">{selectedItem.description || 'No description'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Event Info */}
              {'event_date' in selectedItem && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="font-bold text-midnight-navy mb-2 uppercase text-xs tracking-wider">Event Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block">Date</label>
                      <p className="text-base">{new Date(selectedItem.event_date).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block">Location</label>
                      <p className="text-base">{selectedItem.location}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-500 block">Description</label>
                      <p className="text-sm text-gray-700">{selectedItem.description || 'No description'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Member-specific fields */}
              {'membership_number' in selectedItem && selectedItem.membership_number && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Membership Number</label>
                  <p className="text-lg">{selectedItem.membership_number}</p>
                </div>
              )}

              {'chapter_name' in selectedItem && selectedItem.chapter_name && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Chapter</label>
                  <p className="text-lg">{selectedItem.chapter_name}</p>
                </div>
              )}

              {'initiated_chapter_id' in selectedItem && selectedItem.initiated_chapter_id && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Initiated Chapter</label>
                  <p className="text-lg">{getChapterName(selectedItem.initiated_chapter_id)}</p>
                </div>
              )}

              {'initiated_season' in selectedItem && selectedItem.initiated_season && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Initiated Season</label>
                  <p className="text-lg">{selectedItem.initiated_season}</p>
                </div>
              )}

              {'initiated_year' in selectedItem && selectedItem.initiated_year && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Initiated Year</label>
                  <p className="text-lg">{selectedItem.initiated_year}</p>
                </div>
              )}

              {'ship_name' in selectedItem && selectedItem.ship_name && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Ship Name</label>
                  <p className="text-lg">{selectedItem.ship_name}</p>
                </div>
              )}

              {'line_name' in selectedItem && selectedItem.line_name && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Line Name</label>
                  <p className="text-lg">{selectedItem.line_name}</p>
                </div>
              )}

              {'location' in selectedItem && selectedItem.location && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Location</label>
                  <p className="text-lg">{selectedItem.location}</p>
                </div>
              )}

              {'address' in selectedItem && selectedItem.address && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Address</label>
                  <p className="text-lg">{selectedItem.address}</p>
                  {selectedItem.address_is_private && (
                    <p className="text-sm text-gray-500">(Private)</p>
                  )}
                </div>
              )}

              {'phone_number' in selectedItem && selectedItem.phone_number && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Phone Number</label>
                  <p className="text-lg">{selectedItem.phone_number}</p>
                  {selectedItem.phone_is_private && (
                    <p className="text-sm text-gray-500">(Private)</p>
                  )}
                </div>
              )}

              {'industry' in selectedItem && selectedItem.industry && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Industry</label>
                  <p className="text-lg">{selectedItem.industry}</p>
                </div>
              )}

              {'job_title' in selectedItem && selectedItem.job_title && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Job Title</label>
                  <p className="text-lg">{selectedItem.job_title}</p>
                </div>
              )}

              {'bio' in selectedItem && selectedItem.bio && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Bio</label>
                  <p className="text-lg whitespace-pre-wrap">{selectedItem.bio}</p>
                </div>
              )}

              {/* Seller-specific fields */}
              {'business_name' in selectedItem && selectedItem.business_name && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Business Name</label>
                  <p className="text-lg">{selectedItem.business_name}</p>
                </div>
              )}

              {'merchandise_type' in selectedItem && selectedItem.merchandise_type && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Merchandise Type</label>
                  <p className="text-lg">
                    {selectedItem.merchandise_type === 'KAPPA' ? 'Kappa Merchandise' : 'Non-Kappa Merchandise'}
                  </p>
                </div>
              )}

              {'kappa_vendor_id' in selectedItem && selectedItem.kappa_vendor_id && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Kappa Vendor ID</label>
                  <p className="text-lg">{selectedItem.kappa_vendor_id}</p>
                </div>
              )}

              {'store_logo_url' in selectedItem && selectedItem.store_logo_url && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Store Logo</label>
                  <img src={selectedItem.store_logo_url} alt="Store Logo" className="w-32 h-32 object-contain border border-frost-gray rounded" />
                </div>
              )}

              {'sponsoring_chapter_id' in selectedItem && selectedItem.sponsoring_chapter_id && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Sponsoring Chapter</label>
                  <p className="text-lg">{getChapterName(selectedItem.sponsoring_chapter_id)}</p>
                </div>
              )}

              {'fraternity_member_id' in selectedItem && selectedItem.fraternity_member_id && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Member ID</label>
                  <p className="text-lg">{selectedItem.fraternity_member_id}</p>
                </div>
              )}

              {'verification_status' in selectedItem && selectedItem.verification_status && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Verification Status</label>
                  <p className="text-lg">
                    <span className={`px-2 py-1 rounded text-sm ${
                      selectedItem.verification_status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                      selectedItem.verification_status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      selectedItem.verification_status === 'MANUAL_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedItem.verification_status}
                    </span>
                  </p>
                </div>
              )}

              {/* Social links */}
              {('social_links' in selectedItem) && (selectedItem as any).social_links && Object.keys((selectedItem as any).social_links).length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Social Links</label>
                  <div className="space-y-2 mt-2">
                    {Object.entries((selectedItem as any).social_links).map(([platform, url]) => (
                      <div key={platform} className="flex items-center space-x-2">
                        <span className="font-medium capitalize">{platform}:</span>
                        <a href={url as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {url as string}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex space-x-4 pt-4 border-t border-frost-gray">
                {activeTab === 'members' && (
                  <>
                    <Button
                      onClick={() => selectedItem && 'id' in selectedItem && handleVerifyMember(selectedItem.id)}
                      disabled={selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'member'}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700"
                    >
                      {selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'member' ? 'Processing...' : 'Verify'}
                    </Button>
                    <Button
                      onClick={() => selectedItem && 'id' in selectedItem && handleMarkForReview(selectedItem.id)}
                      disabled={selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'member'}
                      className="flex-1 bg-yellow-600 text-white hover:bg-yellow-700"
                    >
                      {selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'member' ? 'Processing...' : 'Review'}
                    </Button>
                    <Button
                      onClick={() => selectedItem && 'id' in selectedItem && handleRejectMember(selectedItem.id)}
                      disabled={selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'member'}
                      className="flex-1 bg-red-600 text-white hover:bg-red-700"
                    >
                      {selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'member' ? 'Processing...' : 'Reject'}
                    </Button>
                  </>
                )}
                {activeTab === 'sellers' && (
                  <>
                    <Button
                      onClick={() => selectedItem && 'id' in selectedItem && handleApprove(selectedItem.id)}
                      disabled={selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'seller'}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700"
                    >
                      {selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'seller' ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => selectedItem && 'id' in selectedItem && handleReject(selectedItem.id)}
                      disabled={selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'seller'}
                      className="flex-1 bg-red-600 text-white hover:bg-red-700"
                    >
                      {selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'seller' ? 'Processing...' : 'Reject'}
                    </Button>
                  </>
                )}
                {activeTab === 'promoters' && (
                  <>
                    <Button
                      onClick={() => selectedItem && 'id' in selectedItem && handleApprovePromoter(selectedItem.id)}
                      disabled={selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'promoter'}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700"
                    >
                      {selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'promoter' ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => selectedItem && 'id' in selectedItem && handleRejectPromoter(selectedItem.id)}
                      disabled={selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'promoter'}
                      className="flex-1 bg-red-600 text-white hover:bg-red-700"
                    >
                      {selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'promoter' ? 'Processing...' : 'Reject'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal for Products and Events */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && setIsEditModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-midnight-navy">
              Edit {selectedItem && 'price_cents' in selectedItem ? 'Product' : 'Event'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedItem && 'price_cents' in selectedItem && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 block">Product Name</label>
                  <input
                    type="text"
                    defaultValue={selectedItem.name}
                    id="edit-product-name"
                    className="w-full border border-frost-gray rounded p-2 focus:ring-1 focus:ring-crimson outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 block">Description</label>
                  <textarea
                    defaultValue={selectedItem.description}
                    id="edit-product-description"
                    className="w-full border border-frost-gray rounded p-2 focus:ring-1 focus:ring-crimson outline-none min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600 block">Price (cents)</label>
                    <input
                      type="number"
                      defaultValue={selectedItem.price_cents}
                      id="edit-product-price"
                      className="w-full border border-frost-gray rounded p-2 focus:ring-1 focus:ring-crimson outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600 block">Category</label>
                    <select
                      id="edit-product-category"
                      defaultValue={selectedItem.category_id || ''}
                      className="w-full border border-frost-gray rounded p-2 focus:ring-1 focus:ring-crimson outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    id="edit-product-kappa-branded"
                    defaultChecked={selectedItem.is_kappa_branded}
                    className="w-4 h-4 text-crimson border-frost-gray rounded focus:ring-crimson"
                  />
                  <label htmlFor="edit-product-kappa-branded" className="text-sm text-gray-700">Kappa Alpha Psi Branded</label>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 block">Product Photo</label>
                  <div className="flex items-center space-x-4">
                    {selectedItem.image_url && (
                      <img src={selectedItem.image_url} alt="Current" className="w-16 h-16 rounded object-cover border" id="edit-product-image-preview" />
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploading(true);
                          try {
                            const { url } = await adminUploadImage(file);
                            const preview = document.getElementById('edit-product-image-preview') as HTMLImageElement;
                            if (preview) preview.src = url;
                            (document.getElementById('edit-product-image-url') as HTMLInputElement).value = url;
                            toast({ title: 'Success', description: 'Image uploaded successfully' });
                          } catch (err) {
                            toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload image' });
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                        className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-crimson/10 file:text-crimson hover:file:bg-crimson/20"
                      />
                      <input type="hidden" id="edit-product-image-url" defaultValue={selectedItem.image_url || ''} />
                      {isUploading && <p className="text-xs text-crimson animate-pulse mt-1">Uploading...</p>}
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {selectedItem && 'event_date' in selectedItem && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600 block">Event Title</label>
                    <input
                      type="text"
                      defaultValue={selectedItem.title}
                      id="edit-event-title"
                      className="w-full border border-frost-gray rounded p-2 focus:ring-1 focus:ring-crimson outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600 block">Event Type</label>
                    <select
                      id="edit-event-type"
                      defaultValue={selectedItem.event_type_id || ''}
                      className="w-full border border-frost-gray rounded p-2 focus:ring-1 focus:ring-crimson outline-none"
                    >
                      <option value="">Select Type</option>
                      {eventTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.description}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 block">Description</label>
                  <textarea
                    defaultValue={selectedItem.description || ''}
                    id="edit-event-description"
                    className="w-full border border-frost-gray rounded p-2 focus:ring-1 focus:ring-crimson outline-none min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600 block">Date</label>
                    <input
                      type="datetime-local"
                      defaultValue={selectedItem.event_date ? new Date(selectedItem.event_date).toISOString().slice(0, 16) : ''}
                      id="edit-event-date"
                      className="w-full border border-frost-gray rounded p-2 focus:ring-1 focus:ring-crimson outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600 block">Ticket Price (cents)</label>
                    <input
                      type="number"
                      defaultValue={selectedItem.ticket_price_cents}
                      id="edit-event-price"
                      className="w-full border border-frost-gray rounded p-2 focus:ring-1 focus:ring-crimson outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 block">Location</label>
                  <input
                    type="text"
                    defaultValue={selectedItem.location}
                    id="edit-event-location"
                    className="w-full border border-frost-gray rounded p-2 focus:ring-1 focus:ring-crimson outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 block">Event Photo</label>
                  <div className="flex items-center space-x-4">
                    {selectedItem.image_url && (
                      <img src={selectedItem.image_url} alt="Current" className="w-16 h-16 rounded object-cover border" id="edit-event-image-preview" />
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploading(true);
                          try {
                            const { url } = await adminUploadImage(file);
                            const preview = document.getElementById('edit-event-image-preview') as HTMLImageElement;
                            if (preview) preview.src = url;
                            (document.getElementById('edit-event-image-url') as HTMLInputElement).value = url;
                            toast({ title: 'Success', description: 'Image uploaded successfully' });
                          } catch (err) {
                            toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload image' });
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                        className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-crimson/10 file:text-crimson hover:file:bg-crimson/20"
                      />
                      <input type="hidden" id="edit-event-image-url" defaultValue={selectedItem.image_url || ''} />
                      {isUploading && <p className="text-xs text-crimson animate-pulse mt-1">Uploading...</p>}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-crimson block font-bold uppercase tracking-tight">Admin Reason for Modification *</label>
              <textarea
                value={adminReason}
                onChange={(e) => setAdminReason(e.target.value)}
                placeholder="Required for notifications"
                className="w-full border-2 border-crimson/20 rounded-lg p-3 min-h-[100px] focus:border-crimson outline-none transition-colors"
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-crimson text-white hover:bg-crimson/90"
                disabled={!adminReason || processing !== null || isUploading}
                onClick={() => {
                  if (!selectedItem) return;
                  if ('price_cents' in selectedItem) {
                    const name = (document.getElementById('edit-product-name') as HTMLInputElement).value;
                    const description = (document.getElementById('edit-product-description') as HTMLTextAreaElement).value;
                    const price_cents = parseInt((document.getElementById('edit-product-price') as HTMLInputElement).value);
                    const category_id = (document.getElementById('edit-product-category') as HTMLSelectElement).value;
                    const is_kappa_branded = (document.getElementById('edit-product-kappa-branded') as HTMLInputElement).checked;
                    const image_url = (document.getElementById('edit-product-image-url') as HTMLInputElement).value;
                    
                    handleUpdateProduct(selectedItem.id, { 
                      name, 
                      description, 
                      price_cents, 
                      category_id: category_id ? parseInt(category_id) : null,
                      is_kappa_branded,
                      image_url: image_url || null
                    });
                  } else if ('event_date' in selectedItem) {
                    const title = (document.getElementById('edit-event-title') as HTMLInputElement).value;
                    const description = (document.getElementById('edit-event-description') as HTMLTextAreaElement).value;
                    const event_date = (document.getElementById('edit-event-date') as HTMLInputElement).value;
                    const ticket_price_cents = parseInt((document.getElementById('edit-event-price') as HTMLInputElement).value);
                    const location = (document.getElementById('edit-event-location') as HTMLInputElement).value;
                    const event_type_id = (document.getElementById('edit-event-type') as HTMLSelectElement).value;
                    const image_url = (document.getElementById('edit-event-image-url') as HTMLInputElement).value;
                    
                    handleUpdateEvent(selectedItem.id, { 
                      title, 
                      description, 
                      event_date: event_date ? new Date(event_date).toISOString() : null,
                      ticket_price_cents,
                      location,
                      event_type_id: event_type_id ? parseInt(event_type_id) : null,
                      image_url: image_url || null
                    });
                  }
                }}
              >
                {processing !== null ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}


