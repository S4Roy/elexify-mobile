import type { OrderTracking, TrackingEvent } from '../../api/tracking';

// Mirrors elexify.online src/components/tracking/format.ts. Tracking dates
// are always shown in IST — couriers, ETAs and customers are all in India,
// so a device set to another timezone must not shift a scan's day.
const TZ = 'Asia/Kolkata';
const LOCALE = 'en-IN';

const valid = (v?: string | null) => {
  if (!v) {
    return null;
  }
  const d = new Date(v);
  return Number.isNaN(d.valueOf()) ? null : d;
};

// Some older JS engines reject `timeZone`; fall back to the device zone
// rather than render nothing.
const format = (
  d: Date,
  kind: 'date' | 'time',
  options: Intl.DateTimeFormatOptions,
) => {
  try {
    return kind === 'date'
      ? d.toLocaleDateString(LOCALE, { ...options, timeZone: TZ })
      : d.toLocaleTimeString(LOCALE, { ...options, timeZone: TZ });
  } catch {
    return kind === 'date'
      ? d.toLocaleDateString(LOCALE, options)
      : d.toLocaleTimeString(LOCALE, options);
  }
};

/** "Wed, 24 Sep" */
export const fmtDay = (v?: string | null) => {
  const d = valid(v);
  return d
    ? format(d, 'date', { weekday: 'short', day: 'numeric', month: 'short' })
    : '';
};

/** "24 Sep 2026" */
export const fmtDate = (v?: string | null) => {
  const d = valid(v);
  return d
    ? format(d, 'date', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
};

/** "2:30 pm" */
export const fmtTime = (v?: string | null) => {
  const d = valid(v);
  return d ? format(d, 'time', { hour: 'numeric', minute: '2-digit' }) : '';
};

/** Grouping key for "one heading per day" logs (YYYY-MM-DD in IST). */
export const dayKey = (v?: string | null) => {
  const d = valid(v);
  if (!d) {
    return 'unknown';
  }
  try {
    return d.toLocaleDateString('en-CA', { timeZone: TZ });
  } catch {
    return d.toISOString().slice(0, 10);
  }
};

/** "Today", "Yesterday", else "Wed, 24 Sep". */
export const relativeDay = (v?: string | null, now = Date.now()) => {
  if (!valid(v)) {
    return 'Date unavailable';
  }
  const key = dayKey(v);
  if (key === dayKey(new Date(now).toISOString())) {
    return 'Today';
  }
  if (key === dayKey(new Date(now - 86_400_000).toISOString())) {
    return 'Yesterday';
  }
  return fmtDay(v);
};

/** ETA text: prefers the parsed date, falls back to the courier's raw text. */
export const fmtEta = (at?: string | null, raw?: string | null) =>
  at ? fmtDay(at) : raw || '';

export type EventGroup = {
  key: string;
  label: string;
  events: TrackingEvent[];
};

/** Consecutive events (newest first) bucketed under one heading per day. */
export function groupEventsByDay(
  events: TrackingEvent[],
  now = Date.now(),
): EventGroup[] {
  const groups: EventGroup[] = [];
  for (const event of events) {
    const key = dayKey(event.at);
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      last.events.push(event);
    } else {
      groups.push({ key, label: relativeDay(event.at, now), events: [event] });
    }
  }
  return groups;
}

export const isClosedStatus = (status: string) =>
  ['cancelled', 'failed'].includes(status);

/** The one-line answer to "where is my order?" — same rules as the web headline. */
export function trackingHeadline(data: OrderTracking): string {
  const { order } = data;
  if (order.status === 'delivered' && order.deliveredAt) {
    return `Delivered on ${fmtDay(order.deliveredAt)}`;
  }
  if (isClosedStatus(order.status)) {
    return order.statusLabel;
  }
  const eta = fmtEta(data.expectedDeliveryAt, data.expectedDelivery);
  return eta ? `Arriving by ${eta}` : order.statusLabel;
}

/** Most recent event across every shipment, else the latest order event. */
export function latestTrackingEvent(data: OrderTracking): TrackingEvent | null {
  const all = [
    ...data.shipments.flatMap(s => s.events),
    ...data.activity,
  ].filter(e => e.at);
  if (!all.length) {
    return null;
  }
  return all.reduce((a, b) =>
    new Date(b.at as string) > new Date(a.at as string) ? b : a,
  );
}

export const destinationLabel = (data: OrderTracking) => {
  const d = data.destination;
  if (!d || (!d.city && !d.postcode)) {
    return null;
  }
  const place = [d.city, d.state].filter(Boolean).join(', ');
  return [place, d.postcode].filter(Boolean).join(' ');
};
