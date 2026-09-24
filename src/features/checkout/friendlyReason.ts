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
