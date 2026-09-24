import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { AppText, Button, OtpInput } from '../../components/ui';
import { ShopHeader, shop } from '../../components/shop';
import { theme } from '../../theme';
import { googleConfig } from '../../api/config';
import { useGoogleSignIn, useSendOtp, useVerifyOtp } from './hooks';

const mobilePattern = /^[6-9]\d{9}$/;
const otpPattern = /^\d{6}$/;

export default function LoginScreen() {
  const [step, setStep] = useState<'identity' | 'verify'>('identity');
  const [mobile, setMobile] = useState('');
  const [isExisting, setIsExisting] = useState(true);
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();
  const googleSignIn = useGoogleSignIn();

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const requestOtp = () => {
    setError(null);
    sendOtp.mutate(mobile, {
      onSuccess: result => {
        setIsExisting(result.isExistingUser);
        setOtp('');
        setStep('verify');
        setCooldown(60);
      },
      onError: err => setError(err.message),
    });
  };
  const submitOtp = () => {
    setError(null);
    verifyOtp.mutate(
      {
        mobile,
        otp,
        firstName: isExisting ? undefined : firstName.trim(),
        lastName: isExisting ? undefined : lastName.trim(),
      },
      {
        onSuccess: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/account');
          }
        },
        onError: err => setError(err.message),
      },
    );
  };

  return (
    <View style={shop.page}>
      <ShopHeader title="Sign in" back />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'identity' ? (
            <>
              <Image
                source={require('../../assets/images/Logo.png')}
                accessibilityLabel="Elexify"
                style={styles.heroLogo}
              />
              <AppText style={[shop.heading, styles.centerText]}>
                Enter your mobile number
              </AppText>
              <AppText style={[shop.muted, styles.centerText]}>
                We'll send a one-time password to verify it's you.
              </AppText>
              <View
                style={[
                  styles.mobileRow,
                  touched && !mobilePattern.test(mobile) && styles.invalid,
                ]}
              >
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={theme.colors.secondary}
                />
                <AppText style={styles.prefix}>+91</AppText>
                <View style={styles.prefixDivider} />
                <TextInput
                  accessibilityLabel="Mobile number"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={mobile}
                  onChangeText={v => setMobile(v.replace(/\D/g, ''))}
                  onBlur={() => setTouched(true)}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={theme.colors.secondary}
                  autoFocus
                  style={styles.input}
                />
              </View>
              {touched && !mobilePattern.test(mobile) && (
                <AppText style={styles.fieldError}>
                  Enter a valid 10-digit mobile number.
                </AppText>
              )}
              {!!error && (
                <View accessibilityRole="alert" style={styles.errorBanner}>
                  <Ionicons
                    name="alert-circle"
                    size={16}
                    color={theme.colors.danger}
                  />
                  <AppText style={styles.errorText}>{error}</AppText>
                </View>
              )}
              <Button
                label={sendOtp.isPending ? 'Sending…' : 'Send OTP'}
                disabled={!mobilePattern.test(mobile) || sendOtp.isPending}
                onPress={requestOtp}
              />
              {!!googleConfig.webClientId && (
                <>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <AppText style={styles.dividerText}>or</AppText>
                    <View style={styles.dividerLine} />
                  </View>
                  <Button
                    variant="secondary"
                    icon={
                      <Ionicons name="logo-google" size={18} color="#4285F4" />
                    }
                    label={
                      googleSignIn.isPending
                        ? 'Signing in…'
                        : 'Continue with Google'
                    }
                    disabled={googleSignIn.isPending}
                    onPress={() => {
                      setError(null);
                      googleSignIn.mutate(undefined, {
                        onSuccess: result => {
                          if (!result) {
                            return;
                          }
                          if (router.canGoBack()) {
                            router.back();
                          } else {
                            router.replace('/(tabs)/account');
                          }
                        },
                        onError: err => setError(err.message),
                      });
                    }}
                  />
                </>
              )}
              <View style={styles.trustRow}>
                <View style={styles.trustItem}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <AppText style={styles.trustLabel}>OTP secured</AppText>
                </View>
                <View style={styles.trustItem}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <AppText style={styles.trustLabel}>Privacy protected</AppText>
                </View>
                <View style={styles.trustItem}>
                  <Ionicons
                    name="flash-outline"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <AppText style={styles.trustLabel}>Instant access</AppText>
                </View>
              </View>
            </>
          ) : (
            <>
              <Image
                source={require('../../assets/images/Logo.png')}
                accessibilityLabel="Elexify"
                style={styles.heroLogo}
              />
              <AppText style={[shop.heading, styles.centerText]}>
                Verify your number
              </AppText>
              <AppText style={[shop.muted, styles.centerText]}>
                Enter the 6-digit code sent to +91 {mobile}.
              </AppText>
              <OtpInput value={otp} onChange={setOtp} autoFocus />
              {!isExisting && (
                <>
                  <AppText style={styles.label}>
                    Tell us your name to finish creating your account
                  </AppText>
                  <TextInput
                    accessibilityLabel="First name"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First name"
                    placeholderTextColor={theme.colors.secondary}
                    style={styles.fullInput}
                  />
                  <TextInput
                    accessibilityLabel="Last name"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last name"
                    placeholderTextColor={theme.colors.secondary}
                    style={styles.fullInput}
                  />
                </>
              )}
              {!!error && (
                <View accessibilityRole="alert" style={styles.errorBanner}>
                  <Ionicons
                    name="alert-circle"
                    size={16}
                    color={theme.colors.danger}
                  />
                  <AppText style={styles.errorText}>{error}</AppText>
                </View>
              )}
              <Button
                label={verifyOtp.isPending ? 'Verifying…' : 'Verify & continue'}
                disabled={
                  !otpPattern.test(otp) ||
                  verifyOtp.isPending ||
                  (!isExisting && (!firstName.trim() || !lastName.trim()))
                }
                onPress={submitOtp}
              />
              <View style={shop.between}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setStep('identity');
                    setOtp('');
                    setError(null);
                  }}
                >
                  <AppText style={shop.link}>Change number</AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={cooldown > 0 || sendOtp.isPending}
                  onPress={requestOtp}
                >
                  <AppText
                    style={[shop.link, cooldown > 0 && styles.disabledLink]}
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </AppText>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 16,
  },
  heroLogo: {
    width: 172,
    height: 49,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 4,
  },
  centerText: { textAlign: 'center' },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  prefix: { fontFamily: theme.fonts.medium, fontSize: 16 },
  prefixDivider: { width: 1, height: 22, backgroundColor: theme.colors.border },
  input: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 12,
  },
  fullInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
  },
  label: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.secondary,
  },
  invalid: { borderColor: theme.colors.danger },
  fieldError: { color: theme.colors.danger, fontSize: 13 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FDECEC',
  },
  errorText: { flex: 1, color: theme.colors.danger, fontSize: 13 },
  disabledLink: { opacity: 0.5 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.secondary, fontSize: 13 },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  trustItem: { flex: 1, alignItems: 'center', gap: 4 },
  trustLabel: {
    color: theme.colors.secondary,
    fontSize: 10,
    textAlign: 'center',
  },
});
