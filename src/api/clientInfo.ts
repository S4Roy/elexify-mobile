import { Platform } from 'react-native';
import * as Application from 'expo-application';

// Lets the account's "Signed-in devices" list show e.g. "Xiaomi Redmi Note 12
// · Elexify app 1.0.9 · Android 14" — native HTTP sends no browser-style
// user agent. See elexify-backend services/customerSession describeDevice.
const clean = (value: unknown) => String(value ?? '').replace(/[^\x20-\x7E]/g, '').trim().slice(0, 60);

function deviceModel(): string {
  if (Platform.OS !== 'android') return '';
  const c = Platform.constants as { Brand?: string; Manufacturer?: string; Model?: string };
  const brand = c.Brand || c.Manufacturer || '';
  const model = c.Model || '';
  const name = model.toLowerCase().startsWith(brand.toLowerCase()) ? model : `${brand} ${model}`;
  return clean(name.replace(/\b\w/, ch => ch.toUpperCase()));
}

export function nativeClientHeaders(): Record<string, string> {
  if (Platform.OS === 'web') return {};
  const headers: Record<string, string> = {
    'x-client-platform': Platform.OS,
    'x-client-os-version': clean(Platform.Version),
  };
  const appVersion = clean(Application.nativeApplicationVersion);
  if (appVersion) headers['x-app-version'] = appVersion;
  const model = deviceModel();
  if (model) headers['x-device-model'] = model;
  return headers;
}
