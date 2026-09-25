import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { AppText, OtpInput } from '../../components/ui';
import { ShopHeader, SkeletonBlock, shop } from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { useSession } from '../../stores/session';
import {
  useAccountDeletionStatus,
  useConfirmAccountDeletion,
  useRequestAccountDeletion,
} from './hooks';

// Permanent, OTP-confirmed account deletion (Google Play requirement). Same
// flow and copy as elexify.online/account/delete; the backend refuses while
// an order, return or refund is still in progress.

const SUPPORT_EMAIL = 'support@elexify.online';
const RESEND_SECONDS = 60;
const otpPattern = /^\d{6}$/;
const RED = '#DC2626';

const REASON_LABELS: Record<string, string> = {
  no_longer_needed: "I don't need it anymore",
  another_account: 'I have another account',
  privacy: 'Privacy concerns',
  too_many_messages: 'Too many messages or notifications',
  bad_experience: 'I had a bad experience',
  other: 'Something else',
};

const DELETED = [
  'Your name, email, mobile number, date of birth and profile photo',
  'Saved addresses, cart, wishlist and recently viewed items',
  'Notification preferences, app notifications and newsletter subscription',
];
const KEPT = [
  'Orders, invoices, payments and returns. Indian tax law requires us to keep these for up to 8 years.',
  'Reviews you published, shown as from "Deleted user"',
];

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={styles.bullets}>
      {items.map(item => (
        <View key={item} style={styles.bulletRow}>
          <View style={styles.dot} />
          <AppText style={styles.bulletText}>{item}</AppText>
        </View>
      ))}
    </View>
  );
}

function Deleted() {
  return (
    <View style={styles.doneWrap}>
      <View style={styles.doneIcon}>
        <Ionicons name="checkmark" size={30} color="#FFFFFF" />
      </View>
      <AppText style={styles.doneTitle}>Your account has been deleted</AppText>
      <AppText style={styles.doneText}>
        Your personal data has been removed and you've been signed out on every device. You're
        welcome to create a new account any time.
      </AppText>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace('/')}
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
      >
        <AppText style={styles.primaryText}>Continue shopping</AppText>
      </Pressable>
    </View>
  );
}

