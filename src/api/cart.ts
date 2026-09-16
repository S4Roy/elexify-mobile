import { api } from './client';
import { imageUrl, record, string } from './discovery';

const number = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

export type CartItem = {
  id: string;
  productId: string;
  variationId?: string;
  slug: string;
  name: string;
  image?: string;
  quantity: number;
  price: number | null;
  regularPrice: number | null;
  discountPercent: number | null;
  totalPrice: number | null;
  stockQuantity: number | null;
};

export type CodEligibility = {
  eligible: boolean;
  fee: number;
  reason: string | null;
};

export type CartSummary = {
  items: CartItem[];
  subtotal: number;
  mrpSubtotal: number;
  productDiscount: number;
  quantityDiscount: number;
  totalDiscount: number;
  currency: string;
  shippingAmount: number | null;
  cod: CodEligibility | null;
};

function parseCartItem(value: unknown): CartItem | null {
  const d = record(value);
  const cart = record(d.cart);
  const product = record(d.product);
  const variation = record(d.variation);
  const id = string(cart._id);
  const productId = string(product._id);
  if (!id || !productId) {
    return null;
  }
  const variationId = string(variation._id) || undefined;
  const images = Array.isArray(d.images) ? d.images : [];
  return {
    id,
    productId,
    variationId,
    slug: string(product.slug),
    name: string(product.name),
    image: imageUrl(images[0]),
    quantity: number(cart.quantity) ?? 0,
    price: number(cart.price),
    regularPrice: number(cart.regular_price),
    discountPercent: number(cart.discount_percent),
    totalPrice: number(d.total_price),
    // Live stock, keyed off the variation when the item has one.
    stockQuantity: variationId
      ? number(variation.stock_quantity)
      : number(product.stock_quantity),
  };
}

export function parseCartSummary(value: unknown): CartSummary {
  const d = record(value);
  const docs = Array.isArray(d.docs) ? d.docs : [];
  const items: CartItem[] = [];
  for (const doc of docs) {
    const item = parseCartItem(doc);
    if (item) {
      items.push(item);
    }
  }
  const shipping = record(d.shipping);
  const cod = record(d.cod);
  return {
    items,
    // net_product_amount and subtotal are always equal; fall back defensively either way.
    subtotal: number(d.net_product_amount) ?? number(d.subtotal) ?? 0,
    mrpSubtotal: number(d.mrp_subtotal) ?? 0,
    productDiscount: number(d.product_discount) ?? 0,
    quantityDiscount: number(d.quantity_discount) ?? 0,
    totalDiscount: number(d.total_discount) ?? 0,
    currency: string(d.currency) || 'INR',
    shippingAmount: d.shipping ? number(shipping.amount) : null,
    cod: d.cod
      ? { eligible: cod.eligible === true, fee: number(cod.fee) ?? 0, reason: string(cod.reason) || null }
      : null,
  };
}

export async function fetchCart(
  direct = false,
  addressId?: string,
  signal?: AbortSignal,
): Promise<CartSummary> {
  const path = direct
    ? 'site/inventory/product/temp-carts'
    : 'site/inventory/product/carts';
  const res = await api.get(path, {
    params: { currency: 'INR', ...(addressId ? { address_id: addressId } : {}) },
    signal,
  });
  return parseCartSummary(res.data?.data);
}

export async function manageCart(
  params: { productId: string; variationId?: string; quantity: number },
  direct = false,
): Promise<void> {
  const path = direct
    ? 'site/inventory/product/temp-cart/manage'
    : 'site/inventory/product/cart/manage';
  await api.put(path, {
    product_id: params.productId,
    ...(params.variationId ? { variation_id: params.variationId } : {}),
    quantity: params.quantity,
  });
}

export type CouponResult = {
  discount: number;
  subtotal: number;
  total: number;
};
export async function applyCoupon(code: string): Promise<CouponResult> {
  const res = await api.post('site/inventory/product/cart/apply-coupon', {
    code,
    currency: 'INR',
  });
  const d = record(res.data?.data);
  return {
    discount: number(d.discount) ?? 0,
    subtotal: number(d.subtotal) ?? 0,
    total: number(d.total) ?? 0,
  };
}
