// Backend/Razorpay error strings are written for logs/support, not
// customers — mirrors the web storefront's checkout/[status] mapping table
// (elexify.online src/app/(main)/checkout/[status]/page.tsx) so the same
// raw reason always produces the same customer-facing message on both
// platforms.
const FRIENDLY_REASONS: Array<{ match: RegExp; friendly: string }> = [
  {
    match: /idempotency key/i,
    friendly: 'Your checkout details changed. Please review them before placing a new order.',
  },
  {
    match: /insufficient stock|out of stock/i,
    friendly: 'One or more items in your order just sold out.',
  },
  {
    match: /stock|price (has )?changed/i,
    friendly: 'Some prices or stock changed since you started checkout. Please review your cart and try again.',
  },
  { match: /coupon/i, friendly: 'Your coupon could no longer be applied to this order.' },
  {
    match: /insufficient balance|declined|do not honour|card/i,
    friendly: 'Your bank or card issuer declined this payment.',
  },
];

export function friendlyReason(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const hit = FRIENDLY_REASONS.find(({ match }) => match.test(raw));
  return hit?.friendly ?? 'Please try again, or contact support with the details below.';
}

// The native Razorpay SDK uses error code 0 for "user closed the checkout
// sheet" consistently across Android/iOS — everything else is a genuine
// gateway/network failure. Falls back to matching the description in case a
// platform/SDK version ever omits the code.
export function isRazorpayCancelled(error: { code?: number; description?: string } | null | undefined): boolean {
  if (!error) return false;
  return error.code === 0 || /cancel/i.test(error.description || '');
}

// Order placement rejections (elexify-backend site/inventory/order/add.js)
// carry machine codes or support wording — e.g. a bare "OUT_OF_STOCK" or
// "CHECKOUT_TOTAL_CHANGED: total updated from …" — so translate them before
// they reach the checkout banner.
const CHECKOUT_ERRORS: Array<{ match: RegExp; friendly: string }> = [
  {
    match: /OUT_OF_STOCK|insufficient stock|out of stock/i,
    friendly: 'One or more items in your cart just sold out. Please review your cart and try again.',
  },
  {
    match: /idempotency key was already used/i,
    friendly: 'Your checkout details changed. Please review them and place your order again.',
  },
  {
    match: /already being placed|reconciliation is pending|temporarily conflicted/i,
    friendly: "Your order is still being processed. Please wait a few seconds and try again — you won't be charged twice.",
  },
  {
    match: /PARTIAL_COD_CONSENT_(CHANGED|REQUIRED)/,
    friendly: 'The Partial COD terms need your approval. Please review and accept them again.',
  },
  {
    match: /PARTIAL_COD_CONSENT_UNAVAILABLE/,
    friendly: 'Partial COD is unavailable right now. Please choose online payment or contact support.',
  },
  { match: /coupon/i, friendly: 'Your coupon could no longer be applied. Remove it and try again.' },
];

export function checkoutErrorMessage(error: unknown): string {
  const fallback = "We couldn't place your order. Please try again.";
  if (!(error instanceof Error) || !error.message) return fallback;
  const raw = error.message;
  const total = /CHECKOUT_TOTAL_CHANGED: total updated from [\d.]+ to ([\d.]+)/.exec(raw);
  if (total) {
    return `Your order total has changed to ₹${total[1]}. Please review it and place your order again.`;
  }
  const hit = CHECKOUT_ERRORS.find(({ match }) => match.test(raw));
  if (hit) return hit.friendly;
  // Other backend messages are customer-facing once a "CODE: " prefix is
  // dropped (e.g. address not found, COD unavailable, 5xx retry text).
  return raw.replace(/^[A-Z][A-Z_]+:\s*/, '') || fallback;
}
