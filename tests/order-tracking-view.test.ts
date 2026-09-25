jest.mock('../src/api/client', () => ({
  api: {},
  ApiError: class extends Error {},
}));

import { parseOrderTracking } from '../src/api/tracking';
import {
  destinationLabel,
  groupEventsByDay,
  latestTrackingEvent,
  relativeDay,
  trackingHeadline,
} from '../src/features/orders/trackingFormat';

const payload = {
  order: {
    _id: 'o1',
    id: 'ORD-000123',
    placed_at: '2026-09-20T05:00:00.000Z',
    status: 'shipped',
    status_label: 'Shipped',
    payment_method: 'cod',
    item_count: 2,
    delivered_at: null,
    cancelled_at: null,
  },
  destination: {
    name: 'A',
    city: 'Kolkata',
    state: 'West Bengal',
    postcode: '700001',
  },
  expected_delivery: '26 Sep 2026',
  expected_delivery_at: '2026-09-26T18:29:59.000Z',
  milestones: [
    {
      key: 'placed',
      label: 'Order placed',
      at: '2026-09-20T05:00:00.000Z',
      state: 'done',
    },
    { key: 'shipped', label: 'Shipped', at: null, state: 'current' },
    { key: 'delivered', label: 'Delivered', at: null, state: 'bogus' },
    { label: 'no key' },
  ],
  shipments: [
    {
      key: 'p1',
      label: 'Shipment',
      package_number: 1,
      status: 'shipped',
      status_label: 'Shipped',
      awb: '1234',
      tracking_url: 'http://insecure.example/track',
      items: [{ name: 'Rudraksha', image: null, quantity: 1 }],
      events: [
        {
          at: '2026-09-23T10:00:00.000Z',
          title: 'In transit',
          location: 'Hub',
          kind: 'courier',
        },
        {
          at: '2026-09-22T09:00:00.000Z',
          title: 'Handed over to courier',
          kind: 'update',
        },
        { title: '' },
      ],
    },
  ],
  unshipped_items: [],
  activity: [
    { at: '2026-09-20T05:00:00.000Z', title: 'Order placed', kind: 'order' },
  ],
  generated_at: '2026-09-24T10:00:00.000Z',
};

test('parseOrderTracking maps the backend payload and drops malformed entries', () => {
  const t = parseOrderTracking(payload)!;
  expect(t.order.id).toBe('ORD-000123');
  expect(t.milestones.map(m => m.state)).toEqual([
    'done',
    'current',
    'upcoming',
  ]);
  expect(t.shipments[0].events).toHaveLength(2);
  expect(t.shipments[0].trackingUrl).toBeNull();
  expect(t.shipments[0].packageNumber).toBe(1);
  expect(parseOrderTracking({})).toBeNull();
});

test('trackingHeadline prefers delivery, then closed status, then ETA', () => {
  const t = parseOrderTracking(payload)!;
  expect(trackingHeadline(t)).toMatch(/^Arriving by /);
  expect(
    trackingHeadline({
      ...t,
      expectedDeliveryAt: null,
      expectedDelivery: null,
    }),
  ).toBe('Shipped');
  expect(
    trackingHeadline({
      ...t,
      order: { ...t.order, status: 'cancelled', statusLabel: 'Cancelled' },
    }),
  ).toBe('Cancelled');
  expect(
    trackingHeadline({
      ...t,
      order: {
        ...t.order,
        status: 'delivered',
        deliveredAt: '2026-09-25T06:00:00.000Z',
      },
    }),
  ).toMatch(/^Delivered on /);
});

test('latestTrackingEvent picks the newest event across shipments and activity', () => {
  const t = parseOrderTracking(payload)!;
  expect(latestTrackingEvent(t)?.title).toBe('In transit');
});

test('events are grouped per IST day with relative labels', () => {
  const now = new Date('2026-09-23T12:00:00.000Z').getTime();
  const t = parseOrderTracking(payload)!;
  const groups = groupEventsByDay(t.shipments[0].events, now);
  expect(groups.map(g => g.label)[0]).toBe('Today');
  expect(groups[1].label).toBe('Yesterday');
  // 23 Sep 20:00 UTC is already 24 Sep in IST.
  expect(
    relativeDay(
      '2026-09-23T20:00:00.000Z',
      new Date('2026-09-24T01:00:00.000Z').getTime(),
    ),
  ).toBe('Today');
});

test('destinationLabel joins city, state and postcode', () => {
  const t = parseOrderTracking(payload)!;
  expect(destinationLabel(t)).toBe('Kolkata, West Bengal 700001');
  expect(destinationLabel({ ...t, destination: null })).toBeNull();
});
