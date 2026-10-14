import { api } from './client';
import { record, string } from './discovery';
const number = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
export type BuyAgainItem = {
  id: string;
  name: string;
  variationName: string;
  originalQuantity: number;
  eligible: boolean;
  reason: string;
  maxQuantity: number;
  existingQuantity: number;
  basePrice: number;
  tiers: { minQuantity: number; discountPercent: number }[];
};
export type BuyAgainResult = {
  id: string;
  added: boolean;
  quantity: number;
  unitPrice: number;
  reason: string;
};
export async function fetchBuyAgain(
  orderId: string,
  signal?: AbortSignal,
): Promise<BuyAgainItem[]> {
  const response = await api.get('site/inventory/order/buy-again', {
    params: { order_id: orderId },
    signal,
  });
  const data = record(response.data?.data);
  return (Array.isArray(data.items) ? data.items : [])
    .map(value => {
      const item = record(value);
      const maxQuantity = number(item.max_quantity);
      return {
        id: string(item.order_item_id),
        name: string(item.name),
        variationName: string(item.variation_name),
        originalQuantity: number(item.original_quantity, 1),
        eligible: item.eligible === true && maxQuantity >= 1,
        reason: string(item.reason),
        maxQuantity,
        existingQuantity: number(item.existing_quantity),
        basePrice: number(item.base_price),
        tiers: (Array.isArray(item.quantity_discounts)
          ? item.quantity_discounts
          : []
        ).map(value => {
          const tier = record(value);
          return {
            minQuantity: number(tier.min_quantity),
            discountPercent: number(tier.discount_percent),
          };
        }),
      };
    })
    .filter(item => !!item.id);
}
export async function addBuyAgain(
  orderId: string,
  items: { id: string; quantity: number }[],
): Promise<BuyAgainResult[]> {
  const response = await api.post('site/inventory/order/buy-again', {
    order_id: orderId,
    items: items.map(item => ({
      order_item_id: item.id,
      quantity: item.quantity,
    })),
  });
  const data = record(response.data?.data);
  return (Array.isArray(data.results) ? data.results : [])
    .map(value => {
      const result = record(value);
      return {
        id: string(result.order_item_id),
        added: result.added === true,
        quantity: number(result.added_quantity),
        unitPrice: number(result.unit_price),
        reason: string(result.reason),
      };
    })
    .filter(result => !!result.id);
}
export function buyAgainUnitPrice(item: BuyAgainItem, quantity: number) {
  const tier = [...item.tiers]
    .filter(tier => item.existingQuantity + quantity >= tier.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)[0];
  return Number(
    (item.basePrice * (1 - (tier?.discountPercent ?? 0) / 100)).toFixed(2),
  );
}
