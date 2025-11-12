'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchActiveCollegiateChapters, type Chapter } from '@/lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function PromoterSetupPage() {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handleContinue = () => {
    if (!selectedChapterId) {
      setError('Please select a sponsoring chapter');
      return;
    }
    // Redirect to full application form with sponsoring chapter pre-selected
    router.push(`/promote?sponsoring_chapter_id=${selectedChapterId}`);
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
            Become a Promoter
          </h1>
          <p className="text-lg text-midnight-navy/70 mb-8">
            Create and promote events that bring brothers together. Manage RSVPs, ticket sales, and support chapters through revenue sharing.
          </p>

          <div className="space-y-8">
            {/* Qualification Section */}
            <div className="bg-cream p-6 rounded-lg">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">
                Who Can Become a Promoter?
              </h2>
              <p className="text-midnight-navy/70 mb-4">
                Promotion on 1Kappa is open to verified members who want to create and manage events for brothers.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-midnight-navy/70">
                <li>You must be a verified member of Kappa Alpha Psi</li>
                <li>You must have a valid membership number</li>
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
                      Choose the collegiate chapter that will receive a portion of revenue from your events.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-crimson text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-navy mb-1">Complete Application Form</h3>
                    <p className="text-sm text-midnight-navy/70">
                      Provide your membership information, chapter details, and social media links.
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
                      Our team will review your application. Once approved, you can start creating and promoting events.
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
                How Promotion Works
              </h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-midnight-navy/70">
                <li>Create events with details, dates, locations, and ticket pricing</li>
                <li>Brothers can RSVP and purchase tickets</li>
                <li>Manage attendee lists and event details</li>
                <li>Revenue sharing supports your sponsoring chapter</li>
                <li>Stripe Connect handles secure ticket payments</li>
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
                This chapter will receive a portion of revenue from your events.
              </p>
            </div>

            {/* CTA */}
            <div className="flex gap-4">
              <button
                onClick={handleContinue}
                disabled={!selectedChapterId}
                className="flex-1 bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Application
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

