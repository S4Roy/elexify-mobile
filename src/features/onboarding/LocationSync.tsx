import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { reportLocation } from '../../api/account';
import { useSession } from '../../stores/session';
import { useDetectedLocation } from './permissions';

// Keeps the signed-in customer's last known location (latitude/longitude,
// GPS accuracy and the area it resolves to) on their account, for delivery
// and the admin's customer view. Only while the app is open, only if the
// customer already allowed location (asked once in the setup sheet, never
// nagged), at most once a day. No background location.

const LAST_SENT_KEY = 'location.lastReportedAt.v1';
const DAY_MS = 24 * 3600_000;
// A recent fix this good is reused instead of turning on GPS again.
const CACHED_MAX_AGE_MS = 10 * 60_000;
const CACHED_MAX_ACCURACY_M = 100;
const round6 = (value: number) => Math.round(value * 1e6) / 1e6;

let inFlight = false;

export async function syncCustomerLocation({ force = false } = {}) {
  if (Platform.OS === 'web' || inFlight) return;
  if (useSession.getState().status !== 'authenticated') return;
  inFlight = true;
  try {
    const last = Number(await AsyncStorage.getItem(LAST_SENT_KEY).catch(() => null)) || 0;
    if (!force && Date.now() - last < DAY_MS) return;
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) return;
    // Android 12+ lets the customer allow only an approximate location
    // (expo-location doesn't report iOS's equivalent, so that stays unknown).
    const grant = permission.android?.accuracy;
    const precise = grant === 'fine' ? true : grant === 'coarse' ? false : null;
    const cached = await Location.getLastKnownPositionAsync({
      maxAge: CACHED_MAX_AGE_MS, requiredAccuracy: CACHED_MAX_ACCURACY_M,
    });
    const position = cached ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const { latitude, longitude, accuracy } = position.coords;
    const area = await reportLocation({
      latitude: round6(latitude),
      longitude: round6(longitude),
      accuracy: typeof accuracy === 'number' && Number.isFinite(accuracy) ? accuracy : null,
      precise,
    });
    await AsyncStorage.setItem(LAST_SENT_KEY, String(Date.now())).catch(() => undefined);
    if (/^\d{6}$/.test(area.pincode)) {
      useDetectedLocation.getState().remember({ city: area.city, pincode: area.pincode, serviceable: area.serviceable });
    }
  } catch {
    // Best effort; tried again on the next app open.
  } finally {
    inFlight = false;
  }
}

/** Mounted once in the root layout. */
export function LocationSync() {
  const status = useSession(s => s.status);
  useEffect(() => {
    if (status !== 'authenticated') return;
    syncCustomerLocation().catch(() => undefined);
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') syncCustomerLocation().catch(() => undefined);
    });
    return () => sub.remove();
  }, [status]);
  return null;
}
