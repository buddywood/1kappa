'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchChapters, submitSellerApplication } from '@/lib/api';
import type { Chapter } from '@/lib/api';
import Link from 'next/link';

export default function ApplyPage() {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    membership_number: '',
    initiated_chapter_id: '',
    sponsoring_chapter_id: '',
    social_links: {
      instagram: '',
      twitter: '',
      linkedin: '',
      website: '',
    },
  });

  const [headshot, setHeadshot] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);

  useState(() => {
    fetchChapters()
      .then(setChapters)
      .catch(console.error)
      .finally(() => setLoading(false));
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeadshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeadshotPreview(reader.result as string);
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
      formDataToSend.append('email', formData.email);
      formDataToSend.append('membership_number', formData.membership_number);
      formDataToSend.append('initiated_chapter_id', formData.initiated_chapter_id);
      if (formData.sponsoring_chapter_id) {
        formDataToSend.append('sponsoring_chapter_id', formData.sponsoring_chapter_id);
      }
      formDataToSend.append('social_links', JSON.stringify(formData.social_links));
      
      if (headshot) {
        formDataToSend.append('headshot', headshot);
      }

      await submitSellerApplication(formDataToSend);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-green-600">Application Submitted!</h1>
          <p className="text-gray-600 mb-6">
            Your application has been submitted and is pending admin approval.
            You will be notified once your application is reviewed.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-blue-900">
            North Star Nupes
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Become a Seller</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Membership Number *</label>
            <input
              type="text"
              required
              value={formData.membership_number}
              onChange={(e) => setFormData({ ...formData, membership_number: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Initiated Chapter *</label>
            <select
              required
              value={formData.initiated_chapter_id}
              onChange={(e) => setFormData({ ...formData, initiated_chapter_id: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
            >
              <option value="">Select a chapter</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.name} - {chapter.city}, {chapter.state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sponsoring Chapter (Optional)</label>
            <select
              value={formData.sponsoring_chapter_id}
              onChange={(e) => setFormData({ ...formData, sponsoring_chapter_id: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
            >
              <option value="">Select a chapter</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.name} - {chapter.city}, {chapter.state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Headshot *</label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={handleFileChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
            {headshotPreview && (
              <img
                src={headshotPreview}
                alt="Headshot preview"
                className="mt-4 w-32 h-32 object-cover rounded-lg"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Social Links</label>
            <div className="space-y-2">
              <input
                type="url"
                placeholder="Instagram URL"
                value={formData.social_links.instagram}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, instagram: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
              />
              <input
                type="url"
                placeholder="Twitter URL"
                value={formData.social_links.twitter}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, twitter: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
              />
              <input
                type="url"
                placeholder="LinkedIn URL"
                value={formData.social_links.linkedin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, linkedin: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
              />
              <input
                type="url"
                placeholder="Website URL"
                value={formData.social_links.website}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, website: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              At least one social link is required
            </p>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </main>
  );
}

