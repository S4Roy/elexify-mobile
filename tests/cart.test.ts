jest.mock('../src/api/client', () => ({
  api: { get: jest.fn(), put: jest.fn(), post: jest.fn() },
}));

import { api } from '../src/api/client';
import { applyCoupon, fetchCart, parseCartSummary } from '../src/api/cart';

test('parses MRP breakdown, estimated delivery and partial-COD fields', () => {
  const summary = parseCartSummary({
    docs: [],
    net_product_amount: 1200,
    mrp_subtotal: 1500,
    product_discount: 200,
    quantity_discount: 100,
    total_discount: 300,
    currency: 'INR',
    shipping: { amount: 0, zone: 'Zone A' },
    estimated_delivery: { display: '3–5 Oct 2026', min_days: 3, max_days: 5 },
    cod: {
      eligible: true,
      fee: 0,
      reason: null,
      code: 'ELIGIBLE',
      min_order: 500,
      max_order: 50000,
      advance_enabled: true,
      advance_percent: 20,
    },
  });
  expect(summary).toMatchObject({
    subtotal: 1200,
    mrpSubtotal: 1500,
    productDiscount: 200,
    quantityDiscount: 100,
    shippingAmount: 0,
    estimatedDelivery: { display: '3–5 Oct 2026', minDays: 3, maxDays: 5 },
    cod: {
      eligible: true,
      code: 'ELIGIBLE',
      minOrder: 500,
      maxOrder: 50000,
      advanceEnabled: true,
      advancePercent: 20,
    },
  });
});

test('a cart with no delivery estimate or COD data parses those fields as null', () => {
  const summary = parseCartSummary({
    docs: [],
    net_product_amount: 500,
    currency: 'INR',
  });
  expect(summary.estimatedDelivery).toBeNull();
  expect(summary.cod).toBeNull();
  expect(summary.shippingAmount).toBeNull();
});

test('fetchCart only sends payment_method when an address is selected and COD is chosen', async () => {
  (api.get as jest.Mock).mockResolvedValue({
    data: { data: { docs: [], net_product_amount: 0 } },
  });

  await fetchCart(false, 'addr-1', 'cod');
  expect(api.get).toHaveBeenLastCalledWith('site/inventory/product/carts', {
    params: { currency: 'INR', address_id: 'addr-1', payment_method: 'cod' },
    signal: undefined,
  });

  await fetchCart(false, 'addr-1', 'razorpay');
  expect(api.get).toHaveBeenLastCalledWith('site/inventory/product/carts', {
    params: { currency: 'INR', address_id: 'addr-1' },
    signal: undefined,
  });

  await fetchCart(false, undefined, 'cod');
  expect(api.get).toHaveBeenLastCalledWith('site/inventory/product/carts', {
    params: { currency: 'INR' },
    signal: undefined,
  });
});

test('applying a coupon reads the coupon code from the response, falling back to the submitted code', async () => {
  (api.post as jest.Mock).mockResolvedValue({
    data: {
      data: {
        coupon: { code: 'SAVE10' },
        discount: 150,
        subtotal: 1500,
        total: 1350,
      },
    },
  });
  await expect(applyCoupon('save10')).resolves.toEqual({
    code: 'SAVE10',
    discount: 150,
    subtotal: 1500,
    total: 1350,
  });

  (api.post as jest.Mock).mockResolvedValue({
    data: { data: { discount: 50, subtotal: 500, total: 450 } },
  });
  await expect(applyCoupon('welcome5')).resolves.toEqual(
    expect.objectContaining({ code: 'WELCOME5' }),
  );
});
