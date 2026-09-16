const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
export function validateApiUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    const local = ['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash) {
      return null;
    }
    if (
      url.protocol !== 'https:' &&
      !(
        typeof __DEV__ !== 'undefined' &&
        __DEV__ &&
        local &&
        url.protocol === 'http:'
      )
    ) {
      return null;
    }
    return value.replace(/\/+$/, '') + '/';
  } catch {
    return null;
  }
}
export const apiConfig = {
  baseUrl: validateApiUrl(configuredUrl),
  publicKey: process.env.EXPO_PUBLIC_X_API_KEY?.trim() ?? '',
};
export const googleConfig = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? '',
};
