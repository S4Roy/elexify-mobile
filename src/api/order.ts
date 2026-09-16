import { api, ApiError } from './client';
import { record, string } from './discovery';

const number = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

export type PaymentMethod = 'cod' | 'razorpay';

export type RazorpayOrder = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
};

export type PlacedOrder = {
  id: string;
  orderNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  grandTotal: number;
};

export type PlaceOrderResult = {
  order: PlacedOrder;
  razorpay?: RazorpayOrder;
};

function parsePlacedOrder(value: unknown): PlacedOrder {
  const o = record(value);
  const id = string(o._id);
  if (!id) {
    throw new ApiError('Unable to read the order confirmation.');
  }
  return {
    id,
    orderNumber: string(o.id) || id,
    paymentMethod: string(o.payment_method),
    paymentStatus: string(o.payment_status),
    orderStatus: string(o.order_status),
    grandTotal: number(o.grand_total) ?? 0,
  };
}

export async function placeOrder(params: {
  addressId: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  isDirectCheckout?: boolean;
  idempotencyKey: string;
  expectedTotal?: number;
}): Promise<PlaceOrderResult> {
  const res = await api.post('site/inventory/order/place', {
    address_id: params.addressId,
    payment_method: params.paymentMethod,
    currency: 'INR',
    ...(params.couponCode ? { coupon_code: params.couponCode } : {}),
    isDirectCheckout: params.isDirectCheckout ?? false,
    idempotency_key: params.idempotencyKey,
    ...(params.expectedTotal !== undefined ? { expected_total: params.expectedTotal } : {}),
  });
  const data = record(res.data?.data);
  const order = parsePlacedOrder(data.order);
  const provider = record(data.providerResponse);
  const razorpayData = record(provider.data);
  const razorpay =
    provider.provider === 'razorpay' && string(razorpayData.id)
      ? {
          keyId: string(razorpayData.checkout_key_id),
          orderId: string(razorpayData.id),
          amount: number(razorpayData.amount) ?? 0,
          currency: string(razorpayData.currency) || 'INR',
        }
      : undefined;
  return { order, razorpay };
}

export async function verifyPayment(params: {
  orderNumber: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}): Promise<PlacedOrder> {
  const res = await api.post('site/inventory/order/verify-payment', {
    order_id: params.orderNumber,
    razorpay_payment_id: params.razorpayPaymentId,
    razorpay_order_id: params.razorpayOrderId,
    razorpay_signature: params.razorpaySignature,
  });
  const data = record(res.data?.data);
  return parsePlacedOrder(data.order);
}

export type OrderSummary = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  grandTotal: number;
  totalItems: number;
  currency: string;
  createdAt: string;
};

function parseOrderSummary(value: unknown): OrderSummary | null {
  const o = record(value);
  const id = string(o._id);
  if (!id) {
    return null;
  }
  return {
    id,
    orderNumber: string(o.id) || id,
    orderStatus: string(o.order_status),
    paymentStatus: string(o.payment_status),
    paymentMethod: string(o.payment_method),
    grandTotal: number(o.grand_total) ?? 0,
    totalItems: number(o.total_items) ?? 0,
    currency: string(o.currency) || 'INR',
    createdAt: string(o.created_at),
  };
}

export async function fetchOrders(page = 1, signal?: AbortSignal) {
  const res = await api.get('site/inventory/order/list', {
    params: { page, limit: 20 },
    signal,
  });
  const d = record(res.data?.data);
  const docs = Array.isArray(d.docs) ? d.docs : [];
  const items: OrderSummary[] = [];
  for (const doc of docs) {
    const order = parseOrderSummary(doc);
    if (order) {
      items.push(order);
    }
  }
  const totalPages = number(d.totalPages);
  const more =
    d.hasNextPage === true ||
    (d.hasNextPage !== false && (totalPages !== null ? page < totalPages : false));
  return { items, nextPage: more && items.length > 0 ? page + 1 : undefined };
}

export type OrderItem = {
  id: string;
  name: string;
  image?: string;
  quantity: number;
  price: number | null;
};
export type OrderDetail = OrderSummary & {
  items: OrderItem[];
  shipping: number | null;
  discount: number | null;
  codFee: number | null;
  note: string;
  cancellation: { allowed: boolean; reason: string | null };
};

export const CANCELLATION_REASONS = [
  'Ordered by mistake',
  'Changed my mind',
  'Found a better price',
  'Delivery taking too long',
  'Incorrect address',
  'Need to change product/quantity',
  'Other',
] as const;

export async function cancelOrder(params: {
  orderId: string;
  reason: string;
  comment?: string;
}): Promise<void> {
  await api.post('site/inventory/order/cancel', {
    order_id: params.orderId,
    reason: params.reason,
    ...(params.comment ? { comment: params.comment } : {}),
  });
}

export async function fetchOrderDetail(
  id: string,
  signal?: AbortSignal,
): Promise<OrderDetail | null> {
  const res = await api.get('site/inventory/order/list', {
    params: { _id: id },
    signal,
  });
  const o = record(res.data?.data);
  const summary = parseOrderSummary(o);
  if (!summary) {
    return null;
  }
  const rawItems = Array.isArray(o.order_items) ? o.order_items : Array.isArray(o.items) ? o.items : [];
  const items: OrderItem[] = rawItems.map(item => {
    const i = record(item);
    const product = record(i.product);
    const images = Array.isArray(product.images) ? product.images : [];
    const firstImage = record(images[0]);
    return {
      id: string(i._id),
      name: string(product.name) || string(i.name),
      image: typeof firstImage.url === 'string' ? firstImage.url : undefined,
      quantity: number(i.quantity) ?? 0,
      price: number(i.price),
    };
  });
  const capabilities = record(o.capabilities);
  const cancellation = record(capabilities.cancellation);
  return {
    ...summary,
    items,
    shipping: number(o.shipping),
    discount: number(o.discount),
    codFee: number(o.cod_fee),
    note: string(o.note),
    cancellation: {
      allowed: cancellation.allowed === true,
      reason: string(cancellation.reason) || null,
    },
  };
}
