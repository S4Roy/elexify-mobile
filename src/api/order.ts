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
    ...(params.expectedTotal !== undefined
      ? { expected_total: params.expectedTotal }
      : {}),
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
  isPartialCod: boolean;
  grandTotal: number;
  totalItems: number;
  currency: string;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  /** First few line items (name, image, quantity) for the list card. */
  previews: OrderItemPreview[];
};

export type OrderItemPreview = {
  name: string;
  image: string | null;
  quantity: number;
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
    isPartialCod: o.is_partial_cod === true,
    grandTotal: number(o.grand_total) ?? 0,
    totalItems: number(o.total_items) ?? 0,
    currency: string(o.currency) || 'INR',
    createdAt: string(o.created_at),
    shippedAt: string(o.shipped_at) || null,
    deliveredAt: string(o.delivered_at) || null,
    cancelledAt: string(record(o.cancellation).cancelled_at) || null,
    previews: Array.isArray(o.item_previews)
      ? o.item_previews
          .map(p => {
            const i = record(p);
            return {
              name: string(i.name),
              image: string(i.image) || null,
              quantity: number(i.quantity) ?? 0,
            };
          })
          .filter(p => !!p.name)
      : [],
  };
}

// A pending razorpay (or partial-COD advance) order can be retried within a
// one-hour window from placement — mirrors elexify.online's
// account/orders/[id]/page.tsx handleRetryPayment/canRetryPayment.
export type PaymentRetry = {
  id: string;
  amount: number;
  currency: string;
  checkoutKeyId: string;
  orderNumber: string;
  expiresAt: string | null;
};

