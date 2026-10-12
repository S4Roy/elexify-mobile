import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Modal, Platform, Pressable, StyleSheet, Switch, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/ui';
import { theme } from '../../theme';
import { useSession } from '../../stores/session';
import { syncPushRegistration } from '../notifications/PushProvider';
import { syncCustomerLocation } from './LocationSync';
import {
  PermissionState,
  choosePromotionalPush,
  hasSeenPermissionOnboarding,
  locationState,
  markPermissionOnboardingSeen,
  notificationState,
  openAppSettings,
  requestLocation,
  requestNotifications,
  useDetectedLocation,
} from './permissions';

// One-time, after-install permission primer (Flipkart/Amazon pattern):
// explains why each permission helps, asks with the system dialog only when
// the customer taps Allow, and never blocks the app — "Not now" is always
// there and nothing is asked again on its own. Hidden entirely when every
// permission is already granted or unavailable.

type Key = 'notifications' | 'location';
const ITEMS: { key: Key; icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    key: 'notifications',
    icon: 'notifications',
    title: 'Order & delivery updates',
    body: 'Know when your order is confirmed, shipped and out for delivery.',
  },
  {
    key: 'location',
    icon: 'location',
    title: 'Delivery to your area',
    body: 'Find your pincode, check delivery and fill in your address faster. Saved to your account; used only while the app is open.',
  },
];

