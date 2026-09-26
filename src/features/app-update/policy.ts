export type UpdatePolicy = {
  schemaVersion: 1;
  platform: 'android' | 'ios';
  enabled: boolean;
  minimumVersion: string;
  storeUrl: string | null;
};
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export function requiresUpdate(
  installed: string | null,
  policy: UpdatePolicy,
): boolean {
  if (!policy.enabled || !installed || !versionPattern.test(installed))
    return false;
  const current = installed.split('.').map(Number);
  const minimum = policy.minimumVersion.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (current[i] !== minimum[i]) return current[i] < minimum[i];
  }
  return false;
}
export function parsePolicy(
  value: unknown,
  platform: string,
): UpdatePolicy | null {
  if (!value || typeof value !== 'object') return null;
  const p = value as UpdatePolicy;
  if (
    p.schemaVersion !== 1 ||
    p.platform !== platform ||
    typeof p.enabled !== 'boolean' ||
    typeof p.minimumVersion !== 'string' ||
    !versionPattern.test(p.minimumVersion)
  )
    return null;
  const validUrl =
    platform === 'android'
      ? p.storeUrl ===
        'https://play.google.com/store/apps/details?id=com.elexify'
      : typeof p.storeUrl === 'string' &&
        /^https:\/\/apps\.apple\.com\/(?:[a-z]{2}\/)?app\/(?:[^/?#]+\/)?id\d+$/.test(
          p.storeUrl,
        );
  if (p.enabled && !validUrl) return null;
  return p;
}
