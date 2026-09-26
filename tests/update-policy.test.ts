import {
  parsePolicy,
  requiresUpdate,
  UpdatePolicy,
} from '../src/features/app-update/policy';
const policy: UpdatePolicy = {
  schemaVersion: 1,
  platform: 'android',
  enabled: true,
  minimumVersion: '1.10.0',
  storeUrl: 'https://play.google.com/store/apps/details?id=com.elexify',
};
test.each([
  ['1.9.9', true],
  ['1.10.0', false],
  ['1.11.0', false],
  ['2.0.0', false],
  [null, false],
  ['broken', false],
])('compares native version %s', (installed, expected) => {
  expect(requiresUpdate(installed as string | null, policy)).toBe(expected);
});
test('disabled policy releases the gate', () => {
  expect(requiresUpdate('1.0.0', { ...policy, enabled: false })).toBe(false);
});
test('rejects malformed policies, wrong platform and untrusted store URLs', () => {
  expect(parsePolicy(policy, 'android')).toEqual(policy);
  expect(parsePolicy(policy, 'ios')).toBeNull();
  expect(
    parsePolicy({ ...policy, minimumVersion: '1.x.0' }, 'android'),
  ).toBeNull();
  expect(
    parsePolicy({ ...policy, storeUrl: 'https://evil.example' }, 'android'),
  ).toBeNull();
  expect(parsePolicy({ ...policy, enabled: 'true' }, 'android')).toBeNull();
});
