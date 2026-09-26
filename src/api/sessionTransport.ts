import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiConfig } from './config';
import { sessionStorage } from '../platform/session';
const transport = axios.create({ baseURL: apiConfig.baseUrl ?? undefined, timeout: 15000, withCredentials: true,
  headers: { 'x-api-key': apiConfig.publicKey, 'x-session-request': '1', ...(Platform.OS !== 'web' ? { 'x-auth-client': 'native' } : {}) } });
let pending: Promise<string> | null = null;
export async function saveRefresh(token: any, fromLogin = false) {
  if (fromLogin && pending) await pending.catch(() => undefined);
  if (typeof token?.refresh_token === 'string') await sessionStorage.writeRefresh(token.refresh_token);
}
export function refreshSessionToken(legacyToken?: string | null): Promise<string> {
  if (pending) return pending;
  pending = (async () => {
    const refresh = await sessionStorage.readRefresh();
    let migrate = false;
    if (!refresh && legacyToken) {
      try {
        const claims = JSON.parse(atob(legacyToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        migrate = !claims.sid && typeof claims.user_id === 'string';
      } catch { /* Let the server reject the missing refresh credential consistently. */ }
    }
    const response = await transport.post(`auth/user/${migrate ? 'migrate-session' : 'refresh'}`,
      refresh ? { refresh_token: refresh } : {},
      migrate ? { headers: { Authorization: `Bearer ${legacyToken}` } } : undefined);
    const token = response.data.data.token;
    await saveRefresh(token);
    await sessionStorage.writeToken(token.access_token);
    return token.access_token as string;
  })().finally(() => { pending = null; });
  return pending;
}
export async function revokeCurrentSession(token: string | null, all = false) {
  if (pending) await pending.catch(() => undefined);
  if (all) token = await refreshSessionToken(token);
  const refresh = await sessionStorage.readRefresh();
  const deviceId = !all ? await AsyncStorage.getItem('push.installation') : null;
  await transport.post(`auth/user/${all ? 'logout-all' : 'logout'}`, {
    ...(refresh ? { refresh_token: refresh } : {}),
    ...(deviceId ? { device_id: deviceId } : {}),
  },
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  await sessionStorage.removeRefresh();
}
