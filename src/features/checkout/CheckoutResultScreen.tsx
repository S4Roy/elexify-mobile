import React, { useEffect, useRef } from 'react';
import {
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
import { SkeletonBlock, StoreImage, money, shop } from '../../components/shop';
import { theme } from '../../theme';
import { useOrderDetail } from '../orders/hooks';
import { friendlyReason } from './friendlyReason';

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

const MAX_THUMBS = 4;

/** Status badge that pops in, with a soft ring pulsing out behind it. */
function StatusBadge({ tone }: { tone: (typeof TONES)[keyof typeof TONES] }) {
  const scale = useRef(new Animated.Value(0.4)).current;
  const ring = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();
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
  }, [ring, scale]);
  return (
    <View style={styles.badgeWrap} accessibilityElementsHidden>
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

function NextStep({
  icon,
  title,
  text,
  done,
  last,
}: {
  icon: IconName;
  title: string;
  text: string;
  done?: boolean;
  last?: boolean;
}) {
  return (
    <View style={styles.next}>
      <View style={styles.nextRail}>
        <View style={[styles.nextDot, done && styles.nextDotDone]}>
          <Ionicons
            name={done ? 'checkmark' : icon}
            size={done ? 13 : 14}
            color={done ? '#FFFFFF' : theme.colors.primary}
          />
        </View>
        {!last && (
          <View style={[styles.nextLine, done && styles.nextLineDone]} />
        )}
      </View>
      <View style={[styles.flex, !last && styles.nextBody]}>
        <AppText style={styles.nextTitle}>{title}</AppText>
        <AppText style={styles.nextText}>{text}</AppText>
      </View>
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

  const thumbs = data?.items.slice(0, MAX_THUMBS) ?? [];
  const extra = (data?.items.length ?? 0) - thumbs.length;
  const itemCount = data?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
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
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <StatusBadge tone={tone} />
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

            {order.isPending && !!orderId ? (
              <View style={styles.skeleton}>
                <View style={styles.thumbRow}>
                  {[0, 1, 2].map(i => (
                    <SkeletonBlock key={i} style={styles.thumb} />
                  ))}
                </View>
                <SkeletonBlock style={styles.skeletonLine} />
                <SkeletonBlock style={styles.skeletonLineShort} />
              </View>
            ) : data ? (
              <>
                <View style={styles.itemsRow}>
                  <View style={styles.thumbRow}>
                    {thumbs.map(item => (
                      <View key={item.id} style={styles.thumb}>
                        <StoreImage
                          uri={item.image}
                          label={item.name}
                          style={styles.thumbImage}
                        />
                      </View>
                    ))}
                    {extra > 0 && (
                      <View style={[styles.thumb, styles.thumbMore]}>
                        <AppText style={styles.thumbMoreText}>+{extra}</AppText>
                      </View>
                    )}
                  </View>
                  <AppText style={styles.itemCount}>
                    {itemCount} item{itemCount === 1 ? '' : 's'}
                  </AppText>
                </View>

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
              </>
            ) : null}
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

        {ok ? (
          <View style={styles.card}>
            <AppText style={styles.cardTitle}>What happens next</AppText>
            <NextStep
              icon="checkmark"
              title="Order confirmed"
              text="Your order is in. You can see its details any time in My orders."
              done
            />
            <NextStep
              icon="cube-outline"
              title="Packed & shipped"
              text="We'll pack your items and ship them to your address."
            />
            <NextStep
              icon="navigate-outline"
              title="Track your delivery"
              text="Follow every update from My orders."
              last
            />
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
    </View>
  );
}

      {/* No header on this screen, so give the status bar a solid backdrop —
          otherwise the scrolled content shows through behind the clock. */}
      <View
        pointerEvents="none"
        style={[styles.statusBarBackdrop, { height: insets.top }]}
      />
const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  alignEnd: { alignItems: 'flex-end' },
  pressed: { opacity: 0.85 },
  page: { backgroundColor: '#F4F6F8' },
  body: { paddingHorizontal: 16, alignItems: 'center', gap: 14 },

  badgeWrap: {
    width: 128,
  statusBarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F4F6F8',
  },
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badgeRing: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  badgeOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
    color: theme.colors.text,
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
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  thumbRow: { flexDirection: 'row', gap: 8 },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbMore: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  thumbMoreText: {
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
    color: theme.colors.secondary,
  },
  itemCount: { fontSize: 12, color: theme.colors.secondary },
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
  skeleton: { gap: 10 },
  skeletonLine: { height: 14, width: '70%' },
  skeletonLineShort: { height: 12, width: '40%' },

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

  next: { flexDirection: 'row', gap: 12 },
  nextRail: { alignItems: 'center' },
  nextDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  nextDotDone: { backgroundColor: theme.colors.primary },
  nextLine: {
    flex: 1,
    width: 2,
    marginVertical: 3,
    borderRadius: 1,
    backgroundColor: '#E5E7EB',
  },
  nextLineDone: { backgroundColor: theme.colors.primary },
  nextBody: { paddingBottom: 14 },
  nextTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  nextText: { fontSize: 12, lineHeight: 18, color: theme.colors.secondary },

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
