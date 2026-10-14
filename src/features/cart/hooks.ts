import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiConfig } from '../../api/config';
import {
  applyCoupon,
  fetchCart,
  fetchReturnPolicy,
  manageCart,
} from '../../api/cart';
import { lookupPincode } from '../../api/address';
import type { CartSummary } from '../../api/cart';
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

export function useReturnPolicy() {
  return useQuery({
    queryKey: ['return-policy'],
    queryFn: ({ signal }) => fetchReturnPolicy(signal),
    enabled: !!apiConfig.baseUrl,
    staleTime: 10 * 60 * 1000,
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

/** A separate quote keeps guest previews out of the saved-address checkout flow. */
export function useCartDeliveryEstimate(
  postcode: string,
  cart: CartSummary | undefined,
  cartRefreshing: boolean,
) {
  const identity = useIdentity();
  const validPincode = /^[0-9]{6}$/.test(postcode);
  const location = useQuery({
    queryKey: ['cart-pincode', identity, postcode],
    queryFn: ({ signal }) => lookupPincode(postcode, signal),
    enabled: !!apiConfig.baseUrl && validPincode,
    staleTime: 60_000,
  });
  const fingerprint = JSON.stringify([
    cart?.subtotal,
    cart?.items.map(item => [
      item.id,
      item.quantity,
      item.price,
      item.stockQuantity,
    ]),
  ]);
  const quote = useQuery({
    queryKey: ['cart', identity, 'delivery-estimate', postcode, fingerprint],
    queryFn: ({ signal }) =>
      fetchCart(false, undefined, undefined, signal, postcode),
    enabled:
      !!apiConfig.baseUrl &&
      !!cart?.items.length &&
      !cartRefreshing &&
      validPincode &&
      location.data?.serviceable === true,
  });
  return {
    location,
    quote,
    estimate:
      !cartRefreshing &&
      !location.isFetching &&
      !location.isError &&
      !quote.isFetching &&
      !quote.isError &&
      location.data?.serviceable
        ? quote.data
        : undefined,
  };
}
