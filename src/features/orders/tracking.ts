import type { OrderDetail, OrderPackage } from '../../api/order';

// Mirrors the web storefront's per-package progress bar
// (elexify.online src/app/(main)/account/orders/[id]/page.tsx) — the same
// 4 stages, same status→label/color mapping, and the same fallback rule for
// when a step was reached (an explicit tracking_events entry for that
// status, else a matching timestamp field, else "reached because the
// package's current status is at or past this step").
export const PACKAGE_STEPS = [
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
] as const;

export const PACKAGE_STATUS_LABELS: Record<string, string> = {
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return_requested: 'Return Requested',
  returned: 'Returned',
  failed: 'Preparing',
};

export function packageStepDate(
  pkg: OrderPackage,
  step: string,
): string | null {
  const fromEvents = pkg.trackingEvents.find(
    event => event.status === step,
  )?.occurredAt;
  if (fromEvents) return fromEvents;
  if (step === 'packed') return pkg.createdAt;
  if (step === 'shipped') return pkg.shippedAt;
  if (step === 'delivered') return pkg.deliveredAt;
  return null;
}

export function packageStepReached(pkg: OrderPackage, step: string): boolean {
  const currentIndex = PACKAGE_STEPS.indexOf(
    pkg.status as (typeof PACKAGE_STEPS)[number],
  );
  const stepIndex = PACKAGE_STEPS.indexOf(
    step as (typeof PACKAGE_STEPS)[number],
  );
  return !!packageStepDate(pkg, step) || currentIndex >= stepIndex;
}

// A cancelled/returned package never completed the normal fulfillment
// sequence, so the 4-stage progress bar doesn't apply to it.
export function showsPackageProgress(pkg: OrderPackage): boolean {
  return !['cancelled', 'returned'].includes(pkg.status);
}

export const orderStatusLabel = (status: string) =>
  status
    ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
    : 'Pending';

// Mirrors elexify.online's STATUS_STYLES (account/orders/page.tsx and
// account/orders/[id]/page.tsx) so a given order status reads with the same
// color language on both platforms.
const ORDER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF9C3', text: '#A16207' },
  confirmed: { bg: '#DBEAFE', text: '#1D4ED8' },
  processing: { bg: '#DBEAFE', text: '#1D4ED8' },
  packed: { bg: '#DBEAFE', text: '#1D4ED8' },
  partially_shipped: { bg: '#E0F2FE', text: '#0369A1' },
  shipped: { bg: '#E0E7FF', text: '#4338CA' },
  out_for_delivery: { bg: '#E0E7FF', text: '#4338CA' },
  partially_delivered: { bg: '#CFFAFE', text: '#0E7490' },
  delivered: { bg: '#DCFCE7', text: '#15803D' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
  return_requested: { bg: '#F3F4F6', text: '#4B5563' },
  returned: { bg: '#F3F4F6', text: '#4B5563' },
};
export const orderStatusColor = (status: string) =>
  ORDER_STATUS_COLORS[status.toLowerCase()] ?? {
    bg: '#F3F4F6',
    text: '#4B5563',
  };

// Mirrors elexify.online's PAYMENT_STATUS_STYLES.
const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  paid: { bg: '#DCFCE7', text: '#15803D' },
  advance_paid: { bg: '#DBEAFE', text: '#1D4ED8' },
  pending: { bg: '#FEF9C3', text: '#A16207' },
  failed: { bg: '#FEE2E2', text: '#DC2626' },
  refund_pending: { bg: '#FEF9C3', text: '#A16207' },
  partially_refunded: { bg: '#FEF9C3', text: '#A16207' },
  refunded: { bg: '#DCFCE7', text: '#15803D' },
  refund_failed: { bg: '#FEE2E2', text: '#DC2626' },
};
export const paymentStatusColor = (status: string) =>
  PAYMENT_STATUS_COLORS[status.toLowerCase()] ?? {
    bg: '#F3F4F6',
    text: '#4B5563',
  };

// Mirrors the web storefront's canDownloadInvoice()
// (elexify.online src/core/lib/invoice.ts) — the backend
// (site/inventory/order/invoice.js) remains the real enforcer; this only
// controls whether the button is shown.
const INVOICE_ELIGIBLE_STATUSES = [
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
];

export function canDownloadInvoice(
  order: Pick<OrderDetail, 'invoiceGenerated' | 'orderStatus'>,
): boolean {
  return (
    order.invoiceGenerated ||
    INVOICE_ELIGIBLE_STATUSES.includes(order.orderStatus)
  );
}
