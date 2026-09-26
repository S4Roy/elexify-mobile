import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/ui';
import { money, shop } from '../../components/shop';
import { theme } from '../../theme';
import { useOrderDetail } from '../orders/hooks';
import { friendlyReason } from './friendlyReason';
import { PushOptInCard } from '../notifications/PushOptIn';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? '';

const GREEN = '#15803D';
const TONES = {
  success: { ink: GREEN, soft: '#DCFCE7', ring: '#BBF7D0', icon: 'checkmark' },
  cancelled: {
    ink: '#B45309',
    soft: '#FEF3C7',
    ring: '#FDE68A',
    icon: 'time-outline',
  },
  failure: {
    ink: theme.colors.danger,
    soft: '#FEE2E2',
    ring: '#FECACA',
    icon: 'close',
  },
} as const;

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false));
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => subscription.remove();
  }, []);
  return reduceMotion;
}

const CONFETTI = [
  { x: -49, y: -28, color: '#F59E0B' },
  { x: -34, y: -53, color: '#14B8A6' },
  { x: -10, y: -62, color: '#F472B6' },
  { x: 18, y: -58, color: '#60A5FA' },
  { x: 45, y: -37, color: '#A78BFA' },
  { x: 52, y: -5, color: '#F59E0B' },
  { x: -53, y: 4, color: '#34D399' },
  { x: 38, y: 20, color: '#FB7185' },
];

function CelebrationBurst({
  active,
  reduceMotion,
}: {
  active: boolean;
  reduceMotion: boolean;
}) {
  const pieces = useMemo(
    () => CONFETTI.map(() => new Animated.Value(0)),
    [],
  );
  useEffect(() => {
    if (!active || reduceMotion) return;
    const animations = pieces.map(progress =>
      Animated.timing(progress, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    Animated.stagger(35, animations).start();
    return () => animations.forEach(animation => animation.stop());
  }, [active, pieces, reduceMotion]);

  if (!active || reduceMotion) return null;
  return (
    <View
      pointerEvents="none"
      style={styles.confettiLayer}
      accessibilityElementsHidden
    >
      {CONFETTI.map((piece, index) => {
        const progress = pieces[index];
        return (
          <Animated.View
            key={`${piece.x}-${piece.y}`}
            style={[
              styles.confettiPiece,
              { backgroundColor: piece.color },
              {
                opacity: progress.interpolate({
                  inputRange: [0, 0.15, 1],
                  outputRange: [0, 1, 0],
                }),
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, piece.x],
                    }),
                  },
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, piece.y],
                    }),
                  },
                  {
                    rotate: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '170deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/** Status badge pops in once and gives successful orders a brief celebration. */
function StatusBadge({
  tone,
  success,
}: {
  tone: (typeof TONES)[keyof typeof TONES];
  success: boolean;
}) {
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(0.4)).current;
  const ring = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(1);
    } else {
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }
    if (reduceMotion) return;
    const pulse = Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      { iterations: 3 },
    );
    pulse.start();
    return () => pulse.stop();
  }, [reduceMotion, ring, scale]);
  return (
    <View style={styles.badgeWrap} accessibilityElementsHidden>
      {success && <CelebrationBurst active reduceMotion={reduceMotion} />}
      <Animated.View
        style={[
          styles.badgeRing,
          { backgroundColor: tone.ring },
          {
            opacity: ring.interpolate({
              inputRange: [0, 1],
              outputRange: [0.7, 0],
            }),
            transform: [
              {
                scale: ring.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.6],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.badgeOuter,
          { backgroundColor: tone.soft, transform: [{ scale }] },
        ]}
      >
        <View style={[styles.badgeInner, { backgroundColor: tone.ink }]}>
          <Ionicons name={tone.icon as IconName} size={40} color="#FFFFFF" />
        </View>
      </Animated.View>
    </View>
  );
}

function PrimaryButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={18} color="#FFFFFF" />
      <AppText style={styles.primaryText}>{label}</AppText>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={17} color={theme.colors.primary} />
      <AppText style={styles.secondaryText}>{label}</AppText>
    </Pressable>
  );
}

