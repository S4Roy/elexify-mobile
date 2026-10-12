import { api } from './client';

// "Notify me when available" for out-of-stock products — backend
// routes/user/stockAlerts.js (signed-in customers only).
type Item = { productId: string; variationId?: string | null };

const params = ({ productId, variationId }: Item) => ({
  product_id: productId,
  ...(variationId ? { variation_id: variationId } : {}),
});

export async function fetchStockAlertStatus(item: Item, signal?: AbortSignal) {
  const res = await api.get('user/stock-alerts', { params: params(item), signal });
  return res.data?.data?.subscribed === true;
}

export async function subscribeStockAlert(item: Item) {
  await api.post('user/stock-alerts', params(item));
}

export async function unsubscribeStockAlert(item: Item) {
  await api.delete('user/stock-alerts', { params: params(item) });
}
