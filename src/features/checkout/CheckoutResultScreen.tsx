import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText, Button } from '../../components/ui';
import { shop } from '../../components/shop';
import { theme } from '../../theme';
import { friendlyReason } from './friendlyReason';

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? '';

const STEPS_PAID = ['Payment received', 'Order confirmed', 'Processing soon'];
const STEPS_COD = ['Order confirmed', 'Pay on delivery', 'Processing soon'];

export default function CheckoutResultScreen() {
  const route = useLocalSearchParams<{
    status?: string;
    orderId?: string;
    orderNumber?: string;
    reason?: string;
    paymentMethod?: string;
  }>();
  const status = first(route.status);
  const ok = status === 'success';
  const cancelled = status === 'cancelled';
  const orderId = first(route.orderId);
  const orderNumber = first(route.orderNumber);
  const reason = first(route.reason) || null;
  const isCod = first(route.paymentMethod) === 'cod';

  const icon = ok ? 'checkmark-circle' : cancelled ? 'refresh-circle' : 'close-circle';
  const tint = ok ? theme.colors.primary : cancelled ? theme.colors.secondary : theme.colors.danger;
  const eyebrow = ok ? 'Order placed' : cancelled ? 'Payment window closed' : 'Payment unsuccessful';
  const title = ok
    ? isCod
      ? 'Order placed successfully!'
      : 'Payment successful!'
    : cancelled
      ? 'Payment cancelled'
      : 'Something went wrong';
  const message = ok
    ? isCod
      ? "Your order has been placed. Pay in cash when it's delivered to you."
      : "Your purchase was successful. We'll send updates every step of the way."
    : cancelled
      ? 'You closed the payment window. If money was debited, check your order before making another payment.'
      : "We couldn't process your order. Please try again or contact us if the issue continues.";

  const viewOrder = () =>
    orderId
      ? router.replace({ pathname: '/orders/[id]', params: { id: orderId } })
      : router.replace('/orders');

  return (
    <View style={[shop.page, styles.center]}>
      <Ionicons name={icon} size={72} color={tint} />
      <AppText style={[styles.eyebrow, { color: tint }]}>{eyebrow.toUpperCase()}</AppText>
      <AppText accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
      <AppText style={[shop.muted, styles.message]}>{message}</AppText>

      {ok && (
        <View style={styles.steps}>
          {(isCod ? STEPS_COD : STEPS_PAID).map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={[styles.stepDot, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
              <AppText style={styles.stepLabel}>{step}</AppText>
              {index < (isCod ? STEPS_COD : STEPS_PAID).length - 1 && <View style={styles.stepLine} />}
            </View>
          ))}
        </View>
      )}

      {ok && !!orderNumber && (
        <View style={styles.orderCard}>
          <AppText style={shop.muted}>Order number</AppText>
          <AppText style={styles.orderNumber}>{orderNumber}</AppText>
        </View>
      )}

      {!ok && !cancelled && reason && (
        <View style={styles.reasonBox}>
          <AppText style={styles.reasonText}>{friendlyReason(reason)}</AppText>
          <AppText style={styles.reasonRaw}>Reference: {reason}</AppText>
        </View>
      )}

      <View style={styles.actions}>
        {ok || cancelled ? (
          <>
            <Button label="View order" onPress={viewOrder} />
            <AppText accessibilityRole="button" onPress={() => router.replace('/')} style={[shop.link, styles.secondaryAction]}>
              Continue shopping
            </AppText>
          </>
        ) : (
          <>
            <Button label="Try again" onPress={() => router.replace('/checkout')} />
            <AppText
              accessibilityRole="button"
              onPress={() => router.replace('/')}
              style={[shop.link, styles.secondaryAction]}
            >
              Continue shopping
            </AppText>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  eyebrow: { fontFamily: theme.fonts.bold, fontSize: 11, letterSpacing: 1, marginTop: 4 },
  title: { fontFamily: theme.fonts.bold, fontSize: 22, textAlign: 'center', marginTop: 4 },
  message: { textAlign: 'center', maxWidth: 320 },
  steps: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16, alignSelf: 'stretch', justifyContent: 'center' },
  stepRow: { alignItems: 'center', flexDirection: 'row' },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 10, maxWidth: 64, textAlign: 'center', marginHorizontal: 4 },
  stepLine: { height: 2, width: 20, backgroundColor: theme.colors.border },
  orderCard: {
    width: '100%',
    maxWidth: 320,
    marginTop: 12,
    padding: 14,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.primaryLight,
    gap: 2,
  },
  orderNumber: { fontFamily: theme.fonts.bold, fontSize: 16 },
  reasonBox: {
    width: '100%',
    maxWidth: 320,
    marginTop: 12,
    padding: 14,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    gap: 6,
  },
  reasonText: { color: theme.colors.danger, fontSize: 13, lineHeight: 18 },
  reasonRaw: { color: '#F87171', fontSize: 11 },
  actions: { gap: 10, width: '100%', maxWidth: 320, marginTop: 20, alignItems: 'center' },
  secondaryAction: { paddingVertical: 8 },
});
