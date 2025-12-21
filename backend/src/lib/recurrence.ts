import { RRule, rrulestr } from 'rrule';
import { Event as EventType } from '../types';

/**
 * Expands a recurring event into multiple instances within a given date range.
 * @param event The event to expand
 * @param start The start of the range (defaults to now)
 * @param end The end of the range (defaults to 3 months from start)
 * @returns An array of event instances
 */
export function expandRecurringEvent(
  event: EventType,
  start: Date = new Date(),
  end: Date = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days default
): EventType[] {
  if (!event.is_recurring || !event.recurrence_rule) {
    return [event];
  }

  try {
    const rule = rrulestr(event.recurrence_rule, {
      dtstart: new Date(event.event_date),
    });

    const effectivelyEnd = event.recurrence_end_date 
      ? new Date(Math.min(new Date(event.recurrence_end_date).getTime(), end.getTime()))
      : end;

    const dates = rule.between(start, effectivelyEnd, true);

    return dates.map((date) => ({
      ...event,
      event_date: date,
      // We keep the same ID for now, as they are instances of the same series
      // In the future, we might want to generate unique IDs if we support individual instance edits
      is_instance: true, 
      original_event_id: event.id,
    })) as any[];
  } catch (error) {
    console.error(`Error expanding recurring event ${event.id}:`, error);
    return [event];
  }
}

/**
 * Expands a list of events, handling both recurring and non-recurring ones.
 */
export function expandEvents(
  events: EventType[],
  start: Date = new Date(),
  end: Date = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
): EventType[] {
  const allInstances: EventType[] = [];

  for (const event of events) {
    if (event.is_recurring) {
      allInstances.push(...expandRecurringEvent(event, start, end));
    } else {
      // For non-recurring events, only include if they are within or after the range
      if (new Date(event.event_date) >= start) {
        allInstances.push(event);
      }
    }
  }

  // Sort by date
  return allInstances.sort((a, b) => 
    new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );
}
