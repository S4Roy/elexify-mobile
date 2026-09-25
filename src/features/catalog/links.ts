import { Alert, Linking } from 'react-native';
import { router, type Href } from 'expo-router';
import { WEB_HOSTS, webUrlToAppPath } from '../../navigation/deepLinks';
import type { Product } from '../../api/discovery';
// Canonical product route is singular ("/product/<slug>/"); the legacy
// plural "/products/<slug>" still works but now costs an extra 301 hop.
export function websiteProductUrl(
  product: Pick<Product, 'slug' | 'variationId'>,
) {
  return (
    'https://elexify.online/product/' +
    encodeURIComponent(product.slug) +
    '/' +
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
/** In-app destination for an elexify.online link (CMS banners, rich text),
 * or null for anything that isn't a store link. */
export function resolveStoreLink(
  value: string,
): { kind: 'app' | 'website'; url: string; path?: string } | null {
  try {
    const url = new URL(value, 'https://elexify.online');
    if (
      url.protocol !== 'https:' ||
      !WEB_HOSTS.includes(url.hostname) ||
      url.username ||
      url.password
    ) {
      return null;
    }
    const path = webUrlToAppPath(url.toString());
    return path
      ? { kind: 'app', url: url.toString(), path }
      : { kind: 'website', url: url.toString() };
  } catch {
    return null;
  }
}
export function openStoreLink(value: string) {
  const target = resolveStoreLink(value);
  if (!target) {
    return;
  }
  if (target.kind === 'app') {
    router.push(target.path as Href);
  } else {
    openWebsite(target.url);
  }
}
