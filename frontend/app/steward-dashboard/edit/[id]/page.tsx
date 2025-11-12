'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getStewardListing, updateStewardListing, type StewardListing } from '@/lib/api';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';

export default function EditStewardListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = parseInt(params.id as string);

  const [listing, setListing] = useState<StewardListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shipping_cost_cents: '',
    chapter_donation_cents: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    async function loadListing() {
      try {
        const data = await getStewardListing(listingId);
        setListing(data);
        setFormData({
          name: data.name,
          description: data.description || '',
          shipping_cost_cents: (data.shipping_cost_cents / 100).toFixed(2),
          chapter_donation_cents: (data.chapter_donation_cents / 100).toFixed(2),
        });
        if (data.image_url) {
          setImagePreview(data.image_url);
        }
      } catch (err: any) {
        console.error('Error loading listing:', err);
        setError(err.message || 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    }

    if (listingId) {
      loadListing();
    }
  }, [listingId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('shipping_cost_cents', (parseFloat(formData.shipping_cost_cents) * 100).toString());
      formDataToSend.append('chapter_donation_cents', (parseFloat(formData.chapter_donation_cents) * 100).toString());
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      await updateStewardListing(listingId, formDataToSend);
      router.push('/steward-dashboard');
    } catch (err: any) {
      console.error('Error updating listing:', err);
      setError(err.message || 'Failed to update listing');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center py-12">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-2xl font-display font-bold text-midnight-navy mb-4">{error}</h1>
            <button
              onClick={() => router.push('/steward-dashboard')}
              className="bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-display font-bold text-midnight-navy mb-2">
            Edit Listing
          </h1>
          <p className="text-lg text-midnight-navy/70 mb-8">
            Update your listing details
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {listing.status === 'CLAIMED' && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
              This listing has been claimed and cannot be edited.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-midnight-navy mb-2">
                Item Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={listing.status === 'CLAIMED'}
                className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-midnight-navy mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                disabled={listing.status === 'CLAIMED'}
                className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-midnight-navy mb-2">
                Image
              </label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                disabled={listing.status === 'CLAIMED'}
                className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent disabled:opacity-50"
              />
              {imagePreview && (
                <div className="mt-4 w-48 h-48 relative rounded-lg overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="shipping_cost" className="block text-sm font-medium text-midnight-navy mb-2">
                  Shipping Cost ($) *
                </label>
                <input
                  type="number"
                  id="shipping_cost"
                  step="0.01"
                  min="0"
                  value={formData.shipping_cost_cents}
                  onChange={(e) => setFormData({ ...formData, shipping_cost_cents: e.target.value })}
                  required
                  disabled={listing.status === 'CLAIMED'}
                  className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="chapter_donation" className="block text-sm font-medium text-midnight-navy mb-2">
                  Chapter Donation ($) *
                </label>
                <input
                  type="number"
                  id="chapter_donation"
                  step="0.01"
                  min="0"
                  value={formData.chapter_donation_cents}
                  onChange={(e) => setFormData({ ...formData, chapter_donation_cents: e.target.value })}
                  required
                  disabled={listing.status === 'CLAIMED'}
                  className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-frost-gray text-midnight-navy px-6 py-3 rounded-full font-semibold hover:bg-frost-gray/80 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || listing.status === 'CLAIMED'}
                className="flex-1 bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Updating...' : 'Update Listing'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

