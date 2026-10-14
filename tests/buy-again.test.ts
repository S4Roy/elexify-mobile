jest.mock('../src/api/client', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));
import { api } from '../src/api/client';
import {
  addBuyAgain,
  buyAgainUnitPrice,
  fetchBuyAgain,
} from '../src/api/buyAgain';
const liveItem = {
  order_item_id: 'line-1',
  name: 'Transformer',
  original_quantity: 2,
  eligible: true,
  max_quantity: 5,
  existing_quantity: 3,
  base_price: 80,
  quantity_discounts: [{ min_quantity: 5, discount_percent: 10 }],
};

test('reads current pricing, availability and customised-item reasons', async () => {
  (api.get as jest.Mock).mockResolvedValue({
    data: {
      data: {
        items: [
          liveItem,
          {
            order_item_id: 'custom',
            name: 'Custom board',
            original_quantity: 1,
            eligible: false,
            reason: 'Configure this item again.',
          },
          { name: 'Malformed row' },
        ],
        currency: 'INR',
      },
    },
  });
  const controller = new AbortController();
  const items = await fetchBuyAgain('order-1', controller.signal);
  expect(api.get).toHaveBeenCalledWith('site/inventory/order/buy-again', {
    params: { order_id: 'order-1' },
    signal: controller.signal,
  });
  expect(items).toHaveLength(2);
  expect(items[0]).toMatchObject({
    id: 'line-1',
    basePrice: 80,
    existingQuantity: 3,
    maxQuantity: 5,
    eligible: true,
  });
  expect(items[1]).toMatchObject({
    id: 'custom',
    eligible: false,
    reason: 'Configure this item again.',
  });
  expect(buyAgainUnitPrice(items[0], 1)).toBe(80);
  expect(buyAgainUnitPrice(items[0], 2)).toBe(72);
});

test('submits additional quantities without client prices and reads partial results', async () => {
  (api.post as jest.Mock).mockResolvedValue({
    data: {
      data: {
        results: [
          {
            order_item_id: 'line-1',
            added: true,
            added_quantity: 2,
            unit_price: 72,
          },
          { order_item_id: 'line-2', added: false, reason: 'Stock changed.' },
        ],
      },
    },
  });
  const results = await addBuyAgain('order-1', [
    { id: 'line-1', quantity: 2 },
    { id: 'line-2', quantity: 1 },
  ]);
  expect(api.post).toHaveBeenCalledWith('site/inventory/order/buy-again', {
    order_id: 'order-1',
    items: [
      { order_item_id: 'line-1', quantity: 2 },
      { order_item_id: 'line-2', quantity: 1 },
    ],
  });
  expect(results).toEqual([
    { id: 'line-1', added: true, quantity: 2, unitPrice: 72, reason: '' },
    {
      id: 'line-2',
      added: false,
      quantity: 0,
      unitPrice: 0,
      reason: 'Stock changed.',
    },
  ]);
});

test('fails closed on missing stock and supports empty previews', async () => {
  (api.get as jest.Mock).mockResolvedValue({
    data: { data: { items: [{ ...liveItem, max_quantity: null }] } },
  });
  expect((await fetchBuyAgain('order-1'))[0].eligible).toBe(false);
  (api.get as jest.Mock).mockResolvedValue({ data: { data: {} } });
  await expect(fetchBuyAgain('order-1')).resolves.toEqual([]);
});
