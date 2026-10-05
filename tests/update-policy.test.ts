import {
  parsePolicy,
  shouldPromptOptional,
  updateKind,
  UpdatePolicy,
} from '../src/features/app-update/policy';
const policy: UpdatePolicy = {
  schemaVersion: 2,
  platform: 'android',
  enabled: true,
  minimumVersion: '1.10.0',
  latestVersion: '1.12.0',
  storeUrl: 'https://play.google.com/store/apps/details?id=com.elexify',
  title: '',
  message: '',
  remindAfterHours: 24,
};
test.each([
  ['1.9.9', 'required'],
  ['1.10.0', 'optional'],
  ['1.11.5', 'optional'],
  ['1.12.0', null],
  ['2.0.0', null],
  [null, null],
  ['broken', null],
])('classifies installed version %s as %s', (installed, expected) => {
  expect(updateKind(installed as string | null, policy)).toBe(expected);
});
test('disabled policy never prompts', () => {
  expect(updateKind('1.0.0', { ...policy, enabled: false })).toBeNull();
});
test('a skipped optional update returns after the reminder interval or a newer release', () => {
  const now = Date.now();
  const skipped = { version: '1.12.0', at: now - 2 * 3600 * 1000 };
  expect(shouldPromptOptional(policy, null, now)).toBe(true);
  expect(shouldPromptOptional(policy, skipped, now)).toBe(false);
  expect(
    shouldPromptOptional(
      policy,
      { ...skipped, at: now - 25 * 3600 * 1000 },
      now,
    ),
  ).toBe(true);
  expect(
    shouldPromptOptional({ ...policy, latestVersion: '1.13.0' }, skipped, now),
  ).toBe(true);
  expect(
    shouldPromptOptional(
      { ...policy, remindAfterHours: 0 },
      { ...skipped, at: 0 },
      now,
    ),
  ).toBe(false);
});
test('rejects malformed policies, wrong platform and untrusted store URLs', () => {
  expect(parsePolicy(policy, 'android')).toEqual(policy);
  expect(parsePolicy(policy, 'ios')).toBeNull();
  expect(parsePolicy({ ...policy, schemaVersion: 1 }, 'android')).toBeNull();
  expect(
    parsePolicy({ ...policy, minimumVersion: '1.x.0' }, 'android'),
  ).toBeNull();
  expect(parsePolicy({ ...policy, latestVersion: '' }, 'android')).toBeNull();
  expect(
    parsePolicy({ ...policy, storeUrl: 'https://evil.example' }, 'android'),
  ).toBeNull();
  expect(parsePolicy({ ...policy, enabled: 'true' }, 'android')).toBeNull();
});
test('clips admin copy and clamps the reminder interval', () => {
  const parsed = parsePolicy(
    { ...policy, title: 'x'.repeat(200), remindAfterHours: 9999 },
    'android',
  );
  expect(parsed?.title).toHaveLength(80);
  expect(parsed?.remindAfterHours).toBe(720);
});