export async function retryOrderPayment(
  orderId: string,
): Promise<PaymentRetry> {
  const res = await api.post('site/inventory/order/retry-payment', {
    order_id: orderId,
  });
  const d = record(res.data?.data);
  return {
    id: string(d.id),
    amount: number(d.amount) ?? 0,
    currency: string(d.currency) || 'INR',
    checkoutKeyId: string(d.checkout_key_id),
    orderNumber: string(d.order_id),
    expiresAt: string(d.expires_at) || null,
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
    (d.hasNextPage !== false &&
      (totalPages !== null ? page < totalPages : false));
  return { items, nextPage: more && items.length > 0 ? page + 1 : undefined };
}

export type OrderItem = {
  id: string;
  name: string;
  image?: string;
  quantity: number;
  price: number | null;
  regularPrice: number | null;
  totalPrice: number | null;
  discountPercent: number | null;
};

export type PackageTrackingEvent = {
  status: string;
  occurredAt: string | null;
};

export type PackageLine = {
  orderItemId: string;
  quantity: number;
};

export type OrderPackage = {
  packageNumber: number;
  referenceId: string | null;
  status: string;
  shiprocketStatus: string | null;
  shiprocketStatusUpdatedAt: string | null;
  courierName: string | null;
  awb: string | null;
  etd: string | null;
  trackingUrl: string | null;
  itemCount: number;
  /** Which order items (and how many of each) went into this package. */
  items: PackageLine[];
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string | null;
  trackingEvents: PackageTrackingEvent[];
};

// Orders placed before the multi-package Package model existed carry their
// single shipment's tracking directly on the order — no `packages` entries.
export type LegacyTracking = {
  awb: string | null;
  courierName: string | null;
  etd: string | null;
  shiprocketStatus: string | null;
  shiprocketStatusUpdatedAt: string | null;
};

export type ReturnPolicy = {
  enabled: boolean;
  allowed: boolean;
  windowDays: number;
  requireImages: boolean;
  reasons: string[];
};

export type RefundStatus = 'processing' | 'processed' | 'failed';

/** Set once the order has been cancelled (by the customer or the store). */
export type CancellationRecord = {
  reason: string | null;
  comment: string | null;
  cancelledAt: string | null;
  cancelledBy: 'customer' | 'admin' | null;
};

/** Refund of a captured online payment / Partial COD advance; absent when
 * none was due (backend status "not_required"). */
export type RefundRecord = {
  status: RefundStatus;
  amount: number | null;
  initiatedAt: string | null;
  completedAt: string | null;
};

export type OrderDetail = OrderSummary & {
  items: OrderItem[];
  shipping: number | null;
  discount: number | null;
  codFee: number | null;
  advanceAmount: number | null;
  codDueAmount: number | null;
  note: string;
  cancellation: { allowed: boolean; reason: string | null };
  returns: ReturnPolicy;
  packages: OrderPackage[];
  legacyTracking: LegacyTracking | null;
  invoiceGenerated: boolean;
  cancelled: CancellationRecord | null;
  refund: RefundRecord | null;
};

export function parseCancellation(value: unknown): CancellationRecord | null {
  const c = record(value);
  const cancelledAt = string(c.cancelled_at) || null;
  if (!cancelledAt) {
    return null;
  }
  const by = string(c.cancelled_by);
  return {
    reason: string(c.reason) || null,
    comment: string(c.comment) || null,
    cancelledAt,
    cancelledBy: by === 'customer' || by === 'admin' ? by : null,
  };
}

export function parseRefund(value: unknown): RefundRecord | null {
  const r = record(value);
  const status = string(r.status);
  if (
    status !== 'processing' &&
    status !== 'processed' &&
    status !== 'failed'
  ) {
    return null;
  }
  return {
    status,
    amount: number(r.amount),
    initiatedAt: string(r.initiated_at) || string(r.attempted_at) || null,
    completedAt: string(r.completed_at) || null,
  };
}

function parseTrackingEvent(value: unknown): PackageTrackingEvent {
  const e = record(value);
  return {
    status: string(e.status),
    occurredAt: string(e.occurred_at) || null,
  };
}

export function parsePackage(value: unknown): OrderPackage | null {
  const p = record(value);
  const packageNumber = number(p.package_number);
  if (packageNumber === null || !string(p.status)) {
    return null;
  }
  const events = Array.isArray(p.tracking_events)
    ? p.tracking_events.map(parseTrackingEvent)
    : [];
  return {
    packageNumber,
    referenceId: string(p.reference_id) || null,
    status: string(p.status),
    shiprocketStatus: string(p.shiprocket_status) || null,
    shiprocketStatusUpdatedAt: string(p.shiprocket_status_updated_at) || null,
    courierName: string(p.courier_name) || null,
    awb: string(p.awb) || null,
    etd: string(p.etd) || null,
    trackingUrl: string(p.tracking_url) || null,
    itemCount: number(p.item_count) ?? 0,
    items: Array.isArray(p.items)
      ? p.items
          .map(line => {
            const l = record(line);
            return {
              orderItemId: string(l.order_item_id),
              quantity: number(l.quantity) ?? 0,
            };
          })
          .filter(line => !!line.orderItemId)
      : [],
    shippedAt: string(p.shipped_at) || null,
    deliveredAt: string(p.delivered_at) || null,
    createdAt: string(p.created_at) || null,
    trackingEvents: events,
  };
}

export const CANCELLATION_REASONS = [
  'Ordered by mistake',
  'Changed my mind',
  'Found a better price',
  'Delivery taking too long',
  'Incorrect address',
  'Need to change product/quantity',
  'Other',
] as const;

export type CancelResult = {
  orderStatus: string;
  paymentStatus: string;
  refund: RefundRecord | null;
};

export async function cancelOrder(params: {
  orderId: string;
  reason: string;
  comment?: string;
}): Promise<CancelResult> {
  const res = await api.post('site/inventory/order/cancel', {
    order_id: params.orderId,
    reason: params.reason,
    ...(params.comment ? { comment: params.comment } : {}),
  });
  const d = record(res.data?.data);
  return {
    orderStatus: string(d.order_status) || 'cancelled',
    paymentStatus: string(d.payment_status),
    refund: parseRefund(d.refund),
  };
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
  const rawItems = Array.isArray(o.order_items)
    ? o.order_items
    : Array.isArray(o.items)
    ? o.items
    : [];
  const items: OrderItem[] = rawItems.map(item => {
    const i = record(item);
    const product = record(i.product);
    const images = Array.isArray(product.images) ? product.images : [];
    const firstImage = record(images[0]);
    return {
      id: string(i._id),
      name: string(product.name) || string(i.display_name) || string(i.name),
      image: typeof firstImage.url === 'string' ? firstImage.url : undefined,
      quantity: number(i.quantity) ?? 0,
      // The order-item resource exposes unit_price (not price) — this was
      // previously reading a field that doesn't exist, so every item's
      // price (and any breakdown derived from it) silently showed blank.
      price: number(i.unit_price),
      regularPrice: number(i.regular_price),
      totalPrice: number(i.total_price),
      discountPercent: number(i.discount_percent),
    };
  });
  const capabilities = record(o.capabilities);
  const cancellation = record(capabilities.cancellation);
  const returnPolicy = record(capabilities.returns);
  const returnReasons = Array.isArray(returnPolicy.reasons)
    ? returnPolicy.reasons.filter((r): r is string => typeof r === 'string')
    : [];
  const packages = Array.isArray(o.packages)
    ? o.packages.map(parsePackage).filter((p): p is OrderPackage => p !== null)
    : [];
  const legacyAwb = string(o.awb);
  const legacyTracking: LegacyTracking | null =
    !packages.length && legacyAwb
      ? {
          awb: legacyAwb,
          courierName: string(o.courier_name) || null,
          etd: string(o.etd) || null,
          shiprocketStatus: string(o.shiprocket_status) || null,
          shiprocketStatusUpdatedAt:
            string(o.shiprocket_status_updated_at) || null,
        }
      : null;
  const invoice = record(o.invoice);
  return {
    ...summary,
    items,
    shipping: number(o.shipping),
    discount: number(o.discount),
    codFee: number(o.cod_fee),
    advanceAmount: number(o.advance_amount),
    codDueAmount: number(o.cod_due_amount),
    note: string(o.note),
    cancellation: {
      allowed: cancellation.allowed === true,
      reason: string(cancellation.reason) || null,
    },
    returns: {
      enabled: returnPolicy.enabled === true,
      allowed: returnPolicy.allowed === true,
      windowDays: number(returnPolicy.window_days) ?? 0,
      requireImages: returnPolicy.require_images === true,
      reasons: returnReasons,
    },
    packages,
    legacyTracking,
    invoiceGenerated: invoice.generated === true,
    cancelled: parseCancellation(o.cancellation),
    refund: parseRefund(o.refund),
  };
}

export async function fetchInvoicePdf(orderId: string): Promise<ArrayBuffer> {
  const res = await api.get('site/inventory/order/invoice', {
    params: { order_id: orderId },
    responseType: 'arraybuffer',
  });
  return res.data as ArrayBuffer;
}
