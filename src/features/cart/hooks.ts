import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiConfig } from '../../api/config';
import { applyCoupon, fetchCart, manageCart } from '../../api/cart';
import { useIdentity } from '../catalog/hooks';

export function useCart(addressId?: string) {
  const identity = useIdentity();
  return useQuery({
    queryKey: ['cart', identity, addressId ?? ''],
    queryFn: ({ signal }) => fetchCart(false, addressId, signal),
    enabled: !!apiConfig.baseUrl,
  });
}

export function useCartMutation() {
  const identity = useIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      productId: string;
      variationId?: string;
      quantity: number;
    }) => manageCart(params, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', identity] }).catch(() => undefined);
    },
  });
}

export function useApplyCoupon() {
  return useMutation({ mutationFn: (code: string) => applyCoupon(code) });
}
