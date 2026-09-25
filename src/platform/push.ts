import { PermissionsAndroid, Platform } from 'react-native';
import { getApps } from '@react-native-firebase/app';
import {
  getMessaging,
  getToken,
  deleteToken,
  requestPermission,
  AuthorizationStatus,
  hasPermission,
  onTokenRefresh,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';
export type PushMessage = {
  notificationId?: string;
  title?: string;
  body?: string;
};
const enabled = () =>
  process.env.EXPO_PUBLIC_PUSH_ENABLED === 'true' && getApps().length > 0;
export async function requestPushPermission() {
  if (!enabled()) return false;
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33)
    return (
      (await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      )) === PermissionsAndroid.RESULTS.GRANTED
    );
  const status = await requestPermission(getMessaging());
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}
export type PushPermission = 'unavailable' | 'granted' | 'denied';

/** Current permission without prompting — drives the inbox's opt-in banner. */
export async function pushPermissionStatus(): Promise<PushPermission> {
  if (!enabled()) return 'unavailable';
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33)
    return (await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    ))
      ? 'granted'
      : 'denied';
  const status = await hasPermission(getMessaging());
  return status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
    ? 'granted'
    : 'denied';
}
export async function currentPushToken() {
  if (!enabled()) return null;
  if (
    Platform.OS === 'android' &&
    Number(Platform.Version) >= 33 &&
    !(await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    ))
  )
    return null;
  const status = await hasPermission(getMessaging());
  return status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
    ? getToken(getMessaging())
    : null;
}
export async function deletePushToken() {
  if (enabled()) await deleteToken(getMessaging());
}
export function observePush(
  receive: (message: PushMessage, tapped: boolean) => void,
  refresh: () => void,
) {
  if (!enabled()) return () => {};
  const messaging = getMessaging();
  const map = (m: {
    data?: Record<string, string | object>;
    notification?: { title?: string; body?: string };
  }): PushMessage => ({
    notificationId:
      typeof m.data?.notificationId === 'string'
        ? m.data.notificationId
        : undefined,
    title: m.notification?.title,
    body: m.notification?.body,
  });
  const removeMessage = onMessage(messaging, m => receive(map(m), false));
  const removeTap = onNotificationOpenedApp(messaging, m =>
    receive(map(m), true),
  );
  const removeRefresh = onTokenRefresh(messaging, refresh);
  let active = true;
  getInitialNotification(messaging)
    .then(m => {
      if (m && active) receive(map(m), true);
    })
    .catch(() => undefined);
  return () => {
    active = false;
    removeMessage();
    removeTap();
    removeRefresh();
  };
}
