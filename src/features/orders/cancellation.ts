import type { CancelResult, OrderDetail, RefundRecord } from '../../api/order';

// Copy and rules for customer cancellation, mirroring elexify.online's
// CancelOrderModal and account/orders/[id]/page.tsx handleCancelConfirm. The
// backend (orderService/cancelOrder.js) stays the real enforcer: it decides
// eligibility (capabilities.cancellation) and whether a refund is due.

type PaymentFacts = Pick<
  OrderDetail,
  'paymentMethod' | 'paymentStatus' | 'isPartialCod'
>;

/** Money was actually captured online, so cancelling triggers a refund — a
 * paid prepaid order, or a Partial COD order whose advance cleared. */
export const hasCapturedOnlinePayment = (order: PaymentFacts) =>
  (order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid') ||
  (order.paymentMethod === 'cod' && order.paymentStatus === 'advance_paid');

/** What happens if the customer goes ahead — shown before they confirm. */
export function cancellationImpact(order: PaymentFacts): string {
  if (hasCapturedOnlinePayment(order)) {
    return order.isPartialCod
      ? 'The advance you paid will be refunded to your original payment method, usually within 5–7 working days.'
      : 'Your payment will be refunded to your original payment method, usually within 5–7 working days.';
  }
  if (order.paymentMethod === 'cod') {
    return "You haven't been charged for this Cash on Delivery order, so there's nothing to refund.";
  }
  return "No payment was taken for this order, so there's nothing to refund.";
}

/** Confirmation after a successful cancel, based on the refund outcome. */
export function cancellationOutcome(
  before: PaymentFacts,
  result: CancelResult,
): { tone: 'success' | 'warning'; message: string } {
  if (!hasCapturedOnlinePayment(before) && !result.refund) {
    return { tone: 'success', message: 'Your order has been cancelled.' };
  }
  if (result.refund?.status === 'failed') {
    return {
      tone: 'warning',
      message:
        "Your order has been cancelled. We couldn't start your refund automatically — our team will process it manually.",
    };
  }
  return {
    tone: 'success',
    message:
      'Your order has been cancelled and your refund has been initiated.',
  };
}

export type RefundStep = {
  key: string;
  label: string;
  at: string | null;
  state: 'done' | 'current' | 'failed';
};

/** Refund progress for a cancelled order: initiated → completed / failed. */
export function refundSteps(refund: RefundRecord): RefundStep[] {
  const initiated: RefundStep = {
    key: 'initiated',
    label: 'Refund initiated',
    at: refund.initiatedAt,
    state: 'done',
  };
  if (refund.status === 'failed') {
    return [
      { ...initiated, label: 'Refund attempted' },
      {
        key: 'final',
        label: 'Refund needs manual processing',
        at: null,
        state: 'failed',
      },
    ];
  }
  if (refund.status === 'processed') {
    return [
      initiated,
      {
        key: 'final',
        label: 'Refund completed',
        at: refund.completedAt,
        state: 'done',
      },
    ];
  }
  return [
    initiated,
    { key: 'final', label: 'Refund in progress', at: null, state: 'current' },
  ];
}
