import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText } from '../../components/ui';
import { shop } from '../../components/shop';
import { theme } from '../../theme';
import { useSession } from '../../stores/session';
import { type PushPermission, pushPermissionStatus } from '../../platform/push';
import { enablePush } from './PushProvider';

// When to ask for notification permission (industry practice, and what this
// app follows):
// - Never on first launch. Ask at a moment where the value is obvious —
//   right after an order is placed — or where the user went looking for it
//   (Notifications, Notification Preferences).
// - Soft prompt first: our own card explains the benefit and only "Turn on"
//   triggers the one-shot system dialog, so "Not now" never burns it.
// - Throttled: after "Not now" the contextual prompt stays away for
//   COOLDOWN_DAYS, and stops entirely after MAX_DISMISSALS.
// - Silent re-registration once granted lives in PushProvider (sign-in,
//   foreground, token refresh), and logout unregisters the device.

const STORAGE_KEY = 'push.optin';
const DENIED_KEY = 'push.permission-denied';
const COOLDOWN_DAYS = 14;
const MAX_DISMISSALS = 3;

type OptInRecord = { dismissedAt: number; dismissals: number };

async function readRecord(): Promise<OptInRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed.dismissedAt === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

function withinCooldown(record: OptInRecord | null, now = Date.now()) {
  if (!record) {
    return false;
  }
  return (
    record.dismissals >= MAX_DISMISSALS ||
    now - record.dismissedAt < COOLDOWN_DAYS * 86_400_000
  );
}

/**
 * Whether to show the soft prompt, plus its actions. `throttled` prompts
 * (contextual ones like the order-success card) respect the cooldown;
 * screens the user opened on purpose pass `throttled: false`.
 */
export function usePushOptIn({ throttled }: { throttled: boolean }) {
  const authenticated = useSession(s => s.status === 'authenticated');
  const [permission, setPermission] = useState<PushPermission | null>(null);
  const [cooledDown, setCooledDown] = useState<boolean | null>(null);
  const [hidden, setHidden] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    pushPermissionStatus()
      .then(status => {
        setPermission(status);
        if (status === 'granted') {
          setBlocked(false);
          AsyncStorage.removeItem(DENIED_KEY).catch(() => undefined);
        } else if (status === 'denied') {
          AsyncStorage.getItem(DENIED_KEY)
            .then(value => setBlocked(value === 'true'))
            .catch(() => setBlocked(false));
        }
      })
      .catch(() => setPermission('unavailable'));
  }, []);

  useEffect(() => {
    refresh();
    readRecord()
      .then(record => setCooledDown(!withinCooldown(record)))
      .catch(() => setCooledDown(true));
    // Coming back from system settings may have changed the permission.
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  const turnOn = async () => {
    if (blocked) {
      Linking.openSettings().catch(() => undefined);
      return;
    }
    setBusy(true);
    try {
      await enablePush();
      refresh();
    } catch {
      // Never loop the native prompt after a denial. Bring the user to the
      // platform settings from their next explicit opt-in action instead.
      const status = await pushPermissionStatus().catch(
        () => 'unavailable' as const,
      );
      setPermission(status);
      if (status === 'denied') {
        setBlocked(true);
        AsyncStorage.setItem(DENIED_KEY, 'true').catch(() => undefined);
      }
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    setHidden(true);
    if (!throttled) {
      return;
    }
    readRecord()
      .then(record =>
        AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            dismissedAt: Date.now(),
            dismissals: (record?.dismissals ?? 0) + 1,
          }),
        ),
      )
      .catch(() => undefined);
  };

  const visible =
    authenticated &&
    !hidden &&
    permission === 'denied' &&
    (!throttled || cooledDown === true);

  return { visible, blocked, busy, turnOn, dismiss };
}

type Variant = 'order' | 'inbox' | 'settings';

const COPY: Record<
  Variant,
  { title: string; text: string; benefits: string[] }
> = {
  order: {
    title: 'Stay updated on your order',
    text: 'Get useful delivery updates at the right time. Promotional offers are optional and managed separately in Notification Preferences.',
    benefits: ['When your order ships', 'When delivery is nearby'],
  },
  inbox: {
    title: 'Take order updates with you',
    text: 'Allow timely order alerts. Promotional messages stay off unless you opt in under Offers & discounts in Notification Preferences.',
    benefits: ['Shipping and delivery progress', 'Important order alerts'],
  },
  settings: {
    title: 'Get updates on this phone',
    text: 'Turn on notifications for this device. Promotional offers are optional; opt in separately using Offers & discounts — Push below.',
    benefits: ['Delivery milestones', 'Payment and order updates'],
  },
};

/** Soft pre-permission card. Renders nothing when it shouldn't be shown. */
export function PushOptInCard({
  variant,
  throttled = false,
}: {
  variant: Variant;
  throttled?: boolean;
}) {
  const { visible, blocked, busy, turnOn, dismiss } = usePushOptIn({
    throttled,
  });
  if (!visible) {
    return null;
  }
  const copy = COPY[variant];
  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.head}>
        <View style={styles.icon}>
          <Ionicons
            name={
              blocked ? 'notifications-off-outline' : 'notifications-outline'
            }
            size={22}
            color={theme.colors.primary}
          />
        </View>
        <View style={shop.flex}>
          <AppText accessibilityRole="header" style={styles.title}>
            {blocked ? 'Notifications are blocked' : copy.title}
          </AppText>
          <AppText style={styles.text}>
            {blocked
              ? 'Allow notifications for Elexify in your phone settings to get order and delivery alerts.'
              : copy.text}
          </AppText>
        </View>
      </View>
      {!blocked && (
        <View style={styles.benefits}>
          {copy.benefits.map(benefit => (
            <View key={benefit} style={styles.benefit}>
              <Ionicons
                name="checkmark-circle"
                size={17}
                color={theme.colors.primary}
              />
              <AppText style={styles.benefitText}>{benefit}</AppText>
            </View>
          ))}
        </View>
      )}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Not now. You can keep using the app without notifications."
          onPress={dismiss}
          style={({ pressed }) => [styles.later, pressed && styles.pressed]}
        >
          <AppText style={styles.laterText}>Not now</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={turnOn}
          style={({ pressed }) => [
            styles.primary,
            (pressed || busy) && styles.pressed,
          ]}
        >
          <AppText style={styles.primaryText}>
            {busy
              ? 'Turning on…'
              : blocked
                ? 'Open settings'
                : 'Enable notifications'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  card: {
    alignSelf: 'stretch',
    gap: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    shadowColor: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  head: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  title: {
    fontFamily: theme.fonts.semibold,
    fontSize: 16,
    lineHeight: 23,
    color: theme.colors.text,
  },
  text: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.secondary,
  },
  benefits: { gap: 9, paddingLeft: 2 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  benefitText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.text,
  },
  actions: { flexDirection: 'row', gap: 10, paddingTop: 2 },
  later: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  laterText: {
    color: theme.colors.secondary,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
  },
  primary: {
    flex: 1.5,
    minHeight: 48,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  primaryText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
  },
});
