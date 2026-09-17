import { useQuery } from '@tanstack/react-query';
import { apiConfig } from '../../api/config';
import { fetchProducts } from '../../api/discovery';
import { useIdentity } from '../catalog/hooks';
// Recently viewed products are tracked locally (see stores/recentlyViewed) by id only;
// this re-fetches those ids so price, stock and wishlist state always stay current.
export function useRecentProducts(ids: string[]) {
  const identity = useIdentity();
  const key = ids.join(',');
  return useQuery({
    queryKey: ['recently-viewed-products', identity, key],
    queryFn: ({ signal }) =>
      fetchProducts({ ids: key, limit: Math.max(1, Math.min(24, ids.length)) }, 1, signal),
    enabled: !!apiConfig.baseUrl && ids.length > 0,
  });
}
