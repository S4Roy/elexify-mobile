// Maps elexify.online URLs onto the app's own routes, so a link shared from
// the website (WhatsApp, email, search results, an order email…) opens the
// matching screen. The website and app use different paths for the same
// thing — e.g. /product/<slug>/ vs /products/<slug>, /account/orders/<id>
// vs /orders/<id> — so every web path the app can show is listed here.
//
// Used by app/+native-intent.tsx for Android App Links / iOS Universal Links
// and by catalog/links.ts for store links inside CMS content.

export const WEB_HOSTS = ['elexify.online', 'www.elexify.online'];

const LEGAL_PAGES = [
  'about-us',
  'privacy-policy',
  'terms-conditions',
  'refund-cancellations-policy',
];

// Query keys each screen understands; anything else (utm_*, fbclid…) is
// dropped so tracking parameters never reach screen params.
// Matches what features/catalog/ProductListScreen reads.
const PRODUCT_LIST_KEYS = [
  'search_key',
  'category',
  'price_min',
  'price_max',
  'is_bestseller',
  'sort',
  'ids',
  'tags',
  'classifications',
  'is_featured',
  'title',
];

function withQuery(
  path: string,
  params: URLSearchParams,
  keys: string[],
): string {
  const kept = new URLSearchParams();
  for (const key of keys) {
    const value = params.get(key);
    if (value) {
      kept.set(key, value);
    }
  }
  const query = kept.toString();
  return query ? `${path}?${query}` : path;
}

const seg = (value: string) => encodeURIComponent(decodeURIComponent(value));

/**
 * App path for a website URL or path, or null when it isn't an elexify.online
 * link. Unknown pages on the site map to null too, so callers can fall back
 * to opening them in the browser.
 */
export function webUrlToAppPath(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input, 'https://elexify.online');
  } catch {
    return null;
  }
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    !WEB_HOSTS.includes(url.hostname) ||
    url.username ||
    url.password
  ) {
    return null;
  }
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const q = url.searchParams;
  let m: RegExpMatchArray | null;

  if (path === '/') {
    return '/';
  }
  // Products: canonical /product/<slug>/ and the legacy /products/<slug>.
  if ((m = path.match(/^\/products?\/([^/]+)$/))) {
    return withQuery(`/products/${seg(m[1])}`, q, ['variation_id']);
  }
  if (path === '/products') {
    return withQuery('/products', q, PRODUCT_LIST_KEYS);
  }
  if ((m = path.match(/^\/(?:product-)?category\/([^/]+)$/))) {
    const params = new URLSearchParams(q);
    params.set('category', decodeURIComponent(m[1]));
    return withQuery('/products', params, PRODUCT_LIST_KEYS);
  }
  if (path === '/categories') {
    return '/categories';
  }
  if (path === '/cart' || path === '/checkout') {
    // Never drop someone straight into payment from a link.
    return '/cart';
  }
  if ((m = path.match(/^\/account\/orders\/([^/]+)$/))) {
    return `/orders/${seg(m[1])}`;
  }
  if (path.startsWith('/checkout/') || path === '/track-order') {
    return '/orders';
  }
  const account: Record<string, string> = {
    '/account': '/account',
    '/account/orders': '/orders',
    '/account/wishlist': '/wishlist',
    '/account/profile': '/account/profile',
    '/account/security': '/account/security',
    '/account/addresses': '/addresses',
    '/account/recently-viewed': '/recently-viewed',
    '/account/communication-preferences': '/account/preferences',
    '/account/delete': '/account/delete',
  };
  if (account[path]) {
    return account[path];
  }
  if (['/login', '/register', '/forgot-password'].includes(path)) {
    return '/login';
  }
  if (['/compare', '/contact-us', '/faq'].includes(path)) {
    return path;
  }
  const slug = path.slice(1);
  if (LEGAL_PAGES.includes(slug)) {
    return `/legal/${slug}`;
  }
  if ((m = path.match(/^\/page\/([^/]+)$/))) {
    return `/legal/${seg(m[1])}`;
  }
  return null;
}
