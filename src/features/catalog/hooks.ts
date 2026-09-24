import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { apiConfig } from '../../api/config';
import { fetchCategories, fetchProducts, Params } from '../../api/discovery';
import { useSession } from '../../stores/session';
export function useIdentity() {
  return useSession(s => s.status + ':' + (s.guestId ?? ''));
}
export function useProducts(params: Params, enabled = true) {
  const identity = useIdentity();
  return useInfiniteQuery({
    queryKey: ['products', identity, params],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchProducts(params, pageParam, signal),
    getNextPageParam: page => page.nextPage,
    enabled: enabled && !!apiConfig.baseUrl,
    // params (search term/filters/sort) change on every keystroke or filter
    // tap, which is a new query key each time — without this the grid would
    // blank out and reflow on every change instead of updating in place.
    placeholderData: keepPreviousData,
  });
}
export function useCategories(params: Params, enabled = true) {
  const identity = useIdentity();
  return useInfiniteQuery({
    queryKey: ['categories', identity, params],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchCategories(params, pageParam, signal),
    getNextPageParam: page => page.nextPage,
    enabled: enabled && !!apiConfig.baseUrl,
  });
}
