export type UpdatePolicy = {
  schemaVersion: 2;
  platform: 'android' | 'ios';
  enabled: boolean;
  /** Installed versions below this must update (blocking dialog). */
  minimumVersion: string;
  /** Installed versions below this are offered an update they can skip. */
  latestVersion: string;
  storeUrl: string | null;
  title: string;
  message: string;
  /** Hours before a skipped optional update is offered again; 0 = once per version. */
  remindAfterHours: number;
};
export type UpdateKind = 'required' | 'optional';
export type SkippedUpdate = { version: string; at: number };

const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export function compareVersions(a: string, b: string): number {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  }
  return 0;
}
export function updateKind(
  installed: string | null,
  policy: UpdatePolicy,
): UpdateKind | null {
  if (!policy.enabled || !installed || !versionPattern.test(installed))
    return null;
  if (compareVersions(installed, policy.minimumVersion) < 0) return 'required';
  if (compareVersions(installed, policy.latestVersion) < 0) return 'optional';
  return null;
}
/** Whether a skippable update should be offered again after "Later". */
export function shouldPromptOptional(
  policy: UpdatePolicy,
  skipped: SkippedUpdate | null,
  now = Date.now(),
): boolean {
  if (!skipped || skipped.version !== policy.latestVersion) return true;
  if (policy.remindAfterHours <= 0) return false;
  return now - skipped.at >= policy.remindAfterHours * 3600 * 1000;
}
const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';
export function parsePolicy(
  value: unknown,
  platform: string,
): UpdatePolicy | null {
  if (!value || typeof value !== 'object') return null;
  const p = value as Record<string, unknown>;
  if (
    p.schemaVersion !== 2 ||
    p.platform !== platform ||
    typeof p.enabled !== 'boolean' ||
    typeof p.minimumVersion !== 'string' ||
    !versionPattern.test(p.minimumVersion) ||
    typeof p.latestVersion !== 'string' ||
    !versionPattern.test(p.latestVersion)
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
  const hours =
    typeof p.remindAfterHours === 'number' &&
    Number.isFinite(p.remindAfterHours)
      ? Math.min(720, Math.max(0, p.remindAfterHours))
      : 24;
  return {
    schemaVersion: 2,
    platform: platform as UpdatePolicy['platform'],
    enabled: p.enabled,
    minimumVersion: p.minimumVersion,
    latestVersion: p.latestVersion,
    storeUrl: validUrl ? (p.storeUrl as string) : null,
    title: text(p.title, 80),
    message: text(p.message, 300),
    remindAfterHours: hours,
  };
}
