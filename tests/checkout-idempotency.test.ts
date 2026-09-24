jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/api/order', () => ({
  placeOrder: jest.fn(),
  verifyPayment: jest.fn(),
}));
let mockUuidCounter = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: () => `uuid-${++mockUuidCounter}`,
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearIdempotencyKey,
  getIdempotencyKey,
} from '../src/features/checkout/hooks';

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('reuses the same key for a repeated identical checkout request', async () => {
  const signature = JSON.stringify({
    addressId: 'a1',
    paymentMethod: 'razorpay',
    total: 100,
  });
  const first = await getIdempotencyKey('cart', signature);
  const second = await getIdempotencyKey('cart', signature);
  expect(second).toBe(first);
});

test('issues a fresh key once the request signature changes (address, coupon or total)', async () => {
  const first = await getIdempotencyKey(
    'cart',
    JSON.stringify({ addressId: 'a1', total: 100 }),
  );
  const second = await getIdempotencyKey(
    'cart',
    JSON.stringify({ addressId: 'a2', total: 100 }),
  );
  expect(second).not.toBe(first);
});

test('discards a pre-upgrade plain-string stored key instead of throwing', async () => {
  await AsyncStorage.setItem(
    'elx-checkout-idempotency:cart',
    'legacy-plain-uuid',
  );
  const key = await getIdempotencyKey(
    'cart',
    JSON.stringify({ addressId: 'a1' }),
  );
  expect(key).not.toBe('legacy-plain-uuid');
});

test('clearing the key means the next request starts a brand new one', async () => {
  const signature = JSON.stringify({ addressId: 'a1', total: 100 });
  const first = await getIdempotencyKey('cart', signature);
  await clearIdempotencyKey('cart');
  const second = await getIdempotencyKey('cart', signature);
  expect(second).not.toBe(first);
});

test('cart and direct-checkout modes are tracked independently', async () => {
  const signature = JSON.stringify({ addressId: 'a1', total: 100 });
  const cartKey = await getIdempotencyKey('cart', signature);
  const directKey = await getIdempotencyKey('direct', signature);
  expect(directKey).not.toBe(cartKey);
});
