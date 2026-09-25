import { webUrlToAppPath } from '../src/navigation/deepLinks';

// Expo Router calls this for every URL the OS hands the app (App Links,
// Universal Links, elexify:// links, notification taps) before routing.
// Website URLs are translated to the matching app screen; everything else —
// elexify:// paths and the dev client's own URLs — passes through untouched.
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    if (/^https?:\/\//i.test(path)) {
      // A verified link to a page the app doesn't have: show home rather
      // than a "not found" screen.
      return webUrlToAppPath(path) ?? '/';
    }
    return path;
  } catch {
    return '/';
  }
}
