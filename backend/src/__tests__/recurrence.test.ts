import { expandRecurringEvent, expandEvents } from '../lib/recurrence';
import { Event } from '../types';

describe('Recurrence Logic', () => {
  const baseEvent: Event = {
    id: 1,
    promoter_id: 1,
    title: 'Weekly Meeting',
    description: 'Weekly sync',
    event_date: new Date('2025-12-01T10:00:00Z'),
    location: 'Office',
    city: 'New York',
    state: 'NY',
    image_url: null,
    sponsored_chapter_id: 1,
    event_type_id: 1,
    event_audience_type_id: 1,
    all_day: false,
    duration_minutes: 60,
    event_link: null,
    is_recurring: true,
    recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=5',
    recurrence_end_date: new Date('2025-12-31T23:59:59Z'),
    is_featured: false,
    featured_payment_status: 'UNPAID',
    stripe_payment_intent_id: null,
    ticket_price_cents: 0,
    dress_codes: ['business_casual'],
    dress_code_notes: null,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  };

  test('should expand a weekly recurring event', () => {
    const instances = expandRecurringEvent(
      baseEvent,
      new Date('2025-12-01T00:00:00Z'),
      new Date('2025-12-31T23:59:59Z')
    );

    expect(instances.length).toBe(5);
    expect(instances[0].event_date.toISOString()).toBe('2025-12-01T10:00:00.000Z');
    expect(instances[1].event_date.toISOString()).toBe('2025-12-08T10:00:00.000Z');
    expect(instances[4].event_date.toISOString()).toBe('2025-12-29T10:00:00.000Z');
  });

  test('should not expand non-recurring events', () => {
    const nonRecurring = { ...baseEvent, is_recurring: false, recurrence_rule: null };
    const instances = expandEvents([nonRecurring], new Date('2025-12-01T00:00:00Z'), new Date('2025-12-31T23:59:59Z'));
    
    expect(instances.length).toBe(1);
    expect(instances[0].id).toBe(1);
  });

  test('should handle recurrence end date', () => {
    const eventWithEnd = { 
      ...baseEvent, 
      recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO',
      recurrence_end_date: new Date('2025-12-15T23:59:59Z')
    };
    
    const instances = expandRecurringEvent(
      eventWithEnd,
      new Date('2025-12-01T00:00:00Z'),
      new Date('2025-12-31T23:59:59Z')
    );
    
    expect(instances.length).toBe(3); // Dec 1, 8, 15
    expect(instances[instances.length - 1].event_date.toISOString()).toBe('2025-12-15T10:00:00.000Z');
  });
});
