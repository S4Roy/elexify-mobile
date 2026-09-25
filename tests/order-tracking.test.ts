import { parsePackage } from '../src/api/order';

jest.mock('../src/api/client', () => ({
  api: {},
  ApiError: class extends Error {},
}));

test('parsePackage reads a fully populated package with its tracking log', () => {
  expect(
    parsePackage({
      package_number: 1,
      reference_id: 'ORD-1-P1',
      status: 'shipped',
      courier_name: 'Delhivery',
      awb: 'AWB123',
      etd: '26-29 Aug',
      tracking_url: 'https://track.example/AWB123',
      item_count: 2,
      items: [
        { order_item_id: 'item-a', quantity: 1 },
        { order_item_id: 'item-b', quantity: 3 },
        { quantity: 1 },
      ],
      shipped_at: '2026-08-20T10:00:00.000Z',
      created_at: '2026-08-18T10:00:00.000Z',
      tracking_events: [
        { status: 'packed', occurred_at: '2026-08-18T12:00:00.000Z' },
        { status: 'shipped', occurred_at: '2026-08-20T10:00:00.000Z' },
      ],
    }),
  ).toEqual({
    packageNumber: 1,
    referenceId: 'ORD-1-P1',
    status: 'shipped',
    shiprocketStatus: null,
    shiprocketStatusUpdatedAt: null,
    courierName: 'Delhivery',
    awb: 'AWB123',
    etd: '26-29 Aug',
    trackingUrl: 'https://track.example/AWB123',
    itemCount: 2,
    items: [
      { orderItemId: 'item-a', quantity: 1 },
      { orderItemId: 'item-b', quantity: 3 },
    ],
    shippedAt: '2026-08-20T10:00:00.000Z',
    deliveredAt: null,
    createdAt: '2026-08-18T10:00:00.000Z',
    trackingEvents: [
      { status: 'packed', occurredAt: '2026-08-18T12:00:00.000Z' },
      { status: 'shipped', occurredAt: '2026-08-20T10:00:00.000Z' },
    ],
  });
});

test('parsePackage defaults a missing tracking log to an empty array', () => {
  expect(parsePackage({ package_number: 2, status: 'packed' })?.trackingEvents).toEqual([]);
});

test('parsePackage rejects an entry with no package number or status', () => {
  expect(parsePackage({ status: 'packed' })).toBeNull();
  expect(parsePackage({ package_number: 1 })).toBeNull();
});
