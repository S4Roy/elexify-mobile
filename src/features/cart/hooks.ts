import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiConfig } from '../../api/config';
import { applyCoupon, fetchCart, manageCart } from '../../api/cart';
import { addToWishlist } from '../../api/wishlist';
import { useIdentity } from '../catalog/hooks';

export function useCart(
  addressId?: string,
  paymentMethod?: 'cod' | 'razorpay',
  direct = false,
) {
  const identity = useIdentity();
  return useQuery({
    queryKey: ['cart', identity, direct, addressId ?? '', paymentMethod ?? ''],
    queryFn: ({ signal }) =>
      fetchCart(direct, addressId, paymentMethod, signal),
    enabled: !!apiConfig.baseUrl,
    // addressId/paymentMethod are part of the key (pricing depends on both),
    // so switching either would otherwise blank the screen until the refetch
    // resolves — keep the last totals on screen while the new ones load.
    placeholderData: keepPreviousData,
  });
}

export function useCartMutation(direct = false) {
  const identity = useIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      productId: string;
      variationId?: string;
      quantity: number;
    }) => manageCart(params, direct),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: ['cart', identity] })
        .catch(() => undefined);
    },
  });
}

/** Moves a cart line to the wishlist ("Save for later"), then drops it from
 * the cart. Never un-saves an item that was already in the wishlist. */
export function useSaveForLater() {
  const identity = useIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { productId: string; variationId?: string }) => {
      await addToWishlist(params);
      await manageCart({ ...params, quantity: 0 }, false);
    },
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: ['cart', identity] })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({ queryKey: ['wishlist', identity] })
        .catch(() => undefined);
    },
  });
}

export function useApplyCoupon(direct = false) {
  return useMutation({
    mutationFn: (code: string) => applyCoupon(code, direct),
  });
}
