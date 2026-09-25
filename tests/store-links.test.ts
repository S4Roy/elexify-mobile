jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
import {
  resolveStoreLink,
  websiteProductUrl,
} from '../src/features/catalog/links';
import { webUrlToAppPath } from '../src/navigation/deepLinks';
import { redirectSystemPath } from '../app/+native-intent';

test('store links resolve to app routes without trusting other origins', () => {
  expect(resolveStoreLink('/category/audio-boards')).toMatchObject({
    kind: 'app',
    path: '/products?category=audio-boards',
  });
  expect(resolveStoreLink('/product/board/')).toMatchObject({
    kind: 'app',
    path: '/products/board',
  });
  expect(resolveStoreLink('/about-us/')).toMatchObject({
    kind: 'app',
    path: '/legal/about-us',
  });
  expect(resolveStoreLink('/blog/some-post')).toMatchObject({
    kind: 'website',
  });
  expect(resolveStoreLink('https://evil.test/products')).toBeNull();
  expect(resolveStoreLink('javascript:alert(1)')).toBeNull();
  expect(resolveStoreLink('https://user:pass@elexify.online')).toBeNull();
});

test('website URLs map onto the matching app screens', () => {
  const cases: [string, string | null][] = [
    ['https://elexify.online/', '/'],
    ['https://elexify.online/product/esp32-board/', '/products/esp32-board'],
    [
      'https://www.elexify.online/product/esp32-board/?variation_id=v1&utm_source=wa',
      '/products/esp32-board?variation_id=v1',
    ],
    ['https://elexify.online/products/esp32-board', '/products/esp32-board'],
    [
      'https://elexify.online/products/?search_key=led&fbclid=x',
      '/products?search_key=led',
    ],
    ['https://elexify.online/category/sensors/', '/products?category=sensors'],
    [
      'https://elexify.online/product-category/sensors/?sort=price_asc',
      '/products?category=sensors&sort=price_asc',
    ],
    ['https://elexify.online/categories/', '/categories'],
    ['https://elexify.online/cart/', '/cart'],
    ['https://elexify.online/checkout/', '/cart'],
    ['https://elexify.online/checkout/success/?orderId=1', '/orders'],
    [
      'https://elexify.online/account/orders/66f1c2a9b8e4d3a1f0c9b7e2/',
      '/orders/66f1c2a9b8e4d3a1f0c9b7e2',
    ],
    ['https://elexify.online/account/orders/', '/orders'],
    ['https://elexify.online/track-order/', '/orders'],
    ['https://elexify.online/account/wishlist/', '/wishlist'],
    [
      'https://elexify.online/account/communication-preferences/',
      '/account/preferences',
    ],
    ['https://elexify.online/register/', '/login'],
    ['https://elexify.online/privacy-policy/', '/legal/privacy-policy'],
    ['https://elexify.online/page/shipping-policy/', '/legal/shipping-policy'],
    ['https://elexify.online/faq/', '/faq'],
    ['https://elexify.online/something-new/', null],
    ['https://evil.test/product/x/', null],
    ['ftp://elexify.online/product/x/', null],
  ];
  for (const [url, expected] of cases) {
    expect([url, webUrlToAppPath(url)]).toEqual([url, expected]);
  }
});

test('incoming system links: web URLs are mapped, app URLs pass through', () => {
  const run = (path: string) => redirectSystemPath({ path, initial: true });
  expect(run('https://elexify.online/product/esp32-board/')).toBe(
    '/products/esp32-board',
  );
  // Verified link to a page the app lacks: home, not a 404 screen.
  expect(run('https://elexify.online/something-new/')).toBe('/');
  expect(run('elexify://notifications')).toBe('elexify://notifications');
  const dev =
    'exp+elexify-mobile://expo-development-client/?url=http%3A%2F%2F192.168.0.223%3A8081';
  expect(run(dev)).toBe(dev);
});

test('product share URL is canonical, keeps variant and encodes the slug', () => {
  expect(websiteProductUrl({ slug: 'board/test', variationId: 'v&1' })).toBe(
    'https://elexify.online/product/board%2Ftest/?variation_id=v%261',
  );
});
