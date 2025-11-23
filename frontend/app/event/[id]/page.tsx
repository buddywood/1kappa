"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { fetchEvent, fetchChapters, fetchEventTypes } from "@/lib/api";
import type { Event, Chapter, EventType } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import VerificationBadge from "../../components/VerificationBadge";
import UserRoleBadges from "../../components/UserRoleBadges";
import EventCountdown from "../../components/EventCountdown";
import RSVPModal from "../../components/RSVPModal";
import { SkeletonLoader } from "../../components/SkeletonLoader";
import {
  shareEvent,
  generateCalendarUrls,
  generateSocialShareUrls,
  copyEventUrl,
} from "@/lib/eventUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Share2,
  Calendar,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  QrCode,
  Copy,
  X,
  Edit,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRSVPModalOpen, setIsRSVPModalOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (params.id) {
      Promise.all([
        fetchEvent(Number(params.id)),
        fetchChapters().catch(() => []),
        fetchEventTypes().catch(() => []),
      ])
        .then(([eventData, chaptersData, eventTypesData]) => {
          setEvent(eventData);
          setChapters(chaptersData);
          setEventTypes(eventTypesData);
        })
        .catch((err) => {
          console.error(err);
          setError("Failed to load event");
        })
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find((c) => c.id === chapterId);
    return chapter?.name || null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDressCode = (code: string) => {
    const dressCodeMap: Record<string, string> = {
      business: "Business",
      business_casual: "Business Casual",
      formal: "Formal",
      semi_formal: "Semi-Formal",
      kappa_casual: "Kappa Casual",
      greek_encouraged: "Greek Encouraged",
      greek_required: "Greek Required",
      outdoor: "Outdoor",
      athletic: "Athletic",
      comfortable: "Comfortable",
      all_white: "All White",
    };
    return dressCodeMap[code] || code;
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-cream dark:bg-black flex items-center justify-center">
        <Header />
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-4">
            Event not found
          </h1>
          <Link href="/" className="text-crimson hover:underline">
            Return to homepage
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const sponsoringChapterName = getChapterName(
    event.sponsored_chapter_id || null
  );
  const initiatedChapterName = getChapterName(
    event.promoter_initiated_chapter_id || null
  );

  const eventType = eventTypes.find((et) => et.id === event.event_type_id);

  // Check if user is event owner (only when session is loaded)
  const isEventOwner =
    sessionStatus !== "loading" &&
    session?.user &&
    (session.user as any)?.promoterId === event.promoter_id &&
    event.status === "ACTIVE";
  const isNotPromoter = !isEventOwner;

  // Check if event is virtual (only when eventTypes are loaded)
  const virtualEventType =
    eventTypes.length > 0
      ? eventTypes.find((et) => et.enum === "VIRTUAL")
      : null;
  const isVirtualEvent = virtualEventType
    ? event.event_type_id === virtualEventType.id
    : false;

  // Show map only if not promoter and not virtual (and data is loaded)
  // Wait for both session and eventTypes to be loaded before showing/hiding
  const showMap =
    sessionStatus !== "loading" && // Session must be loaded
    eventTypes.length > 0 && // eventTypes must be loaded
    isNotPromoter &&
    !isVirtualEvent;

  // Generate Google Maps embed URL
  const getGoogleMapsEmbedUrl = () => {
    const location = `${event.location}${
      event.city && event.state ? `, ${event.city}, ${event.state}` : ""
    }`;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(
        location
      )}`;
    }
    // Fallback to search URL if no API key
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024!2d-73.9886!3d40.7484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ0JzU0LjIiTiA3M8KwNTknMTkuMCJX!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus&q=${encodeURIComponent(
      location
    )}`;
  };

  const handleCopyUrl = async () => {
    const success = await copyEventUrl(event);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-black">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-black rounded-lg shadow-lg dark:shadow-black/50 overflow-hidden border border-frost-gray dark:border-gray-900">
          <div className="md:flex">
            {/* Event Image + Overlay */}
            <div className="md:w-1/2 relative h-64 md:min-h-[420px] md:h-full overflow-hidden">
              {event.image_url ? (
                <Image
                  src={event.image_url}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-crimson/20 to-aurora-gold/20 dark:from-crimson/10 dark:to-aurora-gold/10 flex items-center justify-center">
                  <svg
                    className="w-24 h-24 text-crimson/40 dark:text-crimson/20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

              {/* Bottom-left date pill */}
              <div className="absolute bottom-4 left-4 flex flex-col gap-1">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/40 text-xs font-semibold text-white backdrop-blur-sm">
                  {formatDate(event.event_date)}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/30 text-[11px] text-white backdrop-blur-sm">
                  {formatTime(event.event_date)}{" "}
                  {event.location && (
                    <span className="ml-1 opacity-80">
                      •{" "}
                      {event.city && event.state
                        ? `${event.city}, ${event.state}`
                        : event.location}
                    </span>
                  )}
                </span>
              </div>

              {/* Bottom-right event type pill */}
              {eventType && (
                <div className="absolute bottom-4 right-4">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-aurora-gold/90 text-xs font-semibold text-midnight-navy shadow-md">
                    {eventType.description}
                  </span>
                </div>
              )}
            </div>

            <div className="md:w-1/2 p-8">
              <div className="mb-4">
                <h1 className="text-3xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-3">
                  {event.title}
                </h1>
                {/* Badges: Sponsored Chapter and Event Type */}
                <div className="flex flex-wrap items-center gap-2">
                  {sponsoringChapterName && (
                    <VerificationBadge
                      type="sponsored-chapter"
                      chapterName={sponsoringChapterName}
                    />
                  )}
                  {eventType && (
                    <div className="bg-aurora-gold text-white text-sm font-semibold px-3 py-1.5 rounded-full">
                      {eventType.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Event Details */}
              <h2 className="text-sm font-semibold tracking-wide text-midnight-navy/70 dark:text-gray-400 uppercase mb-2">
                Event Details
              </h2>
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-2 text-midnight-navy/70 dark:text-gray-300">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-medium">
                    {formatDate(event.event_date)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-midnight-navy/70 dark:text-gray-300">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{formatTime(event.event_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-midnight-navy/70 dark:text-gray-300">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{event.location}</span>
                  {event.city && event.state && (
                    <span className="text-midnight-navy/50 dark:text-gray-500">
                      • {event.city}, {event.state}
                    </span>
                  )}
                </div>
                {event.ticket_price_cents > 0 && (
                  <div className="flex items-center gap-2 text-midnight-navy/70 dark:text-gray-300">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-semibold text-crimson">
                      ${(event.ticket_price_cents / 100).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Dress Code */}
                {event.dress_codes && event.dress_codes.length > 0 && (
                  <div className="flex items-start gap-3 text-midnight-navy/80 dark:text-gray-300">
                    {/* Shirt Icon */}
                    <svg
                      className="w-5 h-5 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.5 3L8 5 5 4l-1 3 3 2v9a2 2 0 002 2h6a2 2 0 002-2v-9l3-2-1-3-3 1-1.5-2h-4z"
                      />
                    </svg>

                    <div className="flex-1">
                      {/* Chips */}
                      <div className="flex flex-wrap gap-2 mb-1">
                        {event.dress_codes.map((code) => (
                          <span
                            key={code}
                            className="inline-flex items-center px-3 py-1 rounded-full border border-frost-gray bg-cream/70 text-xs font-semibold text-midnight-navy"
                          >
                            {formatDressCode(code)}
                          </span>
                        ))}
                      </div>

                      {/* Optional Notes */}
                      {event.dress_code_notes && (
                        <p className="text-xs text-midnight-navy/60 dark:text-gray-400 italic">
                          {event.dress_code_notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {event.description && (
                <p className="text-midnight-navy/70 dark:text-gray-300 mb-6 whitespace-pre-line">
                  {event.description}
                </p>
              )}

              {/* Subtle divider */}
              <div className="border-t border-frost-gray/50 dark:border-gray-800/50 mb-6"></div>

              {/* Promoter info with badges */}
              {event.promoter_name && (
                <section className="mb-6 p-4 bg-cream/60 dark:bg-gray-900/60 rounded-lg border border-frost-gray dark:border-gray-800">
                  <h2 className="text-sm font-semibold tracking-wide text-midnight-navy/70 dark:text-gray-400 uppercase mb-2">
                    Promoter
                  </h2>
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="mt-1">
                      <div className="w-9 h-9 rounded-full bg-midnight-navy/10 dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-xs font-semibold text-midnight-navy dark:text-gray-100">
                          {event.promoter_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-midnight-navy dark:text-gray-200">
                          Promoted by{" "}
                          {event.promoter_fraternity_member_id
                            ? "Brother "
                            : ""}
                          {event.promoter_name}
                        </p>
                        {/* Role badges - show all applicable roles */}
                        {event.is_fraternity_member !== undefined ||
                        event.is_promoter !== undefined ? (
                          <UserRoleBadges
                            is_member={event.is_fraternity_member}
                            is_seller={event.is_seller}
                            is_promoter={event.is_promoter}
                            is_steward={event.is_steward}
                            className="ml-1"
                            size="md"
                          />
                        ) : null}
                      </div>

                      {/* Verification badges under name */}
                      {event.promoter_fraternity_member_id && (
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <VerificationBadge type="brother" />
                          {event.promoter_initiated_chapter_id && (
                            <VerificationBadge
                              type="initiated-chapter"
                              chapterName={
                                initiatedChapterName ||
                                `Chapter ${event.promoter_initiated_chapter_id}`
                              }
                              season={event.promoter_initiated_season || null}
                              year={event.promoter_initiated_year || null}
                            />
                          )}
                        </div>
                      )}

                      <p className="mt-2 text-xs text-midnight-navy/60 dark:text-gray-400">
                        This event is organized by the host and is not managed,
                        endorsed, or certified by 1Kappa or any national
                        organization.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Event Countdown */}
              <div className="mb-6 p-4 bg-cream/60 dark:bg-gray-900/60 rounded-lg border border-frost-gray dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-midnight-navy dark:text-gray-200">
                    Time Remaining
                  </span>
                  <div className="h-1 w-16 rounded-full bg-crimson" />
                </div>
                <EventCountdown eventDate={event.event_date} />
              </div>

              {/* Google Map - Show for non-promoters viewing non-virtual events */}
              {showMap && (
                <section className="mb-6 rounded-lg overflow-hidden border border-frost-gray dark:border-gray-800 bg-cream/40 dark:bg-gray-900/40">
                  <div className="px-4 py-3 border-b border-frost-gray/60 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="text-sm font-semibold tracking-wide text-midnight-navy/80 dark:text-gray-300 uppercase">
                      Location
                    </h2>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${event.location}${
                          event.city && event.state
                            ? `, ${event.city}, ${event.state}`
                            : ""
                        }`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-crimson hover:text-crimson/80"
                    >
                      Open in Google Maps →
                    </a>
                  </div>
                  <div className="h-[300px]">
                    {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={getGoogleMapsEmbedUrl()}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="h-full bg-cream/50 flex items-center justify-center">
                        <span className="text-midnight-navy/70 dark:text-gray-300 text-sm">
                          Map preview unavailable. Use the link above to open in
                          Google Maps.
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {isEventOwner ? (
                  // Promoter owns active event: Edit and Share buttons
                  <>
                    <Link
                      href={`/promoter-dashboard/events/edit/${event.id}`}
                      className="block w-full"
                    >
                      <Button className="w-full bg-crimson text-white py-3 rounded-lg font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg flex items-center justify-center">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Event
                      </Button>
                    </Link>
                    <Button
                      onClick={() => setShowShareModal(true)}
                      className="w-full bg-midnight-navy text-white py-3 rounded-lg font-semibold hover:bg-midnight-navy/90 transition shadow-md hover:shadow-lg flex items-center justify-center"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </>
                ) : (
                  // Non-promoter: Share, Add to Calendar, Message Promoter (disabled)
                  <>
                    <Button
                      onClick={() => setShowShareModal(true)}
                      className="w-full bg-crimson text-white py-3 rounded-lg font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg flex items-center justify-center"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button
                      onClick={() => setShowCalendarModal(true)}
                      variant="outline"
                      className="w-full border-2 border-crimson text-crimson py-3 rounded-lg font-semibold hover:bg-crimson/10 transition flex items-center justify-center"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Add to Calendar
                    </Button>
                    <Button
                      disabled
                      className="w-full bg-frost-gray text-midnight-navy/50 py-3 rounded-lg font-semibold cursor-not-allowed opacity-60 flex items-center justify-center"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Message Promoter
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Floating action bar for mobile */}
        <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
          <div className="px-4 pb-4 pt-2 bg-gradient-to-t from-cream via-cream/95 to-cream/80 dark:from-black dark:via-black/95 dark:to-black/80 border-t border-frost-gray/70 dark:border-gray-800 shadow-[0_-8px_20px_rgba(15,23,42,0.45)]">
            {isEventOwner ? (
              <div className="flex gap-2">
                <Link
                  href={`/promoter-dashboard/events/edit/${event.id}`}
                  className="flex-1"
                >
                  <Button className="w-full bg-crimson text-white py-2.5 rounded-lg font-semibold hover:bg-crimson/90 transition flex items-center justify-center text-sm">
                    <Edit className="w-4 h-4 mr-1.5" />
                    Edit
                  </Button>
                </Link>
                <Button
                  onClick={() => setShowShareModal(true)}
                  className="flex-1 bg-midnight-navy text-white py-2.5 rounded-lg font-semibold hover:bg-midnight-navy/90 transition flex items-center justify-center text-sm"
                >
                  <Share2 className="w-4 h-4 mr-1.5" />
                  Share
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowShareModal(true)}
                  className="flex-1 bg-crimson text-white py-2.5 rounded-lg font-semibold hover:bg-crimson/90 transition flex items-center justify-center text-sm"
                >
                  <Share2 className="w-4 h-4 mr-1.5" />
                  Share
                </Button>
                <Button
                  onClick={() => setShowCalendarModal(true)}
                  variant="outline"
                  className="flex-1 border-2 border-crimson text-crimson py-2.5 rounded-lg font-semibold hover:bg-crimson/10 transition flex items-center justify-center text-sm bg-white/80 dark:bg-black/60"
                >
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Calendar
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      <RSVPModal
        event={event}
        isOpen={isRSVPModalOpen}
        onClose={() => setIsRSVPModalOpen(false)}
      />

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-midnight-navy">
              Share Event
            </DialogTitle>
          </DialogHeader>

          {!showQRCode ? (
            <div className="space-y-4">
              {/* Native Share */}
              <Button
                onClick={async () => {
                  await shareEvent(event);
                  setShowShareModal(false);
                }}
                className="w-full justify-start bg-cream hover:bg-cream/80 text-midnight-navy border border-frost-gray"
                variant="outline"
              >
                <Share2 className="w-5 h-5 mr-3" />
                Share via...
              </Button>

              {/* Social Media Options */}
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    const urls = generateSocialShareUrls(event);
                    window.open(urls.facebook, "_blank");
                    setShowShareModal(false);
                  }}
                  className="w-full justify-start bg-cream hover:bg-cream/80 text-midnight-navy border border-frost-gray"
                  variant="outline"
                >
                  <Facebook className="w-5 h-5 mr-3 text-crimson" />
                  Facebook
                </Button>

                <Button
                  onClick={() => {
                    const urls = generateSocialShareUrls(event);
                    window.open(urls.twitter, "_blank");
                    setShowShareModal(false);
                  }}
                  className="w-full justify-start bg-cream hover:bg-cream/80 text-midnight-navy border border-frost-gray"
                  variant="outline"
                >
                  <Twitter className="w-5 h-5 mr-3 text-crimson" />
                  Twitter/X
                </Button>

                <Button
                  onClick={() => {
                    const urls = generateSocialShareUrls(event);
                    window.open(urls.linkedin, "_blank");
                    setShowShareModal(false);
                  }}
                  className="w-full justify-start bg-cream hover:bg-cream/80 text-midnight-navy border border-frost-gray"
                  variant="outline"
                >
                  <Linkedin className="w-5 h-5 mr-3 text-crimson" />
                  LinkedIn
                </Button>

                <Button
                  onClick={() => {
                    const urls = generateSocialShareUrls(event);
                    window.location.href = urls.email;
                    setShowShareModal(false);
                  }}
                  className="w-full justify-start bg-cream hover:bg-cream/80 text-midnight-navy border border-frost-gray"
                  variant="outline"
                >
                  <Mail className="w-5 h-5 mr-3 text-crimson" />
                  Email
                </Button>

                <Button
                  onClick={handleCopyUrl}
                  className="w-full justify-start bg-cream hover:bg-cream/80 text-midnight-navy border border-frost-gray"
                  variant="outline"
                >
                  <Copy className="w-5 h-5 mr-3 text-crimson" />
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </div>

              {/* QR Code */}
              <div className="pt-4 border-t border-frost-gray">
                <Button
                  onClick={() => setShowQRCode(true)}
                  className="w-full justify-start bg-cream hover:bg-cream/80 text-midnight-navy border border-frost-gray"
                  variant="outline"
                >
                  <QrCode className="w-5 h-5 mr-3 text-crimson" />
                  Show QR Code
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <h3 className="text-lg font-semibold text-midnight-navy">
                Scan to view event
              </h3>
              <div className="flex justify-center p-4 bg-white rounded-lg border border-frost-gray">
                <QRCodeSVG
                  value={`${
                    process.env.NEXT_PUBLIC_FRONTEND_URL ||
                    "http://localhost:3000"
                  }/event/${event.id}`}
                  size={250}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-midnight-navy/60">
                {process.env.NEXT_PUBLIC_FRONTEND_URL ||
                  "http://localhost:3000"}
                /event/{event.id}
              </p>
              <Button
                onClick={() => setShowQRCode(false)}
                variant="outline"
                className="w-full"
              >
                Back
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Calendar Modal */}
      <Dialog open={showCalendarModal} onOpenChange={setShowCalendarModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-midnight-navy">
              Add to Calendar
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Button
              onClick={() => {
                const urls = generateCalendarUrls(event);
                window.open(urls.google, "_blank");
                setShowCalendarModal(false);
              }}
              className="w-full justify-start bg-cream hover:bg-cream/80 text-midnight-navy border border-frost-gray"
              variant="outline"
            >
              <Calendar className="w-5 h-5 mr-3 text-crimson" />
              Google Calendar
            </Button>

            <Button
              onClick={() => {
                const urls = generateCalendarUrls(event);
                window.open(urls.apple, "_blank");
                setShowCalendarModal(false);
              }}
              className="w-full justify-start bg-cream hover:bg-cream/80 text-midnight-navy border border-frost-gray"
              variant="outline"
            >
              <Calendar className="w-5 h-5 mr-3 text-crimson" />
              Apple Calendar
            </Button>

            <Button
              onClick={() => {
                const urls = generateCalendarUrls(event);
                window.open(urls.outlook, "_blank");
                setShowCalendarModal(false);
              }}
              className="w-full justify-start bg-cream hover:bg-cream/80 text-midnight-navy border border-frost-gray"
              variant="outline"
            >
              <Calendar className="w-5 h-5 mr-3 text-crimson" />
              Outlook Calendar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
