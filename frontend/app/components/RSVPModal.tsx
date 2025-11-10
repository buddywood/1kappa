'use client';

import { useEffect, useState } from 'react';
import type { Event } from '@/lib/api';

interface RSVPModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RSVPModal({ event, isOpen, onClose }: RSVPModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !name || !email) return;

    setSubmitting(true);
    
    // Placeholder - full RSVP backend can be added later
    console.log('RSVP submitted:', { eventId: event.id, name, email, message });
    
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      alert('RSVP submitted successfully! (This is a placeholder - backend integration coming soon)');
      onClose();
      setName('');
      setEmail('');
      setMessage('');
    }, 1000);
  };

  if (!isOpen || !event) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display font-bold text-midnight-navy">RSVP to Event</h2>
            <button
              onClick={onClose}
              className="text-midnight-navy/60 hover:text-midnight-navy transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6 p-4 bg-cream rounded-lg border border-frost-gray">
            <h3 className="font-semibold text-midnight-navy mb-2">{event.title}</h3>
            <p className="text-sm text-midnight-navy/70">
              {new Date(event.event_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
            <p className="text-sm text-midnight-navy/70 mt-1">{event.location}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="rsvp-name" className="block text-sm font-medium mb-2 text-midnight-navy">
                Full Name *
              </label>
              <input
                type="text"
                id="rsvp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="rsvp-email" className="block text-sm font-medium mb-2 text-midnight-navy">
                Email Address *
              </label>
              <input
                type="email"
                id="rsvp-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="rsvp-message" className="block text-sm font-medium mb-2 text-midnight-navy">
                Message (Optional)
              </label>
              <textarea
                id="rsvp-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy resize-none"
                placeholder="Any additional notes or questions..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-frost-gray rounded-lg font-semibold text-midnight-navy hover:bg-cream transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !name || !email}
                className="flex-1 bg-crimson text-white px-4 py-2 rounded-lg font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {submitting ? 'Submitting...' : 'RSVP Now'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

