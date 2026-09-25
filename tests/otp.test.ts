import { extractOtpFromSms, normalizeOtpInput } from '../src/utils/otp';

test('typing appends one digit at a time and stops at the length', () => {
  expect(normalizeOtpInput('12', '123', 6)).toBe('123');
  expect(normalizeOtpInput('123456', '1234567', 6)).toBe('123456');
  expect(normalizeOtpInput('123', '12', 6)).toBe('12');
});

test('autofill after partially typed digits keeps the inserted code', () => {
  expect(normalizeOtpInput('12', '12483920', 6)).toBe('483920');
});

test('iOS double insertion of the suggested code keeps one copy', () => {
  expect(normalizeOtpInput('', '483920483920', 6)).toBe('483920');
});

test('a clean paste or autofill into an empty field is kept as is', () => {
  expect(normalizeOtpInput('', '483 920', 6)).toBe('483920');
});

test('extractOtpFromSms reads the code from both DLT templates', () => {
  expect(
    extractOtpFromSms(
      'Your OTP for login to elexify.online is 483920. Do not share this OTP with anyone. It is valid for 2 minutes. - ELEXIFY',
    ),
  ).toBe('483920');
  expect(
    extractOtpFromSms(
      'Dear Riya, Your Change mobile OTP is 071234. Please do not share this SMS to any one. ELEXIFY.',
    ),
  ).toBe('071234');
  expect(extractOtpFromSms('Order ORD-0012345 shipped')).toBeNull();
});
