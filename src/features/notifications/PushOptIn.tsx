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
      .then(setPermission)
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
      // Denied, or "don't ask again": only system settings can undo it now.
      setBlocked(true);
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

const COPY: Record<Variant, { title: string; text: string }> = {
  order: {
    title: 'Get updates on this order',
    text: "We'll let you know when it ships, when it's out for delivery and if anything needs your attention.",
  },
  inbox: {
    title: 'Never miss an update',
    text: 'Get alerts when your order ships, is out for delivery or has a payment update.',
  },
  settings: {
    title: 'Notifications are off on this phone',
    text: 'Turn them on to receive the push notifications you choose below.',
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
            name="notifications"
            size={20}
            color={theme.colors.primary}
          />
        </View>
        <View style={shop.flex}>
          <AppText style={styles.title}>
            {blocked ? 'Notifications are blocked' : copy.title}
          </AppText>
          <AppText style={styles.text}>
            {blocked
              ? 'Allow notifications for Elexify in your phone settings to get order and delivery alerts.'
              : copy.text}
          </AppText>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={dismiss}
          style={({ pressed }) => [styles.later, pressed && styles.pressed]}
        >
          <AppText style={styles.laterText}>Not now</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={turnOn}
          style={({ pressed }) => [
            styles.primary,
            (pressed || busy) && styles.pressed,
          ]}
        >
          <AppText style={styles.primaryText}>
            {busy ? 'Turning on…' : blocked ? 'Open settings' : 'Turn on'}
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
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F1F9F7',
    borderWidth: 1,
    borderColor: '#D5EBE7',
  },
  head: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.text,
  },
  text: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.secondary,
  },
  actions: { flexDirection: 'row', gap: 10 },
  later: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#B2DFDB',
    backgroundColor: '#FFFFFF',
  },
  laterText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
  },
  primary: {
    flex: 1.4,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  primaryText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
  },
});
