import { Metadata } from "next";
import { fetchEvent, fetchChapters, fetchEventTypes } from "@/lib/api";
import { SEED_EVENTS } from "@/lib/seedData";
import EventClientPage from "./EventClientPage";
import { getEventFullSizeUrl } from "@/lib/imageUtils";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const eventId = Number(params.id);
  
  // Try to get seed event first for faster metadata generation if it matches
  let event = SEED_EVENTS.find(e => e.id === eventId);
  
  if (!event) {
    try {
      event = await fetchEvent(eventId);
    } catch (error) {
      console.error("Error fetching event for metadata:", error);
    }
  }

  if (!event) {
    return {
      title: "Event Not Found | 1Kappa",
    };
  }

  const title = event.title;
  const description = event.description || `Event on ${new Date(event.event_date).toLocaleDateString()}`;
  const imageUrl = event.image_url ? (getEventFullSizeUrl(event.image_url) || event.image_url) : "/og-image.png";
  const url = `/event/${event.id}`;

  return {
    title: `${title} | 1Kappa`,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function EventPage({ params }: Props) {
  const eventId = Number(params.id);

  try {
    // Check for seed data first
    const seedEvent = SEED_EVENTS.find((e) => e.id === eventId);
    
    if (seedEvent) {
      const eventTypes = await fetchEventTypes().catch(() => []);
      return (
        <EventClientPage
          initialEvent={seedEvent}
          initialChapters={[]}
          initialEventTypes={eventTypes}
        />
      );
    }

    const [event, chapters, eventTypes] = await Promise.all([
      fetchEvent(eventId),
      fetchChapters().catch(() => []),
      fetchEventTypes().catch(() => []),
    ]);

    return (
      <EventClientPage
        initialEvent={event}
        initialChapters={chapters}
        initialEventTypes={eventTypes}
      />
    );
  } catch (error) {
    console.error("Error loading event page:", error);
    
    // Fallback check again
    const fallbackSeed = SEED_EVENTS.find((e) => e.id === eventId);
    if (fallbackSeed) {
      const eventTypes = await fetchEventTypes().catch(() => []);
      return (
        <EventClientPage
          initialEvent={fallbackSeed}
          initialChapters={[]}
          initialEventTypes={eventTypes}
        />
      );
    }

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
}
