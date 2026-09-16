import { Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import type { Product } from '../../api/discovery';
export function websiteProductUrl(
  product: Pick<Product, 'slug' | 'variationId'>,
) {
  return (
    'https://elexify.online/products/' +
    encodeURIComponent(product.slug) +
    (product.variationId
      ? '?variation_id=' + encodeURIComponent(product.variationId)
      : '')
  );
}
export function openWebsite(url: string) {
  Linking.openURL(url).catch(() =>
    Alert.alert('Unable to open the page', 'Please try again later.'),
  );
}
export function resolveStoreLink(
  value: string,
): {
  kind: 'products' | 'product' | 'category' | 'home' | 'website';
  url: string;
  category?: string;
  slug?: string;
  query?: Record<string, string>;
} | null {
  try {
    const url = new URL(value, 'https://elexify.online');
    if (
      url.protocol !== 'https:' ||
      !['elexify.online', 'www.elexify.online'].includes(url.hostname) ||
      url.username ||
      url.password
    ) {
      return null;
    }
    if (url.pathname === '/') {
      return { kind: 'home', url: url.toString() };
    }
    if (/^\/products\/?$/.test(url.pathname)) {
      return {
        kind: 'products',
        url: url.toString(),
        query: Object.fromEntries(url.searchParams),
      };
    }
    const productMatch = url.pathname.match(/^\/products\/([^/]+)\/?$/);
    if (productMatch) {
      const variationId = url.searchParams.get('variation_id');
      return {
        kind: 'product',
        slug: decodeURIComponent(productMatch[1]),
        url: url.toString(),
        query: variationId ? { variation_id: variationId } : undefined,
      };
    }
    const match = url.pathname.match(/^\/category\/([^/]+)\/?$/);
    if (match) {
      return {
        kind: 'category',
        category: decodeURIComponent(match[1]),
        url: url.toString(),
      };
    }
    return { kind: 'website', url: url.toString() };
  } catch {
    return null;
  }
}
export function openStoreLink(value: string) {
  const target = resolveStoreLink(value);
  if (!target) {
    return;
  }
  if (target.kind === 'products') {
    router.push({ pathname: '/products', params: target.query });
  } else if (target.kind === 'product') {
    router.push({
      pathname: '/products/[slug]',
      params: { slug: target.slug!, ...target.query },
    });
  } else if (target.kind === 'category') {
    router.push({
      pathname: '/products',
      params: { category: target.category },
    });
  } else if (target.kind === 'home') {
    router.push('/');
  } else {
    openWebsite(target.url);
  }
}
