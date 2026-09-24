import { friendlyReason, isRazorpayCancelled } from '../src/features/checkout/friendlyReason';

test('friendlyReason maps known backend/gateway reasons to customer-facing copy', () => {
  expect(friendlyReason('Idempotency key was already used for a different checkout request')).toBe(
    'Your checkout details changed. Please review them before placing a new order.',
  );
  expect(friendlyReason('Insufficient stock for SKU-123')).toBe(
    'One or more items in your order just sold out.',
  );
  expect(friendlyReason('Price has changed since cart was quoted')).toBe(
    'Some prices or stock changed since you started checkout. Please review your cart and try again.',
  );
  expect(friendlyReason('Coupon is no longer valid')).toBe(
    'Your coupon could no longer be applied to this order.',
  );
  expect(friendlyReason('Card declined by issuer')).toBe(
    'Your bank or card issuer declined this payment.',
  );
});

test('friendlyReason falls back to a generic message for unrecognized reasons', () => {
  expect(friendlyReason('Some unmapped gateway error')).toBe(
    'Please try again, or contact support with the details below.',
  );
});

test('friendlyReason returns null when there is no reason to show', () => {
  expect(friendlyReason(null)).toBeNull();
  expect(friendlyReason(undefined)).toBeNull();
  expect(friendlyReason('')).toBeNull();
});

test('isRazorpayCancelled treats SDK error code 0 as a user cancellation', () => {
  expect(isRazorpayCancelled({ code: 0, description: 'Payment Cancelled' })).toBe(true);
  expect(isRazorpayCancelled({ code: 0 })).toBe(true);
});

test('isRazorpayCancelled falls back to matching "cancel" in the description', () => {
  expect(isRazorpayCancelled({ code: 2, description: 'User cancelled the transaction' })).toBe(true);
});

test('isRazorpayCancelled treats other codes/descriptions as a genuine failure', () => {
  expect(isRazorpayCancelled({ code: 2, description: 'Payment failed due to insufficient balance' })).toBe(false);
  expect(isRazorpayCancelled(null)).toBe(false);
  expect(isRazorpayCancelled(undefined)).toBe(false);
});
