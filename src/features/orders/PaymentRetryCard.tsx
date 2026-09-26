import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { AppText } from '../../components/ui';
import { money } from '../../components/shop';
import { theme } from '../../theme';
import { formatTimeLeft } from './paymentWindow';

const AMBER = {
  bg: '#FFFBEB',
  border: '#FDE68A',
  icon: '#D97706',
  text: '#92400E',
  track: '#FEF3C7',
};
const RED = { bg: '#FEF2F2', text: '#B91C1C' };

// Live countdown kept inside the card so only the card re-renders each
// second, not the whole order screen.
function useCountdown(expiresAt: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return Math.max(0, expiresAt - now);
}

/**
 * Pending online payment (prepaid, or a Partial COD advance) on an order that
 * can still be paid within its one-hour window — or, once the window has
 * passed, a closed state pointing the customer back to the store.
 */
export function PaymentRetryCard({
  amount,
  isAdvance,
  failed,
  placedAt,
  windowMs,
  retrying,
  error,
  onPay,
}: {
  amount: number;
  isAdvance: boolean;
  /** Last attempt failed (payment_status "failed") rather than never started. */
  failed: boolean;
  placedAt: number;
  windowMs: number;
  retrying: boolean;
  error: string | null;
  onPay: () => void;
}) {
  const expiresAt = placedAt + windowMs;
  const remaining = useCountdown(expiresAt);
  const expired = remaining <= 0;
  const deadline = new Date(expiresAt).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (expired) {
    return (
      <View style={[styles.card, styles.closed]}>
        <View style={styles.head}>
          <View style={[styles.iconWrap, styles.closedIcon]}>
            <Ionicons name="time-outline" size={20} color="#6B7280" />
          </View>
          <View style={styles.flex}>
            <AppText style={styles.title}>Payment window closed</AppText>
            <AppText style={styles.body}>
              This order wasn't paid within an hour, so it can no longer be
              completed. Please place a new order.
            </AppText>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/')}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        >
          <Ionicons name="bag-outline" size={16} color={theme.colors.primary} />
          <AppText style={styles.secondaryText}>Continue shopping</AppText>
        </Pressable>
      </View>
    );
  }

  const progress = Math.min(1, remaining / windowMs);
  const urgent = remaining < 10 * 60 * 1000;

  return (
    <View style={styles.card} accessibilityLabel="Payment pending">
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={failed ? 'alert-circle-outline' : 'wallet-outline'}
            size={20}
            color={AMBER.icon}
          />
        </View>
        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <AppText style={styles.title}>
              {failed ? 'Payment failed' : 'Payment pending'}
            </AppText>
            <View
              style={[styles.chip, urgent && styles.chipUrgent]}
              accessibilityLabel={`${formatTimeLeft(remaining)} to pay`}
            >
              <Ionicons
                name="time-outline"
                size={12}
                color={urgent ? RED.text : AMBER.text}
              />
              <AppText
                style={[styles.chipText, urgent && styles.chipTextUrgent]}
              >
                {formatTimeLeft(remaining)}
              </AppText>
            </View>
          </View>
          <AppText style={styles.body}>
            {failed ? 'Your last attempt didn’t go through. ' : ''}
            Complete payment by {deadline} to confirm your order.
          </AppText>
        </View>
      </View>

      <View
        style={styles.track}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View
          style={[
            styles.fill,
            { width: `${progress * 100}%` },
            urgent && styles.fillUrgent,
          ]}
        />
      </View>

      {!!error && (
        <View accessibilityRole="alert" style={styles.error}>
          <Ionicons name="close-circle" size={16} color={RED.text} />
          <AppText style={styles.errorText}>{error}</AppText>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: retrying, busy: retrying }}
        accessibilityLabel={`Pay ${money(amount)} now`}
        disabled={retrying}
        onPress={onPay}
        style={({ pressed }) => [
          styles.pay,
          pressed && styles.pressed,
          retrying && styles.payBusy,
        ]}
      >
        {retrying ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
        )}
        <AppText style={styles.payText}>
          {retrying
            ? 'Opening secure checkout…'
            : `Pay ${money(amount)}${isAdvance ? ' advance' : ''} now`}
        </AppText>
      </Pressable>

      <View style={styles.secure}>
        <Ionicons
          name="shield-checkmark-outline"
          size={13}
          color={theme.colors.secondary}
        />
        <AppText style={styles.secureText}>
          Secured by Razorpay · UPI, cards, net banking & wallets
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    gap: 9,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AMBER.border,
    backgroundColor: AMBER.bg,
  },
  closed: { borderColor: theme.colors.border, backgroundColor: '#F9FAFB' },
  head: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: AMBER.border,
  },
  closedIcon: { borderColor: theme.colors.border },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
    color: theme.colors.text,
  },
  body: { fontSize: 12, lineHeight: 17, color: '#4B5563', marginTop: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: AMBER.track,
  },
  chipUrgent: { backgroundColor: '#FEE2E2' },
  chipText: {
    fontSize: 12,
    fontFamily: theme.fonts.semibold,
    color: AMBER.text,
    fontVariant: ['tabular-nums'],
  },
  chipTextUrgent: { color: RED.text },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: AMBER.track,
  },
  fill: { height: 4, borderRadius: 2, backgroundColor: AMBER.icon },
  fillUrgent: { backgroundColor: theme.colors.danger },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: RED.bg,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18, color: RED.text },
  pay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  payBusy: { opacity: 0.85 },
  payText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  secure: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: -2,
  },
  secureText: { fontSize: 11, color: theme.colors.secondary },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#B2DFDB',
    backgroundColor: '#FFFFFF',
  },
  secondaryText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
});
