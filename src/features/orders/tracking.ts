import type { OrderDetail, OrderPackage } from '../../api/order';

// Mirrors the web storefront's per-package progress bar
// (elexify.online src/app/(main)/account/orders/[id]/page.tsx) — the same
// 4 stages, same status→label/color mapping, and the same fallback rule for
// when a step was reached (an explicit tracking_events entry for that
// status, else a matching timestamp field, else "reached because the
// package's current status is at or past this step").
export const PACKAGE_STEPS = ['packed', 'shipped', 'out_for_delivery', 'delivered'] as const;

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

export function packageStepDate(pkg: OrderPackage, step: string): string | null {
  const fromEvents = pkg.trackingEvents.find(event => event.status === step)?.occurredAt;
  if (fromEvents) return fromEvents;
  if (step === 'packed') return pkg.createdAt;
  if (step === 'shipped') return pkg.shippedAt;
  if (step === 'delivered') return pkg.deliveredAt;
  return null;
}

export function packageStepReached(pkg: OrderPackage, step: string): boolean {
  const currentIndex = PACKAGE_STEPS.indexOf(pkg.status as (typeof PACKAGE_STEPS)[number]);
  const stepIndex = PACKAGE_STEPS.indexOf(step as (typeof PACKAGE_STEPS)[number]);
  return !!packageStepDate(pkg, step) || currentIndex >= stepIndex;
}

// A cancelled/returned package never completed the normal fulfillment
// sequence, so the 4-stage progress bar doesn't apply to it.
export function showsPackageProgress(pkg: OrderPackage): boolean {
  return !['cancelled', 'returned'].includes(pkg.status);
}

// Mirrors the web storefront's canDownloadInvoice()
// (elexify.online src/core/lib/invoice.ts) — the backend
// (site/inventory/order/invoice.js) remains the real enforcer; this only
// controls whether the button is shown.
const INVOICE_ELIGIBLE_STATUSES = ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

export function canDownloadInvoice(order: Pick<OrderDetail, 'invoiceGenerated' | 'orderStatus'>): boolean {
  return order.invoiceGenerated || INVOICE_ELIGIBLE_STATUSES.includes(order.orderStatus);
}