export function PermissionOnboarding({ enabled }: { enabled: boolean }) {
  const insets = useSafeAreaInsets();
  const sessionStatus = useSession(s => s.status);
  const [visible, setVisible] = useState(false);
  const [states, setStates] = useState<Record<Key, PermissionState>>({ notifications: 'unavailable', location: 'unavailable' });
  const [busy, setBusy] = useState<Key | null>(null);
  const [locationNote, setLocationNote] = useState('');
  // Offers consent: separate from the OS permission and never pre-ticked.
  const [promo, setPromo] = useState(false);
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoError, setPromoError] = useState('');

  const togglePromo = async (value: boolean) => {
    setPromo(value);
    setPromoError('');
    setPromoSaving(true);
    try {
      await choosePromotionalPush(value);
    } catch {
      setPromo(!value);
      setPromoError('Couldn\u2019t save that. You can change it later in Account \u203a Notifications (Order updates and offers).');
    } finally {
      setPromoSaving(false);
    }
  };

  const refresh = useCallback(async () => {
    const [notifications, location] = await Promise.all([notificationState(), locationState()]);
    setStates({ notifications, location });
    return { notifications, location };
  }, []);

  // Decide once, after the splash, whether there's anything worth asking.
  useEffect(() => {
    if (!enabled || Platform.OS === 'web' || sessionStatus === 'loading') return;
    let cancelled = false;
    (async () => {
      if (await hasSeenPermissionOnboarding()) return;
      const current = await refresh();
      if (cancelled) return;
      if (Object.values(current).some(s => s === 'ask')) setVisible(true);
      else await markPermissionOnboardingSeen();
    })().catch(() => undefined);
    return () => { cancelled = true; };
  }, [enabled, sessionStatus, refresh]);

  // Coming back from the phone's Settings screen.
  useEffect(() => {
    if (!visible) return;
    const sub = AppState.addEventListener('change', s => { if (s === 'active') refresh().catch(() => undefined); });
    return () => sub.remove();
  }, [visible, refresh]);

  const allow = async (key: Key) => {
    if (busy) return;
    if (states[key] === 'blocked') { openAppSettings(); return; }
    setBusy(key);
    try {
      if (key === 'notifications') {
        const result = await requestNotifications();
        setStates(s => ({ ...s, notifications: result }));
        if (result === 'granted' && useSession.getState().status === 'authenticated') {
          syncPushRegistration().catch(() => undefined);
        }
      } else {
        const result = await requestLocation();
        setStates(s => ({ ...s, location: result }));
        if (result === 'granted') {
          // Signed in: also record the area on the account right away.
          syncCustomerLocation({ force: true }).catch(() => undefined);
          const found = await useDetectedLocation.getState().detect();
          setLocationNote(found
            ? `Delivering to ${[found.city, found.pincode].filter(Boolean).join(' ')}${found.serviceable ? '' : ' — not serviceable yet'}`
            : 'Location on. We couldn’t find your pincode right now.');
        }
      }
    } finally {
      setBusy(null);
    }
  };

  const close = () => {
    setVisible(false);
    markPermissionOnboardingSeen().catch(() => undefined);
  };

  const shown = ITEMS.filter(item => states[item.key] !== 'unavailable');
  const anyGranted = shown.some(item => states[item.key] === 'granted');
  const allGranted = shown.length > 0 && shown.every(item => states[item.key] === 'granted');

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
          <View style={styles.handle} />
          <View style={styles.hero}>
            <Ionicons name="shield-checkmark" size={30} color={theme.colors.primary} />
          </View>
          <AppText style={styles.title}>Set up Elexify</AppText>
          <AppText style={styles.subtitle}>
            Allow these so we can keep you posted and deliver faster. Both are optional.
          </AppText>

          <View style={styles.list}>
            {shown.map(item => {
              const state = states[item.key];
              return (
                <View key={item.key} style={styles.card}>
                <View style={styles.row}>
                  <View style={[styles.rowIcon, state === 'granted' && styles.rowIconOn]}>
                    <Ionicons name={item.icon} size={22} color={state === 'granted' ? '#FFFFFF' : theme.colors.primary} />
                  </View>
                  <View style={styles.rowText}>
                    <AppText style={styles.rowTitle}>{item.title}</AppText>
                    <AppText style={styles.rowBody}>
                      {item.key === 'location' && locationNote ? locationNote : item.body}
                    </AppText>
                  </View>
                  {state === 'granted' ? (
                    <View accessibilityLabel={`${item.title} allowed`} style={styles.done}>
                      <Ionicons name="checkmark-circle" size={26} color={theme.colors.primary} />
                    </View>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={state === 'blocked' ? `Open settings for ${item.title}` : `Allow ${item.title}`}
                      onPress={() => allow(item.key)}
                      disabled={!!busy}
                      style={({ pressed }) => [styles.allow, pressed && styles.pressed]}
                    >
                      {busy === item.key
                        ? <ActivityIndicator size="small" color={theme.colors.primary} />
                        : <AppText numberOfLines={1} style={styles.allowText}>{state === 'blocked' ? 'Settings' : 'Allow'}</AppText>}
                    </Pressable>
                  )}
                </View>
                {item.key === 'notifications' && (
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityState={{ checked: promo, disabled: promoSaving }}
                    accessibilityLabel="Offers and price drops"
                    accessibilityHint="Optional promotional notifications"
                    onPress={() => togglePromo(!promo)}
                    disabled={promoSaving}
                    style={styles.promo}
                  >
                    <View style={styles.promoText}>
                      <AppText style={styles.promoTitle}>{'Offers & price drops'}</AppText>
                      <AppText style={styles.promoBody}>
                        {promoError || 'Deals, price drops and back-in-stock alerts. Optional \u2014 turn off anytime.'}
                      </AppText>
                    </View>
                    <Switch
                      value={promo}
                      onValueChange={togglePromo}
                      disabled={promoSaving}
                      trackColor={{ false: '#D1D5DB', true: theme.colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </Pressable>
                )}
                </View>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={close}
            disabled={!!busy}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            <AppText style={styles.primaryText}>{allGranted ? 'Start shopping' : anyGranted ? 'Continue' : 'Not now'}</AppText>
          </Pressable>
          <AppText style={styles.footnote}>You can change these anytime in your phone's Settings.</AppText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', marginBottom: 18 },
  hero: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { marginTop: 14, fontFamily: theme.fonts.bold, fontSize: 21, color: theme.colors.text, textAlign: 'center' },
  subtitle: { marginTop: 6, fontSize: 13.5, lineHeight: 20, color: theme.colors.secondary, textAlign: 'center', maxWidth: 320 },
  list: { alignSelf: 'stretch', marginTop: 20, gap: 10 },
  card: { borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#FAFBFC', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  promo: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  promoText: { flex: 1, minWidth: 0 },
  promoTitle: { fontFamily: theme.fonts.medium, fontSize: 13.5, color: theme.colors.text },
  promoBody: { marginTop: 2, fontSize: 12, lineHeight: 17, color: theme.colors.secondary },
  rowIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  rowIconOn: { backgroundColor: theme.colors.primary },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: theme.fonts.semibold, fontSize: 14.5, color: theme.colors.text },
  rowBody: { marginTop: 2, fontSize: 12.5, lineHeight: 18, color: theme.colors.secondary },
  allow: {
    minWidth: 76, height: 36, paddingHorizontal: 14, borderRadius: 18,
    borderWidth: 1.5, borderColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  allowText: { fontFamily: theme.fonts.semibold, fontSize: 13.5, color: theme.colors.primary },
  done: { width: 76, alignItems: 'center' },
  primary: {
    alignSelf: 'stretch', marginTop: 20, height: 52, borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryText: { fontFamily: theme.fonts.semibold, fontSize: 15.5, color: '#FFFFFF' },
  footnote: { marginTop: 10, fontSize: 11.5, color: theme.colors.secondary, textAlign: 'center' },
  pressed: { opacity: 0.85 },
});