export default function DeleteAccountScreen() {
  const signOut = useSession(s => s.signOut);
  const sessionStatus = useSession(s => s.status);
  const status = useAccountDeletionStatus();
  const requestCode = useRequestAccountDeletion();
  const confirm = useConfirmAccountDeletion();

  const [reason, setReason] = useState<string | null>(null);
  const [understood, setUnderstood] = useState(false);
  const [step, setStep] = useState<'confirm' | 'otp' | 'done'>('confirm');
  const [otp, setOtp] = useState('');
  const [otpRequest, setOtpRequest] = useState(0);
  const [destination, setDestination] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const data = status.data;
  const isEmail = (data?.otpChannel ?? 'sms') === 'email';

  const sendCode = () => {
    if (requestCode.isPending || cooldown > 0) {
      return;
    }
    setError('');
    requestCode.mutate(undefined, {
      onSuccess: res => {
        setDestination(res.otpDestination ?? data?.otpDestination ?? null);
        setOtp('');
        setStep('otp');
        setCooldown(RESEND_SECONDS);
        setOtpRequest(n => n + 1);
      },
      onError: err => {
        setError(err.message);
        // A new order or return may be what's blocking it now.
        status.refetch().catch(() => undefined);
      },
    });
  };

  const submit = (code = otp) => {
    if (confirm.isPending || !otpPattern.test(code)) {
      return;
    }
    setError('');
    confirm.mutate(
      { otp: code, reason },
      {
        onSuccess: () => {
          setStep('done');
          signOut().catch(() => undefined);
        },
        onError: err => {
          setOtp('');
          setError(err.message);
        },
      },
    );
  };

  if (step === 'done') {
    return (
      <View style={[shop.page, styles.page]}>
        <ShopHeader title="Delete account" />
        <Deleted />
      </View>
    );
  }

  // Opened from a link while signed out (e.g. elexify.online/account/delete).
  if (sessionStatus === 'guest') {
    return (
      <View style={[shop.page, styles.page]}>
        <ShopHeader title="Delete account" back />
        <View style={styles.body}>
          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Sign in to delete your account</AppText>
            <AppText style={styles.bodyText}>
              Sign in with the mobile number or Google account you use, so we can confirm the
              account is yours.
            </AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/login')}
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
            >
              <AppText style={styles.primaryText}>Sign in</AppText>
            </Pressable>
          </View>
          <View style={styles.card}>
            <AppText style={styles.cardTitle}>What we delete</AppText>
            <Bullets items={DELETED} />
          </View>
          <View style={styles.card}>
            <AppText style={styles.cardTitle}>What we keep, and why</AppText>
            <Bullets items={KEPT} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[shop.page, styles.page]}>
      <ShopHeader title="Delete account" back />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <QueryState
            pending={status.isPending}
            error={status.error}
            paused={status.fetchStatus === 'paused'}
            retry={() => {
              status.refetch().catch(() => undefined);
            }}
            skeleton={
              <View style={styles.skeleton}>
                <SkeletonBlock style={styles.skeletonCard} />
                <SkeletonBlock style={styles.skeletonCard} />
              </View>
            }
          />

          {data && data.blockers.length > 0 && (
            <View style={[styles.card, styles.blockedCard]}>
              <View style={styles.cardHead}>
                <Ionicons name="time-outline" size={20} color="#B45309" />
                <AppText style={styles.cardTitle}>You can't delete your account yet</AppText>
              </View>
              <Bullets items={data.blockers.map(b => b.message)} />
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/orders')}
                hitSlop={8}
              >
                <AppText style={styles.link}>View my orders</AppText>
              </Pressable>
            </View>
          )}

          {data && data.blockers.length === 0 && !data.otpChannel && (
            <View style={styles.card}>
              <AppText style={styles.bodyText}>
                Add a mobile number or email in Login & security so we can confirm it's you, then
                come back here.
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/account/security')}
                hitSlop={8}
              >
                <AppText style={styles.link}>Open Login & security</AppText>
              </Pressable>
            </View>
          )}

          {data && data.canDelete && step === 'confirm' && (
            <View style={[styles.card, styles.dangerCard]}>
              <View style={styles.warning}>
                <Ionicons name="warning-outline" size={18} color={RED} />
                <AppText style={styles.warningText}>
                  This is permanent. You'll lose access to your order history and invoices in the
                  app, so download any invoices you need first.
                </AppText>
              </View>

              <AppText style={styles.sectionLabel}>
                Why are you leaving? <AppText style={styles.optional}>(optional)</AppText>
              </AppText>
              <View style={styles.reasons}>
                {data.reasons.map(code => {
                  const selected = reason === code;
                  return (
                    <Pressable
                      key={code}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => setReason(selected ? null : code)}
                      style={[styles.reason, selected && styles.reasonSelected]}
                    >
                      <Ionicons
                        name={selected ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={selected ? theme.colors.primary : '#9CA3AF'}
                      />
                      <AppText style={styles.reasonText}>{REASON_LABELS[code] ?? code}</AppText>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: understood }}
                onPress={() => setUnderstood(u => !u)}
                style={styles.check}
              >
                <Ionicons
                  name={understood ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={understood ? RED : '#9CA3AF'}
                />
                <AppText style={styles.checkText}>
                  I understand my account and personal data will be permanently deleted and can't
                  be recovered.
                </AppText>
              </Pressable>

              {!!error && <AppText style={styles.error}>{error}</AppText>}

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !understood, busy: requestCode.isPending }}
                disabled={!understood || requestCode.isPending}
                onPress={sendCode}
                style={({ pressed }) => [
                  styles.danger,
                  (!understood || requestCode.isPending) && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                {requestCode.isPending && <ActivityIndicator color="#FFFFFF" size="small" />}
                <AppText style={styles.primaryText}>
                  {requestCode.isPending ? 'Sending code…' : 'Continue'}
                </AppText>
              </Pressable>
              {!!data.otpDestination && (
                <AppText style={styles.helper}>
                  We'll send a code to {data.otpDestination} to confirm it's you.
                </AppText>
              )}
            </View>
          )}

          {data && step === 'otp' && (
            <View style={[styles.card, styles.dangerCard]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setError('');
                  setStep('confirm');
                }}
                hitSlop={8}
                style={styles.back}
              >
                <Ionicons name="chevron-back" size={14} color={theme.colors.secondary} />
                <AppText style={styles.helper}>Back</AppText>
              </Pressable>
              <AppText style={styles.cardTitle}>Enter the code to confirm</AppText>
              <AppText style={styles.bodyText}>
                We sent a 6-digit code to {destination ?? 'your registered contact'}.
              </AppText>
              <OtpInput
                value={otp}
                onChange={setOtp}
                autoFocus
                smsConsent={!isEmail}
                listenKey={otpRequest}
              />
              {!!error && <AppText style={styles.error}>{error}</AppText>}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !otpPattern.test(otp), busy: confirm.isPending }}
                disabled={!otpPattern.test(otp) || confirm.isPending}
                onPress={() => submit()}
                style={({ pressed }) => [
                  styles.danger,
                  (!otpPattern.test(otp) || confirm.isPending) && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                {confirm.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="trash-outline" size={17} color="#FFFFFF" />
                )}
                <AppText style={styles.primaryText}>
                  {confirm.isPending ? 'Deleting…' : 'Delete my account permanently'}
                </AppText>
              </Pressable>
              <View style={styles.resendRow}>
                <AppText style={styles.helper}>Didn't get it?</AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: cooldown > 0 }}
                  disabled={cooldown > 0 || requestCode.isPending}
                  onPress={sendCode}
                  hitSlop={8}
                >
                  <AppText style={[styles.link, cooldown > 0 && styles.linkDisabled]}>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                  </AppText>
                </Pressable>
              </View>
            </View>
          )}

          {data && (
            <>
              <View style={styles.card}>
                <AppText style={styles.cardTitle}>What we delete</AppText>
                <Bullets items={DELETED} />
              </View>
              <View style={styles.card}>
                <AppText style={styles.cardTitle}>What we keep, and why</AppText>
                <Bullets items={KEPT} />
                <AppText style={styles.helper}>
                  These records are no longer linked to a usable account and are only used for
                  accounting, tax and legal purposes.
                </AppText>
              </View>
              <AppText style={styles.footnote}>
                Need help? Email{' '}
                <AppText
                  style={styles.link}
                  onPress={() =>
                    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Delete%20my%20account`).catch(
                      () => undefined,
                    )
                  }
                >
                  {SUPPORT_EMAIL}
                </AppText>
              </AppText>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { backgroundColor: '#F4F6F8' },
  body: { padding: 16, gap: 12, paddingBottom: 32 },
  skeleton: { gap: 12 },
  skeletonCard: { height: 150, borderRadius: 16 },
  card: {
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dangerCard: { borderColor: '#FECACA' },
  blockedCard: { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.text,
  },
  bodyText: { fontSize: 14, lineHeight: 20, color: theme.colors.secondary },
  bullets: { gap: 6 },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 8,
    backgroundColor: '#9CA3AF',
  },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 19, color: theme.colors.secondary },
  warning: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  warningText: { flex: 1, fontSize: 13, lineHeight: 19, color: '#991B1B' },
  sectionLabel: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
    marginTop: 4,
  },
  optional: { fontSize: 13, color: '#9CA3AF' },
  reasons: { gap: 8 },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reasonSelected: { borderColor: theme.colors.primary, backgroundColor: '#F1F9F7' },
  reasonText: { flex: 1, fontSize: 14, lineHeight: 20, color: theme.colors.text },
  check: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 4 },
  checkText: { flex: 1, fontSize: 13, lineHeight: 19, color: theme.colors.text },
  error: { fontSize: 13, lineHeight: 18, color: RED },
  danger: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RED,
    paddingHorizontal: 16,
  },
  primary: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
  },
  primaryText: { color: '#FFFFFF', fontFamily: theme.fonts.semibold, fontSize: 15 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  helper: { fontSize: 12, lineHeight: 17, color: theme.colors.secondary },
  link: { color: theme.colors.primary, fontFamily: theme.fonts.semibold, fontSize: 13 },
  linkDisabled: { color: '#9CA3AF' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  footnote: {
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  doneIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
  },
  doneTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 18,
    lineHeight: 25,
    color: theme.colors.text,
    textAlign: 'center',
  },
  doneText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
});
