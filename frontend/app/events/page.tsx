'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchEvents, fetchEventTypes, type Event, type EventType } from '@/lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

type FilterType = 'all' | 'upcoming' | 'past';

function EventsPageContent() {
  const searchParams = useSearchParams();
  const showPromoterHero = searchParams.get('role') === 'promoter';
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedEventType, setSelectedEventType] = useState<number | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState('');

  // Sync searchQuery with URL parameter
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch !== null && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams, searchQuery]);

  useEffect(() => {
    Promise.all([
      fetchEvents().catch(() => []),
      fetchEventTypes().catch(() => [])
    ])
      .then(([eventsData, eventTypesData]) => {
        setEvents(eventsData);
        setEventTypes(eventTypesData);
      })
      .catch((err) => {
        console.error('Error fetching events:', err);
        setError('Failed to load events');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Filter by date
    const now = new Date();
    if (filter === 'upcoming') {
      filtered = filtered.filter(event => new Date(event.event_date) >= now);
    } else if (filter === 'past') {
      filtered = filtered.filter(event => new Date(event.event_date) < now);
    }
    // 'all' shows everything, no date filtering needed

    // Filter by event type
    if (selectedEventType !== 'all') {
      filtered = filtered.filter(event => event.event_type_id === selectedEventType);
    }

    // Filter by location (city or state)
    if (locationFilter.trim()) {
      const location = locationFilter.toLowerCase();
      filtered = filtered.filter(event => 
        (event.city && event.city.toLowerCase().includes(location)) ||
        (event.state && event.state.toLowerCase().includes(location)) ||
        (event.location && event.location.toLowerCase().includes(location))
      );
    }

    // Filter by search query (title, description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query))
      );
    }

    // Sort: upcoming events by date ascending, past events by date descending
    filtered.sort((a, b) => {
      const dateA = new Date(a.event_date);
      const dateB = new Date(b.event_date);
      if (filter === 'past') {
        return dateB.getTime() - dateA.getTime();
      }
      return dateA.getTime() - dateB.getTime();
    });

    return filtered;
  }, [events, filter, searchQuery, selectedEventType, locationFilter]);

  return (
    <div className="min-h-screen bg-cream dark:bg-black text-midnight-navy dark:text-gray-100">
      <Header />
      
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-crimson to-midnight-navy text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          {showPromoterHero ? (
            <>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4"> Bring the Bond to Life</h1>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Discover events hosted by verified Brothers and trusted friends of Kappa—socials, galas, day parties, conferences, and gatherings that strengthen our network and celebrate our culture.
              </p>
              <Link
                href="/promoter-setup"
                className="inline-block bg-white text-crimson px-6 py-3 rounded-lg font-semibold hover:bg-cream transition-colors shadow-lg hover:shadow-xl"
              >
                Become a Promoter
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Events</h1>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Discover upcoming gatherings, reunions, and chapter events. Connect with brothers and celebrate our community.
              </p>
              <Link
                href="/promoter-setup"
                className="inline-block bg-white text-crimson px-6 py-3 rounded-lg font-semibold hover:bg-cream transition-colors shadow-lg hover:shadow-xl"
              >
                Promote an Event
              </Link>
            </>
          )}
        </div>
      </section>
      
      <main className="max-w-7xl mx-auto px-4 py-12">

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <svg 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-midnight-navy/40" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search events by title, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy bg-white"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Date Filter */}
            <div className="flex gap-2 bg-white p-1 rounded-lg border border-frost-gray">
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  filter === 'upcoming'
                    ? 'bg-crimson text-white'
                    : 'text-midnight-navy hover:bg-frost-gray'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  filter === 'past'
                    ? 'bg-crimson text-white'
                    : 'text-midnight-navy hover:bg-frost-gray'
                }`}
              >
                Past
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  filter === 'all'
                    ? 'bg-crimson text-white'
                    : 'text-midnight-navy hover:bg-frost-gray'
                }`}
              >
                All
              </button>
            </div>

            {/* Event Type Filter */}
            <select
              value={selectedEventType === 'all' ? '' : selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value ? parseInt(e.target.value) : 'all')}
              className="flex-1 px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy bg-white"
            >
              <option value="">All Event Types</option>
              {eventTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.description}
                </option>
              ))}
            </select>

            {/* Location Filter */}
            <input
              type="text"
              placeholder="Filter by city or state..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="flex-1 px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy bg-white"
            />
          </div>

          {/* Results Count */}
          {!loading && (
            <div className="text-sm text-midnight-navy/60">
              Showing {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedEventType !== 'all' && ` of type "${eventTypes.find(t => t.id === selectedEventType)?.description || ''}"`}
              {locationFilter && ` in "${locationFilter}"`}
            </div>
          )}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow overflow-hidden">
                <Skeleton className="w-full h-48" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-crimson text-white px-6 py-2 rounded-full font-semibold hover:bg-crimson/90 transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-frost-gray">
            <svg 
              className="w-16 h-16 text-midnight-navy/20 mx-auto mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-midnight-navy mb-2">
              {searchQuery || selectedEventType !== 'all' || locationFilter ? 'No events found' : 'No events available'}
            </h3>
            <p className="text-midnight-navy/60 mb-6">
              {searchQuery || selectedEventType !== 'all' || locationFilter
                ? 'Try adjusting your filters or search query.'
                : filter === 'upcoming'
                ? 'Check back soon for upcoming events!'
                : filter === 'past'
                ? 'No past events to display.'
                : 'No events available at this time.'}
            </p>
            {(searchQuery || selectedEventType !== 'all' || locationFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedEventType('all');
                  setLocationFilter('');
                  setFilter('all');
                }}
                className="bg-crimson text-white px-6 py-2 rounded-full font-semibold hover:bg-crimson/90 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              // Get chapter name from event data if available
              const chapterName = event.chapter_name || null;
              return (
                <EventCard 
                  key={event.id} 
                  event={event}
                  chapterName={chapterName}
                />
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

import { SkeletonLoader } from '../components/SkeletonLoader';

export default function EventsPage() {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <EventsPageContent />
    </Suspense>
  );
}

