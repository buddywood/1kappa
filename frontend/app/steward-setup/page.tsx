'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchActiveCollegiateChapters, applyToBecomeSteward, type Chapter } from '@/lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function StewardSetupPage() {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadChapters() {
      try {
        const activeChapters = await fetchActiveCollegiateChapters();
        setChapters(activeChapters);
      } catch (err) {
        console.error('Error loading chapters:', err);
        setError('Failed to load chapters');
      } finally {
        setLoading(false);
      }
    }

    loadChapters();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedChapterId) {
      setError('Please select a sponsoring chapter');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await applyToBecomeSteward(selectedChapterId);
      router.push('/profile?steward_applied=true');
    } catch (err: any) {
      console.error('Error applying to become steward:', err);
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-display font-bold text-midnight-navy mb-2">
            Become a Steward
          </h1>
          <p className="text-lg text-midnight-navy/70 mb-8">
            Stewards can list legacy fraternity paraphernalia for other verified members. Recipients only pay shipping, platform fees, and a donation to your chosen chapter.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Qualification Section */}
            <div className="bg-cream p-6 rounded-lg">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">
                Who Can Become a Steward?
              </h2>
              <p className="text-midnight-navy/70 mb-4">
                Stewardship on 1Kappa is open to verified members who want to share legacy items with brothers.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-midnight-navy/70">
                <li>You must be a verified member of Kappa Alpha Psi</li>
                <li>You must have legacy or used fraternity paraphernalia to share</li>
                <li>You must select a sponsoring collegiate chapter</li>
                <li>Your application will be reviewed before approval</li>
              </ul>
            </div>

            {/* Application Process Section */}
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">
                Application Process
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-crimson text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-navy mb-1">Select Your Sponsoring Chapter</h3>
                    <p className="text-sm text-midnight-navy/70">
                      Choose the collegiate chapter that will receive donations from your listings.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-crimson text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-navy mb-1">Submit Application</h3>
                    <p className="text-sm text-midnight-navy/70">
                      Your application will be reviewed to ensure you meet the requirements for stewardship.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-crimson text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-navy mb-1">Get Approved</h3>
                    <p className="text-sm text-midnight-navy/70">
                      Once approved, you can start listing legacy items for verified members to claim.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white rounded border border-blue-200">
                <p className="text-sm text-midnight-navy/70">
                  <strong>Review Timeline:</strong> Applications are typically reviewed within 1-3 business days. You&apos;ll receive an email notification once a decision has been made.
                </p>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="bg-cream p-6 rounded-lg">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">
                How Stewards Work
              </h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-midnight-navy/70">
                <li>List legacy or used fraternity paraphernalia (items are free)</li>
                <li>Set shipping cost and chapter donation amount per item</li>
                <li>Verified members can claim your items</li>
                <li>Recipients pay: shipping + platform fee + chapter donation</li>
                <li>Donations go directly to your sponsoring chapter</li>
              </ul>
            </div>

            {/* Chapter Selection */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="sponsoring_chapter" className="block text-sm font-medium text-midnight-navy mb-2">
                Select Your Sponsoring Chapter *
              </label>
              <select
                id="sponsoring_chapter"
                value={selectedChapterId || ''}
                onChange={(e) => setSelectedChapterId(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy bg-white"
                required
              >
                <option value="">Choose a chapter...</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-midnight-navy/60">
                This chapter will receive donations from your listings. You can only have one sponsoring chapter at a time.
              </p>
            </div>

            {/* CTA */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting || !selectedChapterId}
                className="flex-1 bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

