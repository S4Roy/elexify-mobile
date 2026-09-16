import { validateApiUrl } from '../src/api/config';
test('requires an explicit valid API origin', () => {
  expect(validateApiUrl(undefined)).toBeNull();
  expect(validateApiUrl('bad-url')).toBeNull();
  expect(
    validateApiUrl('https://user:password@example.test/api/v1/'),
  ).toBeNull();
  expect(validateApiUrl('https://example.test/api/v1/?key=secret')).toBeNull();
  expect(validateApiUrl('http://example.test/api/v1/')).toBeNull();
  expect(validateApiUrl('https://example.test/api/v1')).toBe(
    'https://example.test/api/v1/',
  );
});
