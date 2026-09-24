import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText, Button, Feedback, OtpInput } from '../../components/ui';
import { ShopHeader, shop } from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { useAccount } from '../auth/hooks';
import {
  useChangePassword,
  useRequestEmailChange,
  useRequestMobileChange,
  useResendAccountOtp,
  useVerifyEmailChange,
  useVerifyMobileChange,
} from './hooks';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobilePattern = /^[6-9]\d{9}$/;
const otpPattern = /^\d{6}$/;

function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <View
      style={[
        styles.badge,
        verified ? styles.badgeVerified : styles.badgeUnverified,
      ]}
    >
      <Ionicons
        name={verified ? 'checkmark-circle' : 'close-circle'}
        size={12}
        color={verified ? theme.colors.primary : theme.colors.danger}
      />
      <AppText
        style={[
          styles.badgeText,
          { color: verified ? theme.colors.primary : theme.colors.danger },
        ]}
      >
        {verified ? 'Verified' : 'Unverified'}
      </AppText>
    </View>
  );
}

function ChangeContactCard({
  channel,
  current,
  verified,
  pending,
}: {
  channel: 'email' | 'mobile';
  current: string | null;
  verified: boolean;
  pending: string | null;
}) {
  const [step, setStep] = useState<'idle' | 'enter' | 'otp'>('idle');
  const [value, setValue] = useState('');
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const requestEmail = useRequestEmailChange();
  const requestMobile = useRequestMobileChange();
  const verifyEmail = useVerifyEmailChange();
  const verifyMobile = useVerifyMobileChange();
  const resend = useResendAccountOtp();

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const label = channel === 'email' ? 'Email' : 'Mobile Number';
  const pattern = channel === 'email' ? emailPattern : mobilePattern;
  const requesting = channel === 'email' ? requestEmail : requestMobile;
  const verifying = channel === 'email' ? verifyEmail : verifyMobile;

  const startFlow = () => {
    setStep('enter');
    setValue('');
    setError('');
  };
  const cancel = () => {
    setStep('idle');
    setError('');
  };
  const sendOtp = () => {
    setError('');
    const trimmed = value.trim();
    const mutate =
      channel === 'email' ? requestEmail.mutate : requestMobile.mutate;
    mutate(trimmed, {
      onSuccess: () => {
        setOtp('');
        setStep('otp');
        setCooldown(60);
      },
      onError: err => setError(err.message),
    });
  };
  const submitOtp = () => {
    setError('');
    const mutate =
      channel === 'email' ? verifyEmail.mutate : verifyMobile.mutate;
    mutate(otp, {
      onSuccess: () => setStep('idle'),
      onError: err => setError(err.message),
    });
  };
  const onResend = () => {
    if (cooldown > 0) {
      return;
    }
    resend.mutate(channel === 'email' ? 'change_email' : 'change_mobile', {
      onSuccess: () => setCooldown(60),
    });
  };

  return (
    <View style={styles.card}>
      <View style={shop.between}>
        <View style={shop.flex}>
          <AppText style={shop.muted}>{label}</AppText>
          <AppText style={styles.value} numberOfLines={1}>
            {current || 'Not set'}
          </AppText>
          {!!pending && (
            <AppText style={styles.pending}>Change pending: {pending}</AppText>
          )}
        </View>
        <VerifiedBadge verified={verified} />
        {step === 'idle' && (
          <Pressable accessibilityRole="button" onPress={startFlow}>
            <AppText style={shop.link}>Change</AppText>
          </Pressable>
        )}
      </View>

      {step === 'enter' && (
        <View style={styles.form}>
          <TextInput
            accessibilityLabel={`New ${label.toLowerCase()}`}
            value={value}
            onChangeText={
              channel === 'mobile'
                ? v => setValue(v.replace(/\D/g, ''))
                : setValue
            }
            placeholder={
              channel === 'email' ? 'you@example.com' : '10-digit mobile number'
            }
            placeholderTextColor={theme.colors.secondary}
            keyboardType={channel === 'email' ? 'email-address' : 'number-pad'}
            maxLength={channel === 'mobile' ? 10 : undefined}
            autoCapitalize="none"
            autoFocus
            style={styles.input}
          />
          {!!error && <AppText style={styles.error}>{error}</AppText>}
          <View style={styles.row}>
            <View style={shop.flex}>
              <Button
                label={requesting.isPending ? 'Sending…' : 'Send OTP'}
                disabled={!pattern.test(value.trim()) || requesting.isPending}
                onPress={sendOtp}
              />
            </View>
            <View style={shop.flex}>
              <Button label="Cancel" onPress={cancel} />
            </View>
          </View>
        </View>
      )}

      {step === 'otp' && (
        <View style={styles.form}>
          <AppText style={shop.muted}>
            Enter the 6-digit code sent to your new {label.toLowerCase()}
          </AppText>
          <OtpInput value={otp} onChange={setOtp} autoFocus />
          {!!error && <AppText style={styles.error}>{error}</AppText>}
          <Button
            label={verifying.isPending ? 'Verifying…' : 'Verify'}
            disabled={!otpPattern.test(otp) || verifying.isPending}
            onPress={submitOtp}
          />
          <View style={shop.between}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setStep('enter')}
            >
              <AppText style={shop.link}>Back</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={cooldown > 0}
              onPress={onResend}
            >
              <AppText style={[shop.link, cooldown > 0 && styles.disabledLink]}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
              </AppText>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function PasswordCard() {
  const [showForm, setShowForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const changePassword = useChangePassword();

  const canSubmit =
    currentPassword.length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

  const submit = () => {
    setError('');
    changePassword.mutate(
      { currentPassword, password, confirmPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setPassword('');
          setConfirmPassword('');
          setShowForm(false);
          setSuccess(true);
        },
        onError: err => setError(err.message),
      },
    );
  };

  return (
    <View style={styles.card}>
      <View style={shop.between}>
        <View style={shop.flex}>
          <AppText style={shop.muted}>Password</AppText>
          <AppText style={styles.value}>••••••••</AppText>
        </View>
        {!showForm && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSuccess(false);
              setShowForm(true);
            }}
          >
            <AppText style={shop.link}>Change</AppText>
          </Pressable>
        )}
      </View>
      {success && (
        <AppText style={styles.success}>Password changed successfully.</AppText>
      )}
      {showForm && (
        <View style={styles.form}>
          <TextInput
            accessibilityLabel="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            placeholderTextColor={theme.colors.secondary}
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            accessibilityLabel="New password"
            value={password}
            onChangeText={setPassword}
            placeholder="New password"
            placeholderTextColor={theme.colors.secondary}
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            accessibilityLabel="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={theme.colors.secondary}
            secureTextEntry
            style={styles.input}
          />
          {!!error && <AppText style={styles.error}>{error}</AppText>}
          <View style={styles.row}>
            <View style={shop.flex}>
              <Button
                label={
                  changePassword.isPending ? 'Updating…' : 'Update password'
                }
                disabled={!canSubmit || changePassword.isPending}
                onPress={submit}
              />
            </View>
            <View style={shop.flex}>
              <Button label="Cancel" onPress={() => setShowForm(false)} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export default function SecurityScreen() {
  const account = useAccount();

  return (
    <View style={shop.page}>
      <ShopHeader title="Security" back />
      <KeyboardAvoidingView
        style={shop.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <QueryState
            pending={account.isPending}
            error={account.error}
            paused={account.fetchStatus === 'paused'}
            retry={() => {
              account.refetch().catch(() => undefined);
            }}
          />
          {!account.isPending && !account.isError && !account.data && (
            <Feedback
              title="Unable to load your details"
              message="Please try again."
            />
          )}
          {account.data && (
            <>
              <ChangeContactCard
                channel="email"
                current={account.data.email}
                verified={account.data.emailVerified}
                pending={account.data.pendingEmail}
              />
              <ChangeContactCard
                channel="mobile"
                current={
                  account.data.mobile
                    ? `+${account.data.phoneCode} ${account.data.mobile}`
                    : null
                }
                verified={account.data.mobileVerified}
                pending={account.data.pendingMobile}
              />
              <PasswordCard />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 14 },
  card: {
    gap: 10,
    padding: 14,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  value: { fontFamily: theme.fonts.medium, fontSize: 15 },
  pending: { color: '#A65C00', fontSize: 12 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeVerified: { backgroundColor: theme.colors.primaryLight },
  badgeUnverified: { backgroundColor: '#FEF3E7' },
  badgeText: { fontFamily: theme.fonts.medium, fontSize: 11 },
  form: {
    gap: 10,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    color: theme.colors.text,
  },
  row: { flexDirection: 'row', gap: 10 },
  error: { color: theme.colors.danger, fontSize: 13 },
  success: { color: theme.colors.primary, fontSize: 13 },
  disabledLink: { opacity: 0.5 },
});
