import { Linking, PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { create } from 'zustand';
import { pushPermissionStatus, requestPushPermission } from '../../platform/push';
import { reverseGeocode } from '../../api/address';
import { setPromotionalPush } from '../../api/account';
import { useSession } from '../../stores/session';

// Permissions the app actually uses, asked once after install with a primer
// (Play/Apple guidance: explain first, one system dialog per permission,
// always optional). Photos use the system photo picker and need no
// permission; nothing else is requested.

export type PermissionState = 'unavailable' | 'granted' | 'ask' | 'blocked';

const SEEN_KEY = 'onboarding.permissions.v1';
const DETECTED_KEY = 'delivery.detectedLocation.v1';

export async function hasSeenPermissionOnboarding() {
  return (await AsyncStorage.getItem(SEEN_KEY).catch(() => null)) === '1';
}
export async function markPermissionOnboardingSeen() {
  await AsyncStorage.setItem(SEEN_KEY, '1').catch(() => undefined);
}

export async function notificationState(): Promise<PermissionState> {
  const status = await pushPermissionStatus().catch(() => 'unavailable' as const);
  return status === 'unavailable' ? 'unavailable' : status === 'granted' ? 'granted' : 'ask';
}

/** Shows the system dialog. Android reports "don't ask again" as blocked. */
export async function requestNotifications(): Promise<PermissionState> {
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
    return result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? 'blocked' : 'ask';
  }
  // iOS (and Android < 13, where it is granted at install) via Firebase.
  return (await requestPushPermission().catch(() => false)) ? 'granted' : 'blocked';
}

export async function locationState(): Promise<PermissionState> {
  const permission = await Location.getForegroundPermissionsAsync().catch(() => null);
  if (!permission) return 'unavailable';
  if (permission.granted) return 'granted';
  return permission.canAskAgain ? 'ask' : 'blocked';
}

export async function requestLocation(): Promise<PermissionState> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.granted) return 'granted';
  return permission.canAskAgain ? 'ask' : 'blocked';
}

// Promotional push is a consent, not an OS permission: Android has one
// notification switch, so offers are opted into separately (never
// pre-ticked) and stored as the account's marketing.push preference. A
// guest's choice is held on the device and applied when they sign in.
const PROMO_PENDING_KEY = 'onboarding.promoPushPending.v1';

export async function choosePromotionalPush(enabled: boolean) {
  if (useSession.getState().status === 'authenticated') {
    await setPromotionalPush(enabled, 'onboarding');
    await AsyncStorage.removeItem(PROMO_PENDING_KEY).catch(() => undefined);
  } else {
    await AsyncStorage.setItem(PROMO_PENDING_KEY, enabled ? '1' : '0').catch(() => undefined);
  }
}

/** Applies a choice made before sign-in. Called once the session is authenticated. */
export async function flushPromotionalPushChoice() {
  const pending = await AsyncStorage.getItem(PROMO_PENDING_KEY).catch(() => null);
  if (pending === null) return;
  await setPromotionalPush(pending === '1', 'onboarding');
  await AsyncStorage.removeItem(PROMO_PENDING_KEY).catch(() => undefined);
}

export const openAppSettings = () => Linking.openSettings().catch(() => undefined);

// Where the customer is, for "Deliver to <city> <pincode>" before they've
// saved an address. Kept on the device only.
export type DetectedLocation = { city: string; pincode: string; serviceable: boolean; detectedAt: number };

type DetectedStore = {
  location: DetectedLocation | null;
  loaded: boolean;
  load: () => Promise<void>;
  detect: () => Promise<DetectedLocation | null>;
  remember: (area: Omit<DetectedLocation, 'detectedAt'>) => void;
};

export const useDetectedLocation = create<DetectedStore>((set, get) => ({
  location: null,
  loaded: false,
  load: async () => {
    if (get().loaded) return;
    try {
      const raw = await AsyncStorage.getItem(DETECTED_KEY);
      set({ location: raw ? JSON.parse(raw) : null, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  remember: area => {
    const location = { ...area, detectedAt: Date.now() };
    set({ location });
    AsyncStorage.setItem(DETECTED_KEY, JSON.stringify(location)).catch(() => undefined);
  },
  detect: async () => {
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const result = await reverseGeocode(position.coords.latitude, position.coords.longitude);
      if (!/^\d{6}$/.test(result.pincode)) return null;
      const location = {
        city: result.city?.name || result.suggestedCityName || '',
        pincode: result.pincode,
        serviceable: result.serviceable,
        detectedAt: Date.now(),
      };
      set({ location });
      await AsyncStorage.setItem(DETECTED_KEY, JSON.stringify(location)).catch(() => undefined);
      return location;
    } catch {
      return null;
    }
  },
}));
