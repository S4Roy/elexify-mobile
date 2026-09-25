import { formatTimeLeft } from '../src/features/orders/paymentWindow';

test('formatTimeLeft shows minutes, then a mm:ss countdown near the end', () => {
  expect(formatTimeLeft(42 * 60 * 1000)).toBe('42 min left');
  expect(formatTimeLeft(10 * 60 * 1000)).toBe('10 min left');
  expect(formatTimeLeft(4 * 60 * 1000 + 5000)).toBe('4:05 left');
  expect(formatTimeLeft(900)).toBe('0:01 left');
  expect(formatTimeLeft(0)).toBe('Expired');
});
