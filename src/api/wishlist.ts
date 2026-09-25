import { api } from './client';
import { Params, parsePage, parseProduct } from './discovery';

export async function fetchWishlist(
  params: Params = {},
  page = 1,
  signal?: AbortSignal,
) {
  const limit = Number(params.limit) || 12;
  const res = await api.get('site/inventory/product/wishlist', {
    params: { ...params, limit, page, currency: 'INR' },
    signal,
  });
  return parsePage(res.data?.data, parseProduct, page, limit);
}

export async function toggleWishlist(params: {
  productId: string;
  variationId?: string;
}): Promise<boolean> {
  const res = await api.put('site/inventory/product/wishlist/toggle', {
    product_id: params.productId,
    variation_id: params.variationId ?? null,
  });
  // Backend reports the resulting state alongside `data`.
  return res.data?.is_wishlisted === true;
}

/** Ensures the item ends up in the wishlist. The API only toggles, so if the
 * item was already saved the first call removes it — toggle back in that case. */
export async function addToWishlist(params: {
  productId: string;
  variationId?: string;
}): Promise<void> {
  const saved = await toggleWishlist(params);
  if (!saved) {
    await toggleWishlist(params);
  }
}
