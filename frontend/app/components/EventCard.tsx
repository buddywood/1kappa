'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Event } from '@/lib/api';
import { getEventThumbnailUrl } from '@/lib/imageUtils';
import RSVPModal from './RSVPModal';

interface EventCardProps {
  event: Event;
  chapterName?: string | null;
}

export default function EventCard({ event, chapterName }: EventCardProps) {
  const [isRSVPModalOpen, setIsRSVPModalOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const shimmerRef = useRef<HTMLDivElement>(null);

  const date = new Date(event.event_date);
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Shimmer animation
  useEffect(() => {
    if (imageLoading && event.image_url && shimmerRef.current) {
      const shimmer = shimmerRef.current;
      shimmer.style.animation = 'shimmer 1.5s infinite';
    }
  }, [imageLoading, event.image_url]);

  // Reset image loading when event changes
  useEffect(() => {
    setImageLoading(true);
  }, [event.id, event.image_url]);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <Link href={`/event/${event.id}`} className="block">
          {/* Image Section */}
          <div className="relative w-full h-[220px] bg-frost-gray overflow-hidden">
            {/* Shimmer Skeleton */}
            {imageLoading && event.image_url && (
              <div className="absolute inset-0 bg-frost-gray overflow-hidden">
                <div
                  ref={shimmerRef}
                  className="absolute inset-0 w-1/2 bg-white/30"
                  style={{
                    animation: 'shimmer 1.5s infinite',
                  }}
                />
              </div>
            )}

            {/* Image */}
            {event.image_url ? (
              <Image
                src={getEventThumbnailUrl(event.image_url) || event.image_url}
                alt={event.title}
                fill
                className={`object-cover transition-opacity duration-200 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-16 h-16 text-midnight-navy/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/35" />

            {/* Top Row: Date Badge (left) + Price Badge & Bookmark (right) */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
              {/* Date Badge */}
              <div className="w-[52px] rounded-xl bg-white text-center py-1">
                <div className="text-[11px] font-bold text-midnight-navy leading-tight">{month}</div>
                <div className="text-lg font-extrabold text-midnight-navy leading-none">{day}</div>
              </div>

              {/* Price Badge & Bookmark */}
              <div className="flex items-center gap-2">
                {event.ticket_price_cents > 0 && (
                  <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-crimson">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4v-3a2 2 0 00-2-2H5z" />
                    </svg>
                    <span className="text-[13px] font-bold text-white">
                      ${(event.ticket_price_cents / 100).toFixed(0)}
                    </span>
                  </div>
                )}

                {/* Bookmark */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Bookmark', event.title);
                  }}
                  className="p-1.5 text-white hover:text-crimson transition-colors"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Bottom Overlay: Title + Chapter */}
            <div className="absolute bottom-3 left-3 right-3 z-10">
              <h3 className="text-lg font-extrabold text-white mb-1 line-clamp-2 drop-shadow-lg">
                {event.title}
              </h3>
              {event.chapter_name && (
                <p className="text-[13px] text-white/90 line-clamp-1 drop-shadow-md">
                  {event.chapter_name}
                </p>
              )}
            </div>
          </div>
        </Link>

        {/* Content Section */}
        <div className="p-3.5">
          {/* Date/Time & Location */}
          <div className="space-y-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-[13px] text-midnight-navy/75">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(event.event_date)} · {formatTime(event.event_date)}</span>
            </div>

            <div className="flex items-center gap-1.5 text-[13px] text-midnight-navy/75">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="line-clamp-1">
                {event.location}
                {event.city && event.state && `, ${event.city}, ${event.state}`}
              </span>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-sm text-midnight-navy/70 mb-2.5 line-clamp-2 leading-5">
              {event.description}
            </p>
          )}

          {/* Divider */}
          <div className="h-px bg-frost-gray my-3" />

          {/* Footer: Audience Type + View Details */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-cream">
              <svg className="w-3.5 h-3.5 text-midnight-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-xs font-medium text-midnight-navy">
                {event.event_audience_type_description ||
                  (event.chapter_name ? 'Hosted by chapter' : 'Open to all members')}
              </span>
            </div>

            <Link
              href={`/event/${event.id}`}
              className="text-[13px] font-semibold text-crimson hover:text-crimson/80 transition-colors"
            >
              View details →
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>

      <RSVPModal
        event={event}
        isOpen={isRSVPModalOpen}
        onClose={() => setIsRSVPModalOpen(false)}
      />
    </>
  );
}
