import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiConfig } from '../../api/config';
import { Params } from '../../api/discovery';
import { fetchWishlist, toggleWishlist } from '../../api/wishlist';
import { useIdentity } from '../catalog/hooks';

export function useWishlist(params: Params = {}) {
  const identity = useIdentity();
  return useInfiniteQuery({
    queryKey: ['wishlist', identity, params],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchWishlist(params, pageParam, signal),
    getNextPageParam: page => page.nextPage,
    enabled: !!apiConfig.baseUrl,
  });
}

export function useToggleWishlist() {
  const identity = useIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { productId: string; variationId?: string }) =>
      toggleWishlist(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', identity] }).catch(() => undefined);
    },
  });
}