export default function CheckoutResultScreen() {
  const route = useLocalSearchParams<{
    status?: string;
    orderId?: string;
    orderNumber?: string;
    reason?: string;
    paymentMethod?: string;
  }>();
  const insets = useSafeAreaInsets();
  const status = first(route.status);
  const ok = status === 'success';
  const cancelled = status === 'cancelled';
  const orderId = first(route.orderId);
  const orderNumber = first(route.orderNumber);
  const reason = first(route.reason) || null;
  const isCodRoute = first(route.paymentMethod) === 'cod';
  const order = useOrderDetail(orderId);
  const data = order.data;

  const isPartialCod = !!data?.isPartialCod;
  const isCod = isCodRoute && !isPartialCod;
  const tone = ok ? TONES.success : cancelled ? TONES.cancelled : TONES.failure;

  const title = ok
    ? isPartialCod
      ? 'Advance paid, order confirmed!'
      : isCod
      ? 'Order placed!'
      : 'Payment successful!'
    : cancelled
    ? 'Payment not completed'
    : 'Payment failed';
  const message = ok
    ? isPartialCod
      ? "We've received your advance. Pay the rest in cash when your order arrives."
      : isCod
      ? "Your order is placed. Keep the amount ready and pay in cash when it's delivered."
      : "Thanks for shopping with Elexify. We'll keep you posted at every step."
    : cancelled
    ? "You closed the payment window, so this order isn't confirmed yet. If money was debited, check the order before paying again."
    : "We couldn't complete your payment. Your order is saved — you can try paying again.";

  const viewOrder = () =>
    orderId
      ? router.replace({ pathname: '/orders/[id]', params: { id: orderId } })
      : router.replace('/orders');
  const trackOrder = () =>
    orderId
      ? router.replace({
          pathname: '/orders/[id]/track',
          params: { id: orderId },
        })
      : router.replace('/orders');

  const placedOn = data?.createdAt
    ? new Date(data.createdAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  return (
    <View style={[shop.page, styles.page]}>
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <StatusBadge tone={tone} success={ok} />
        <AppText
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          style={styles.title}
        >
          {title}
        </AppText>
        <AppText style={styles.message}>{message}</AppText>

        {!!(orderNumber || orderId) && (
          <View style={styles.card}>
            <View style={styles.orderHead}>
              <View style={styles.flex}>
                <AppText style={styles.label}>Order number</AppText>
                <AppText selectable style={styles.orderNumber}>
                  #{orderNumber || data?.orderNumber || orderId}
                </AppText>
              </View>
              {!!placedOn && (
                <View style={styles.alignEnd}>
                  <AppText style={styles.label}>Placed</AppText>
                  <AppText style={styles.placed}>{placedOn}</AppText>
                </View>
              )}
            </View>

            {data && (
              <View style={styles.amounts}>
                {ok && isPartialCod ? (
                  <>
                    <View style={shop.between}>
                      <AppText style={styles.amountLabel}>
                        Advance paid
                      </AppText>
                      <AppText style={styles.amountPaid}>
                        {money(data.advanceAmount ?? 0)}
                      </AppText>
                    </View>
                    <View style={shop.between}>
                      <AppText style={styles.amountLabel}>
                        Due on delivery
                      </AppText>
                      <AppText style={styles.amountValue}>
                        {money(data.codDueAmount ?? 0)}
                      </AppText>
                    </View>
                  </>
                ) : (
                  <View style={shop.between}>
                    <AppText style={styles.amountLabel}>
                      {!ok
                        ? 'Amount due'
                        : isCod
                          ? 'Pay on delivery'
                          : 'Amount paid'}
                    </AppText>
                    <AppText
                      style={
                        ok && !isCod ? styles.amountPaid : styles.amountValue
                      }
                    >
                      {money(data.grandTotal)}
                    </AppText>
                  </View>
                )}
                <View style={styles.methodRow}>
                  <Ionicons
                    name={
                      data.paymentMethod === 'cod' && !isPartialCod
                        ? 'cash-outline'
                        : 'card-outline'
                    }
                    size={14}
                    color={theme.colors.secondary}
                  />
                  <AppText style={styles.method}>
                    {isPartialCod
                      ? 'Partial Cash on Delivery'
                      : data.paymentMethod === 'cod'
                        ? 'Cash on Delivery'
                        : 'Online payment'}
                  </AppText>
                </View>
              </View>
            )}
          </View>
        )}

        {!ok && !cancelled && !!reason && (
          <View style={styles.reasonBox} accessibilityRole="alert">
            <Ionicons
              name="information-circle"
              size={18}
              color={theme.colors.danger}
            />
            <View style={styles.flex}>
              <AppText style={styles.reasonText}>
                {friendlyReason(reason)}
              </AppText>
              <AppText selectable style={styles.reasonRaw}>
                Reference: {reason}
              </AppText>
            </View>
          </View>
        )}

        {/* Highest-intent moment to ask for notification permission. */}
        {ok && <PushOptInCard variant="order" throttled />}

        {ok ? (
          <View style={styles.deliveryNote}>
            <Ionicons name="notifications-outline" size={18} color={theme.colors.primary} />
            <AppText style={styles.deliveryText}>
              We’ll share updates as your order moves toward delivery.
            </AppText>
          </View>
        ) : (
          !!orderId && (
            <View style={[styles.card, styles.retryNote]}>
              <Ionicons
                name="time-outline"
                size={18}
                color={TONES.cancelled.ink}
              />
              <AppText style={styles.retryText}>
                Complete payment from the order page within 1 hour of placing it
                — after that the order can no longer be paid.
              </AppText>
            </View>
          )
        )}

        <View style={styles.actions}>
          {ok ? (
            <>
              <PrimaryButton
                label="Track order"
                icon="navigate-outline"
                onPress={trackOrder}
              />
              <SecondaryButton
                label="View order details"
                icon="receipt-outline"
                onPress={viewOrder}
              />
            </>
          ) : orderId ? (
            <>
              <PrimaryButton
                label="Complete payment"
                icon="lock-closed"
                onPress={viewOrder}
              />
              <SecondaryButton
                label="Back to cart"
                icon="bag-outline"
                onPress={() => router.replace('/cart')}
              />
            </>
          ) : (
            <PrimaryButton
              label="Try again"
              icon="refresh"
              onPress={() => router.replace('/checkout')}
            />
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/')}
            hitSlop={8}
            style={styles.tertiary}
          >
            <AppText style={styles.tertiaryText}>Continue shopping</AppText>
          </Pressable>
        </View>
      </ScrollView>
      {/* No header on this screen, so give the status bar a solid backdrop —
          otherwise the scrolled content shows through behind the clock. */}
      <View
        pointerEvents="none"
        style={[styles.statusBarBackdrop, { height: insets.top }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  alignEnd: { alignItems: 'flex-end' },
  pressed: { opacity: 0.85 },
  page: { backgroundColor: '#F4F6F8' },
  statusBarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F4F6F8',
  },
  body: { paddingHorizontal: 16, alignItems: 'center', gap: 14 },

  badgeWrap: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiPiece: {
    position: 'absolute',
    width: 7,
    height: 11,
    borderRadius: 2,
  },
  badgeRing: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  badgeOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    lineHeight: 30,
    textAlign: 'center',
    color: theme.colors.text,
  },
  message: {
    maxWidth: 340,
    marginTop: -6,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: theme.colors.secondary,
  },

  card: {
    alignSelf: 'stretch',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  orderHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  label: { fontSize: 11, lineHeight: 15, color: theme.colors.secondary },
  orderNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
  },
  placed: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.text,
  },
  amounts: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  amountLabel: { fontSize: 14, color: theme.colors.text },
  amountValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text,
  },
  amountPaid: { fontFamily: theme.fonts.bold, fontSize: 16, color: GREEN },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  method: { fontSize: 12, color: theme.colors.secondary },

  reasonBox: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  reasonText: { color: theme.colors.danger, fontSize: 13, lineHeight: 19 },
  reasonRaw: { color: '#F87171', fontSize: 11, lineHeight: 16, marginTop: 2 },
  retryNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFBEB',
    shadowOpacity: 0,
    elevation: 0,
  },
  retryText: { flex: 1, fontSize: 13, lineHeight: 19, color: '#92400E' },

  deliveryNote: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
  },
  deliveryText: { flex: 1, color: theme.colors.primaryDark, fontSize: 12, lineHeight: 18 },

  actions: { alignSelf: 'stretch', gap: 10, marginTop: 4 },
  primary: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
  },
  primaryText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
  secondary: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#B2DFDB',
    backgroundColor: '#FFFFFF',
  },
  secondaryText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
  tertiary: { alignSelf: 'center', paddingVertical: 10 },
  tertiaryText: {
    color: theme.colors.secondary,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
  },
});
