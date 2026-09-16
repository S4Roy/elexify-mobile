jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
import {
  resolveStoreLink,
  websiteProductUrl,
} from '../src/features/catalog/links';
test('routes supported storefront links without trusting other origins', () => {
  expect(resolveStoreLink('/category/audio-boards')).toMatchObject({
    kind: 'category',
    category: 'audio-boards',
  });
  expect(resolveStoreLink('/products?category=boards')).toMatchObject({
    kind: 'products',
    query: { category: 'boards' },
  });
  expect(resolveStoreLink('https://evil.test/products')).toBeNull();
  expect(resolveStoreLink('javascript:alert(1)')).toBeNull();
  expect(resolveStoreLink('https://user:pass@elexify.online')).toBeNull();
  expect(resolveStoreLink('/products/board')).toMatchObject({
    kind: 'product',
    slug: 'board',
  });
  expect(
    resolveStoreLink('/products/board?variation_id=v1'),
  ).toMatchObject({
    kind: 'product',
    slug: 'board',
    query: { variation_id: 'v1' },
  });
});
test('product fallback preserves variant selection and encodes paths', () => {
  expect(websiteProductUrl({ slug: 'board/test', variationId: 'v&1' })).toBe(
    'https://elexify.online/products/board%2Ftest?variation_id=v%261',
  );
});
