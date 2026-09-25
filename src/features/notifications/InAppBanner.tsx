import React, {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/ui';
import { theme } from '../../theme';

// Heads-up style banner for pushes that arrive while the app is open (the
// OS doesn't show them then). Slides in from the top, auto-hides, can be
// swiped up to dismiss, and tapping opens the notification.

export type BannerMessage = {
  id: string;
  title: string;
  body: string;
  onPress: () => void;
};

const VISIBLE_MS = 5000;
let current: BannerMessage | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export function showInAppBanner(message: BannerMessage) {
  current = message;
  emit();
}
function hideBanner(id: string) {
  if (current?.id === id) {
    current = null;
    emit();
  }
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function InAppBanner() {
  const message = useSyncExternalStore(subscribe, () => current);
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-200)).current;
  const [shown, setShown] = useState<BannerMessage | null>(null);

  useEffect(() => {
    if (!message) {
      Animated.timing(translateY, {
        toValue: -200,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShown(null));
      return;
    }
    setShown(message);
    translateY.setValue(-200);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
    }).start();
    AccessibilityInfo.announceForAccessibility(
      `${message.title}. ${message.body}`,
    );
    const timer = setTimeout(() => hideBanner(message.id), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message, translateY]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy < -6,
      onPanResponderMove: (_, g) => translateY.setValue(Math.min(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy < -30 && current) {
          hideBanner(current.id);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  if (!shown) {
    return null;
  }
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { paddingTop: insets.top + 8, transform: [{ translateY }] },
      ]}
      {...pan.panHandlers}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${shown.title}. ${shown.body}. Opens the notification`}
        onPress={() => {
          hideBanner(shown.id);
          shown.onPress();
        }}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.icon}>
          <Ionicons name="notifications" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.text}>
          <AppText style={styles.title} numberOfLines={1}>
            {shown.title}
          </AppText>
          <AppText style={styles.body} numberOfLines={2}>
            {shown.body}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={10}
          onPress={() => hideBanner(shown.id)}
        >
          <Ionicons name="close" size={18} color={theme.colors.secondary} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  pressed: { opacity: 0.9 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  text: { flex: 1 },
  title: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  body: { fontSize: 13, lineHeight: 18, color: theme.colors.secondary },
});
