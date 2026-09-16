import { api, ApiError } from './client';
export type Params = Record<string, string | number>;
export type Product = {
  id: string;
  key: string;
  slug: string;
  variationId?: string;
  name: string;
  category: string;
  image?: string;
  price: number | null;
  regularPrice: number | null;
  rating: number | null;
  inStock: boolean;
  inWishlist: boolean;
};
export type Category = {
  id: string;
  slug: string;
  name: string;
  image?: string;
  hasChildren: boolean;
};
export type Page<T> = { items: T[]; nextPage?: number; total: number };
export type HomeSection = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  config: Record<string, unknown>;
};
export const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
export const string = (v: unknown) => (typeof v === 'string' ? v : '');
const number = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;
export function imageUrl(value: unknown): string | undefined {
  const url = string(value) || string(record(value).url);
  return /^https?:\/\//i.test(url) ? url : undefined;
}
export function parseProduct(value: unknown): Product {
  const p = record(value);
  if (!string(p._id) || !string(p.name) || !string(p.slug)) {
    throw new ApiError('Unable to read product information.');
  }
  const categories = Array.isArray(p.categories) ? p.categories : [];
  const images = Array.isArray(p.images) ? p.images : [];
  const variationId = string(p.variation_id) || undefined;
  return {
    id: string(p._id),
    key: string(p._id) + ':' + (variationId ?? ''),
    variationId,
    slug: string(p.slug),
    name: string(p.name),
    category:
      string(record(categories[0]).name) || string(record(p.category).name),
    image: imageUrl(images[0]) || imageUrl(p.image),
    price: number(p.converted_price),
    regularPrice: number(p.converted_regular_price),
    rating: number(p.avg_rating),
    inStock:
      p.in_stock !== false &&
      p.stock_quantity !== 0 &&
      !['out_of_stock', 'outofstock'].includes(string(p.stock_status)),
    inWishlist: !!p.wishlist,
  };
}
export function parseCategory(value: unknown): Category {
  const c = record(value);
  if (!string(c._id) || !string(c.slug) || !string(c.name)) {
    throw new ApiError('Unable to read category information.');
  }
  return {
    id: string(c._id),
    slug: string(c.slug),
    name: string(c.name),
    image: imageUrl(c.image),
    hasChildren:
      c.has_children === true ||
      Number(c.has_children) > 0 ||
      Number(c.child_count) > 0,
  };
}
export function parsePage<T>(
  value: unknown,
  parse: (v: unknown) => T,
  requestedPage: number,
  limit: number,
): Page<T> {
  const data = record(value);
  if (!Array.isArray(data.docs)) {
    throw new ApiError('The store response could not be read.');
  }
  const items = data.docs.map(parse);
  const total = number(data.totalDocs) ?? items.length;
  const totalPages = number(data.totalPages);
  const more =
    data.hasNextPage === true ||
    (data.hasNextPage !== false &&
      (totalPages !== null
        ? requestedPage < totalPages
        : items.length === limit));
  return {
    items,
    total,
    nextPage: more && items.length > 0 ? requestedPage + 1 : undefined,
  };
}
export async function fetchProducts(
  params: Params = {},
  page = 1,
  signal?: AbortSignal,
) {
  const limit = Number(params.limit) || 12;
  const res = await api.get('site/inventory/product/list', {
    params: { ...params, limit, page, currency: 'INR' },
    signal,
  });
  return parsePage(res.data?.data, parseProduct, page, limit);
}
export async function fetchCategories(
  params: Params = {},
  page = 1,
  signal?: AbortSignal,
) {
  const limit = Number(params.limit) || 24;
  const res = await api.get('site/inventory/category/list', {
    params: { ...params, limit, page },
    signal,
  });
  return parsePage(res.data?.data, parseCategory, page, limit);
}
export function parseHome(value: unknown): HomeSection[] {
  const data = record(value);
  if (!Array.isArray(data.sections)) {
    throw new ApiError('Unable to read the home collection.');
  }
  return data.sections
    .map(record)
    .filter(s => s.enabled !== false)
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
    .map(s => ({
      id: string(s._id),
      type: string(s.type),
      title: string(s.title),
      subtitle: string(s.subtitle),
      config: record(s.config),
    }))
    .filter(
      s =>
        s.id &&
        [
          'hero',
          'product_section',
          'category_section',
          'trust_badges',
          'cta_banner',
          'content_section',
        ].includes(s.type),
    );
}
export async function fetchHome(signal?: AbortSignal) {
  const res = await api.get('site/cms/home', { signal });
  return parseHome(res.data?.data);
}
// CMS queries are data, not arbitrary request configuration. Match backend allowlists.
export function resolvedQuery(
  value: unknown,
  kind: 'product' | 'category',
): Params {
  const allowed =
    kind === 'product'
      ? [
          'ids',
          'category',
          'sort_by',
          'sort_order',
          'is_featured',
          'is_bestseller',
          'tags',
          'classifications',
          'exclude',
          'price_min',
          'price_max',
        ]
      : [
          'ids',
          'featured',
          'type',
          'parent_category_slug',
          'sort_by',
          'sort_order',
        ];
  const result: Params = {};
  for (const [key, val] of Object.entries(record(value))) {
    if (
      allowed.includes(key) &&
      (typeof val === 'string' || typeof val === 'number')
    ) {
      result[key] = val;
    }
  }
  result.limit = Math.min(24, Math.max(1, Number(record(value).limit) || 8));
  return result;
}
