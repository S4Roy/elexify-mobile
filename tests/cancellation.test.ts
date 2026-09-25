jest.mock('../src/api/client', () => ({
  api: {},
  ApiError: class extends Error {},
}));

import { parseCancellation, parseRefund } from '../src/api/order';
import {
  cancellationImpact,
  cancellationOutcome,
  hasCapturedOnlinePayment,
  refundSteps,
} from '../src/features/orders/cancellation';

const prepaid = {
  paymentMethod: 'razorpay',
  paymentStatus: 'paid',
  isPartialCod: false,
};
const cod = {
  paymentMethod: 'cod',
  paymentStatus: 'pending',
  isPartialCod: false,
};
const partialCod = {
  paymentMethod: 'cod',
  paymentStatus: 'advance_paid',
  isPartialCod: true,
};
const unpaidPrepaid = { ...prepaid, paymentStatus: 'pending' };

test('only captured online money counts as refundable', () => {
  expect(hasCapturedOnlinePayment(prepaid)).toBe(true);
  expect(hasCapturedOnlinePayment(partialCod)).toBe(true);
  expect(hasCapturedOnlinePayment(cod)).toBe(false);
  expect(hasCapturedOnlinePayment(unpaidPrepaid)).toBe(false);
});

test('impact copy matches how the order was paid', () => {
  expect(cancellationImpact(prepaid)).toMatch(/payment will be refunded/);
  expect(cancellationImpact(partialCod)).toMatch(/advance you paid/);
  expect(cancellationImpact(cod)).toMatch(/Cash on Delivery/);
  expect(cancellationImpact(unpaidPrepaid)).toMatch(/No payment was taken/);
});

test('outcome reflects the refund result', () => {
  const base = { orderStatus: 'cancelled', paymentStatus: '' };
  expect(cancellationOutcome(cod, { ...base, refund: null })).toEqual({
    tone: 'success',
    message: 'Your order has been cancelled.',
  });
  expect(
    cancellationOutcome(prepaid, {
      ...base,
      refund: {
        status: 'processing',
        amount: 100,
        initiatedAt: null,
        completedAt: null,
      },
    }).message,
  ).toMatch(/refund has been initiated/);
  expect(
    cancellationOutcome(prepaid, {
      ...base,
      refund: {
        status: 'failed',
        amount: 100,
        initiatedAt: null,
        completedAt: null,
      },
    }).tone,
  ).toBe('warning');
});

test('refund steps for each refund status', () => {
  const r = {
    amount: 10,
    initiatedAt: '2026-09-01T00:00:00Z',
    completedAt: '2026-09-03T00:00:00Z',
  };
  expect(refundSteps({ ...r, status: 'processed' }).map(s => s.label)).toEqual([
    'Refund initiated',
    'Refund completed',
  ]);
  expect(refundSteps({ ...r, status: 'processing' })[1].state).toBe('current');
  expect(refundSteps({ ...r, status: 'failed' })[1].state).toBe('failed');
});

test('parsers skip records that do not apply', () => {
  expect(parseRefund({ status: 'not_required' })).toBeNull();
  expect(
    parseRefund({ status: 'failed', attempted_at: 'x' })?.initiatedAt,
  ).toBe('x');
  expect(parseCancellation(null)).toBeNull();
  expect(
    parseCancellation({
      reason: 'Changed my mind',
      cancelled_at: 't',
      cancelled_by: 'customer',
    }),
  ).toEqual({
    reason: 'Changed my mind',
    comment: null,
    cancelledAt: 't',
    cancelledBy: 'customer',
  });
});
