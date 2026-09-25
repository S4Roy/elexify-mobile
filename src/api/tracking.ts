import { api } from './client';
import { record, string } from './discovery';

// Customer tracking model served by GET site/inventory/order/tracking — the
// same payload elexify.online's OrderTrackingView renders (see its
// src/types/index.ts OrderTracking). Built server-side by
// elexify-backend services/orderService/tracking/buildOrderTracking.js.

export type TrackingEventKind = 'courier' | 'update' | 'order';

export type TrackingEvent = {
  at: string | null;
  title: string;
  location: string | null;
  kind: TrackingEventKind;
};

export type TrackingMilestone = {
  key: string;
  label: string;
  at: string | null;
  state: 'done' | 'current' | 'upcoming';
  tone: 'danger' | 'warning' | null;
};

export type TrackingItem = {
  name: string;
  image: string | null;
  quantity: number;
};

export type TrackingShipment = {
  key: string;
  label: string;
  packageNumber: number | null;
  status: string;
  statusLabel: string;
  courierStatus: string | null;
  courierName: string | null;
  awb: string | null;
  trackingUrl: string | null;
  etd: string | null;
  etdAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: TrackingItem[];
  events: TrackingEvent[];
};

export type OrderTracking = {
  order: {
    id: string;
    placedAt: string | null;
    status: string;
    statusLabel: string;
    paymentMethod: string | null;
    itemCount: number;
    deliveredAt: string | null;
    cancelledAt: string | null;
  };
  destination: {
    name: string | null;
    city: string | null;
    state: string | null;
    postcode: string | null;
  } | null;
  expectedDelivery: string | null;
  expectedDeliveryAt: string | null;
  milestones: TrackingMilestone[];
  shipments: TrackingShipment[];
  unshippedItems: TrackingItem[];
  activity: TrackingEvent[];
  generatedAt: string | null;
};

const nullable = (v: unknown) => string(v) || null;
const count = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) ? v : 0;
const list = (v: unknown) => (Array.isArray(v) ? v : []);

const EVENT_KINDS: TrackingEventKind[] = ['courier', 'update', 'order'];
const MILESTONE_STATES: TrackingMilestone['state'][] = [
  'done',
  'current',
  'upcoming',
];

function parseEvent(value: unknown): TrackingEvent | null {
  const e = record(value);
  const title = string(e.title);
  if (!title) {
    return null;
  }
  const kind = string(e.kind) as TrackingEventKind;
  return {
    at: nullable(e.at),
    title,
    location: nullable(e.location),
    kind: EVENT_KINDS.includes(kind) ? kind : 'update',
  };
}

const parseEvents = (v: unknown) =>
  list(v)
    .map(parseEvent)
    .filter((e): e is TrackingEvent => e !== null);

function parseItem(value: unknown): TrackingItem {
  const i = record(value);
  return {
    name: string(i.name) || 'Item',
    image: nullable(i.image),
    quantity: count(i.quantity),
  };
}

function parseMilestone(value: unknown): TrackingMilestone | null {
  const m = record(value);
  const key = string(m.key);
  if (!key) {
    return null;
  }
  const state = string(m.state) as TrackingMilestone['state'];
  const tone = string(m.tone);
  return {
    key,
    label: string(m.label) || key,
    at: nullable(m.at),
    state: MILESTONE_STATES.includes(state) ? state : 'upcoming',
    tone: tone === 'danger' || tone === 'warning' ? tone : null,
  };
}

function parseShipment(value: unknown): TrackingShipment | null {
  const s = record(value);
  const key = string(s.key);
  if (!key) {
    return null;
  }
  const trackingUrl = string(s.tracking_url);
  return {
    key,
    label: string(s.label) || 'Shipment',
    packageNumber:
      typeof s.package_number === 'number' ? s.package_number : null,
    status: string(s.status),
    statusLabel: string(s.status_label) || string(s.status),
    courierStatus: nullable(s.courier_status),
    courierName: nullable(s.courier_name),
    awb: nullable(s.awb),
    // Only ever open a secure courier page from the app.
    trackingUrl: trackingUrl.startsWith('https://') ? trackingUrl : null,
    etd: nullable(s.etd),
    etdAt: nullable(s.etd_at),
    shippedAt: nullable(s.shipped_at),
    deliveredAt: nullable(s.delivered_at),
    items: list(s.items).map(parseItem),
    events: parseEvents(s.events),
  };
}

export function parseOrderTracking(value: unknown): OrderTracking | null {
  const d = record(value);
  const o = record(d.order);
  if (!string(o.id)) {
    return null;
  }
  const dest = d.destination ? record(d.destination) : null;
  return {
    order: {
      id: string(o.id),
      placedAt: nullable(o.placed_at),
      status: string(o.status),
      statusLabel: string(o.status_label) || string(o.status),
      paymentMethod: nullable(o.payment_method),
      itemCount: count(o.item_count),
      deliveredAt: nullable(o.delivered_at),
      cancelledAt: nullable(o.cancelled_at),
    },
    destination: dest
      ? {
          name: nullable(dest.name),
          city: nullable(dest.city),
          state: nullable(dest.state),
          postcode: nullable(dest.postcode),
        }
      : null,
    expectedDelivery: nullable(d.expected_delivery),
    expectedDeliveryAt: nullable(d.expected_delivery_at),
    milestones: list(d.milestones)
      .map(parseMilestone)
      .filter((m): m is TrackingMilestone => m !== null),
    shipments: list(d.shipments)
      .map(parseShipment)
      .filter((s): s is TrackingShipment => s !== null),
    unshippedItems: list(d.unshipped_items).map(parseItem),
    activity: parseEvents(d.activity),
    generatedAt: nullable(d.generated_at),
  };
}

export async function fetchOrderTracking(
  orderId: string,
  signal?: AbortSignal,
): Promise<OrderTracking | null> {
  const res = await api.get('site/inventory/order/tracking', {
    params: { order_id: orderId },
    signal,
  });
  return parseOrderTracking(res.data?.data);
}
