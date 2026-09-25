import axios from 'axios';
import { apiConfig } from '../../api/config';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../stores/session';
import {
  getNotification,
  markNotificationRead,
  safeNotificationRoute,
} from '../../api/notifications';
import {
  currentPushToken,
  deletePushToken,
  observePush,
  requestPushPermission,
} from '../../platform/push';
import { setPushCleanup } from '../../platform/pushLifecycle';
import { InAppBanner, showInAppBanner } from './InAppBanner';
let registration: Promise<void> = Promise.resolve();
let loggingOut = false;
async function installationId() {
  let id = await AsyncStorage.getItem('push.installation');
  if (!id) {
    id = randomUUID();
    await AsyncStorage.setItem('push.installation', id);
  }
  return id;
}
export function syncPushRegistration() {
  registration = registration
    .catch(() => undefined)
    .then(async () => {
      const session = useSession.getState();
      if (
        loggingOut ||
        session.status !== 'authenticated' ||
        Platform.OS === 'web'
      )
        return;
      const token = await currentPushToken();
      if (useSession.getState().token !== session.token || loggingOut) return;
      if (!token) {
        const oldId = await AsyncStorage.getItem('push.installation');
        if (oldId && apiConfig.baseUrl)
          await axios.delete(
            `${apiConfig.baseUrl}user/device-tokens/${oldId}`,
            {
              timeout: 5000,
              headers: {
                Authorization: `Bearer ${session.token}`,
                'x-api-key': apiConfig.publicKey,
              },
            },
          );
        return;
      }
      const deviceId = await installationId();
      if (useSession.getState().token !== session.token || loggingOut) return;
      if (!apiConfig.baseUrl) return;
      await axios.post(
        `${apiConfig.baseUrl}user/device-tokens`,
        {
          token,
          device_id: deviceId,
          platform: Platform.OS,
          app_version: Constants.expoConfig?.version,
          environment: process.env.EXPO_PUBLIC_APP_ENV,
          firebase_project_id: process.env.EXPO_PUBLIC_FCM_PROJECT_ID,
        },
        {
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${session.token}`,
            'x-api-key': apiConfig.publicKey,
          },
        },
      );
    });
  return registration;
}
export async function enablePush() {
  if (!(await requestPushPermission()))
    throw new Error(
      'Notifications are unavailable or permission was not granted. You can still use your inbox.',
    );
  await syncPushRegistration();
}
export function PushProvider() {
  const status = useSession(s => s.status);
  const token = useSession(s => s.token);
  const client = useQueryClient();
  const pending = useRef<string | null>(null);
  const open = async (id: string) => {
    if (!/^[a-f0-9]{24}$/i.test(id)) return;
    if (useSession.getState().status !== 'authenticated') {
      pending.current = id;
      router.push('/login');
      return;
    }
    const identity = useSession.getState().token;
    try {
      const notification = await getNotification(id);
      if (identity !== useSession.getState().token) return;
      await markNotificationRead(id);
      await client.invalidateQueries({ queryKey: ['notifications'] });
      router.push(safeNotificationRoute(notification.route) as Href);
    } catch {
      if (identity === useSession.getState().token)
        router.push('/notifications' as Href);
    }
  };
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(
    () =>
      setPushCleanup(async () => {
        loggingOut = true;
        try {
          await registration.catch(() => undefined);
          const id = await AsyncStorage.getItem('push.installation');
          // Native token deletion is still attempted when offline server cleanup fails.
          try {
            if (id && apiConfig.baseUrl)
              await axios.delete(
                `${apiConfig.baseUrl}user/device-tokens/${id}`,
                {
                  timeout: 5000,
                  headers: {
                    Authorization: `Bearer ${useSession.getState().token}`,
                    'x-api-key': apiConfig.publicKey,
                  },
                },
              );
          } catch {
            /* next registration reassigns installation */
          }
          await deletePushToken().catch(() => undefined);
          pending.current = null;
        } finally {
          loggingOut = false;
        }
      }),
    [],
  );
  useEffect(() => {
    if (status === 'authenticated') {
      syncPushRegistration().catch(() => undefined);
      if (pending.current) {
        const id = pending.current;
        pending.current = null;
        openRef.current(id).catch(() => undefined);
      }
    }
  }, [status, token]);
  useEffect(() => {
    const remove = observePush(
      (message, tapped) => {
        client
          .invalidateQueries({ queryKey: ['notifications'] })
          .catch(() => undefined);
        if (!message.notificationId) return;
        if (tapped)
          openRef.current(message.notificationId).catch(() => undefined);
        else if (useSession.getState().status === 'authenticated') {
          const identity = useSession.getState().token;
          // A queued FCM message may belong to the account that just signed out.
          getNotification(message.notificationId)
            .then(notification => {
              if (identity !== useSession.getState().token) return;
              showInAppBanner({
                id: notification._id,
                title: notification.title,
                body: notification.body,
                onPress: () => {
                  openRef.current(notification._id).catch(() => undefined);
                },
              });
            })
            .catch(() => undefined);
        }
      },
      () => {
        syncPushRegistration().catch(() => undefined);
      },
    );
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') {
        syncPushRegistration().catch(() => undefined);
        client
          .invalidateQueries({ queryKey: ['notifications'] })
          .catch(() => undefined);
      }
    });
    return () => {
      remove();
      appState.remove();
    };
  }, [client]);
  return <InAppBanner />;
}
