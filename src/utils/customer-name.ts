export const CUSTOMER_NAME_PATTERN = /^(?=.*[A-Za-z])[A-Za-z .'-]+$/;
export const CUSTOMER_NAME_MESSAGE = "Use English letters (A-Z), spaces, apostrophes, hyphens and periods only";
export const isEnglishCustomerName = (value: unknown): boolean =>
  typeof value === 'string' && CUSTOMER_NAME_PATTERN.test(value.trim());
