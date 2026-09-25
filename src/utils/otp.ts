/**
 * Normalises what the hidden OTP field reports into at most `length` digits.
 *
 * A single keystroke appends or deletes one character, so it's kept as typed
 * (extra digits past the end are ignored). A multi-character insert is a
 * paste or OS autofill: iOS inserts the suggested code at the caret — after
 * any digits already typed — and occasionally inserts it twice, so the code
 * is the *last* `length` digits, not the first.
 */
export function normalizeOtpInput(
  previous: string,
  next: string,
  length: number,
): string {
  const digits = next.replace(/\D/g, '');
  const inserted = digits.length - previous.length;
  if (inserted > 1 && digits.length > length) {
    return digits.slice(-length);
  }
  return digits.slice(0, length);
}

/** First standalone code of `length` digits in an SMS body, if any. */
export function extractOtpFromSms(message: string, length = 6): string | null {
  const match = message.match(new RegExp(`(?:^|\\D)(\\d{${length}})(?!\\d)`));
  return match ? match[1] : null;
}
