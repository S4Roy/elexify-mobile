import { api } from '../src/api/client';
import { fetchReviews, submitRating } from '../src/api/productDetail';
jest.mock('../src/api/client', () => ({ api: { get: jest.fn(), post: jest.fn() }, ApiError: class extends Error {} }));
beforeEach(() => jest.clearAllMocks());
test('requests bounded pages and preserves verification and title', async () => {
  (api.get as jest.Mock).mockResolvedValue({ data: { data: { docs: [{ _id: 'r1', rating: 5, title: 'Works', verified_purchase: true, user: { name: 'Customer' }, media: [] }], hasNextPage: true } } });
  const result = await fetchReviews('p1', 'v1', undefined, 2);
  expect(api.get).toHaveBeenCalledWith('site/cms/ratings', expect.objectContaining({ params: { product_id: 'p1', variation_id: 'v1', page: 2, limit: 20 } }));
  expect(result.nextPage).toBe(3);
  expect(result.docs[0]).toMatchObject({ id: 'r1', title: 'Works', verifiedPurchase: true });
});
test('stops at the final page and does not infer verification from customer identity', async () => {
  (api.get as jest.Mock).mockResolvedValue({ data: { data: { docs: [{ _id: 'r1', rating: 4, user: { name: 'Buyer' } }], hasNextPage: false } } });
  const result = await fetchReviews('p1', undefined);
  expect(result.nextPage).toBeUndefined();
  expect(result.docs[0].verifiedPurchase).toBe(false);
});
test('submission keeps the existing endpoint and never sends verification', async () => {
  await submitRating({ productId: 'p1', rating: 5, description: 'Good' });
  expect(api.post).toHaveBeenCalledWith('user/rating/add', { product_id: 'p1', variation_id: null, rating: 5, description: 'Good', media: undefined });
});
