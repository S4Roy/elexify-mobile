import {
  canDownloadInvoice,
  orderStatusColor,
  orderStatusLabel,
  packageStepDate,
  packageStepReached,
  showsPackageProgress,
} from '../src/features/orders/tracking';
import type { OrderPackage } from '../src/api/order';

const basePackage: OrderPackage = {
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
  items: [],
  shippedAt: '2026-08-20T10:00:00.000Z',
  deliveredAt: null,
  createdAt: '2026-08-18T10:00:00.000Z',
  trackingEvents: [{ status: 'packed', occurredAt: '2026-08-18T12:00:00.000Z' }],
};

test('packageStepDate prefers an explicit tracking event over the fallback timestamp field', () => {
  expect(packageStepDate(basePackage, 'packed')).toBe('2026-08-18T12:00:00.000Z');
});

test('packageStepDate falls back to shippedAt/deliveredAt when no matching event exists', () => {
  expect(packageStepDate(basePackage, 'shipped')).toBe('2026-08-20T10:00:00.000Z');
  expect(packageStepDate(basePackage, 'delivered')).toBeNull();
});

test('packageStepReached is true for steps at or before the package current status', () => {
  expect(packageStepReached(basePackage, 'packed')).toBe(true);
  expect(packageStepReached(basePackage, 'shipped')).toBe(true);
  expect(packageStepReached(basePackage, 'out_for_delivery')).toBe(false);
  expect(packageStepReached(basePackage, 'delivered')).toBe(false);
});

test('showsPackageProgress hides the step tracker for cancelled/returned packages', () => {
  expect(showsPackageProgress(basePackage)).toBe(true);
  expect(showsPackageProgress({ ...basePackage, status: 'cancelled' })).toBe(false);
  expect(showsPackageProgress({ ...basePackage, status: 'returned' })).toBe(false);
});

test('canDownloadInvoice allows eligible order statuses even before an invoice is generated', () => {
  expect(canDownloadInvoice({ invoiceGenerated: false, orderStatus: 'confirmed' })).toBe(true);
  expect(canDownloadInvoice({ invoiceGenerated: false, orderStatus: 'processing' })).toBe(true);
  expect(canDownloadInvoice({ invoiceGenerated: false, orderStatus: 'partially_shipped' })).toBe(true);
  expect(canDownloadInvoice({ invoiceGenerated: false, orderStatus: 'delivered' })).toBe(true);
});

test('canDownloadInvoice allows a generated invoice regardless of order status', () => {
  expect(canDownloadInvoice({ invoiceGenerated: true, orderStatus: 'cancelled' })).toBe(true);
});

test('canDownloadInvoice is false before an order is confirmed and no invoice exists yet', () => {
  expect(canDownloadInvoice({ invoiceGenerated: false, orderStatus: 'pending' })).toBe(false);
  expect(canDownloadInvoice({ invoiceGenerated: false, orderStatus: 'cancelled' })).toBe(false);
});

test('orderStatusLabel distinguishes a confirmed order from one being processed', () => {
  expect(orderStatusLabel('confirmed')).toBe('Order confirmed');
  expect(orderStatusLabel('processing')).toBe('Processing');
  expect(orderStatusLabel('out_for_delivery')).toBe('Out for delivery');
  expect(orderStatusColor('confirmed')).not.toEqual(orderStatusColor('processing'));
});
