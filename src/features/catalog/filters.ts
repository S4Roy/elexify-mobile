import type { Params } from '../../api/discovery';
export const sorts = [
  { id: 'newest', label: 'Newest', field: 'created_at', order: -1 },
  { id: 'price_asc', label: 'Price: low to high', field: 'price', order: 1 },
  { id: 'price_desc', label: 'Price: high to low', field: 'price', order: -1 },
  { id: 'rating', label: 'Top rated', field: 'avg_rating', order: -1 },
] as const;
export type Filters = {
  categories: string[];
  min: string;
  max: string;
  bestseller: boolean;
};
export const emptyFilters = (): Filters => ({
  categories: [],
  min: '',
  max: '',
  bestseller: false,
});
export function priceError(filters: Filters): string | null {
  for (const value of [filters.min, filters.max]) {
    if (
      value.trim() &&
      (!/^\d+(\.\d{1,2})?$/.test(value.trim()) ||
        !Number.isFinite(Number(value)))
    ) {
      return 'Enter a valid, non-negative price (up to two decimals).';
    }
  }
  if (
    filters.min.trim() &&
    filters.max.trim() &&
    Number(filters.min) > Number(filters.max)
  ) {
    return 'Minimum price must not exceed maximum price.';
  }
  // The current backend tests price_max for truthiness; zero would be ignored.
  if (filters.max.trim() && Number(filters.max) === 0) {
    return 'Maximum price must be greater than zero.';
  }
  return null;
}
export function productParams(
  search: string,
  filters: Filters,
  sort: string,
  collection: Params = {},
): Params {
  const error = priceError(filters);
  if (error) {
    throw new Error(error);
  }
  const selected = sorts.find(s => s.id === sort) ?? sorts[0];
  const params: Params = {
    ...collection,
    limit: 12,
    sort_by: selected.field,
    sort_order: selected.order,
  };
  if (search.trim()) {
    params.search_key = search.trim();
  }
  if (filters.categories.length) {
    params.category = [...new Set(filters.categories)].join(',');
  }
  if (filters.min.trim()) {
    params.price_min = Number(filters.min);
  }
  if (filters.max.trim()) {
    params.price_max = Number(filters.max);
  }
  if (filters.bestseller) {
    params.is_bestseller = 'true';
  }
  return params;
}
export function uniqueProducts<T extends { key: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map(item => [item.key, item])).values());
}
