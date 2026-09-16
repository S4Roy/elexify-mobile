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
}): Promise<void> {
  await api.put('site/inventory/product/wishlist/toggle', {
    product_id: params.productId,
    variation_id: params.variationId ?? null,
  });
}
