import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button } from '../../components/ui';
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
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {step === 'identity' ? (
          <>
            <AppText style={shop.heading}>Enter your mobile number</AppText>
            <View style={styles.mobileRow}>
              <AppText style={styles.prefix}>+91</AppText>
              <TextInput
                accessibilityLabel="Mobile number"
                keyboardType="number-pad"
                maxLength={10}
                value={mobile}
                onChangeText={v => setMobile(v.replace(/\D/g, ''))}
                onBlur={() => setTouched(true)}
                placeholder="10-digit mobile number"
                placeholderTextColor={theme.colors.secondary}
                style={[styles.input, touched && !mobilePattern.test(mobile) && styles.invalid]}
              />
            </View>
            {touched && !mobilePattern.test(mobile) && <AppText style={styles.fieldError}>Enter a valid 10-digit mobile number.</AppText>}
            {!!error && (
              <AppText accessibilityRole="alert" style={styles.error}>
                {error}
              </AppText>
            )}
            <Button
              label={sendOtp.isPending ? 'Sending…' : 'Send OTP'}
              disabled={!mobilePattern.test(mobile) || sendOtp.isPending}
              onPress={requestOtp}
            />
            {!!googleConfig.webClientId && (
              <>
                <AppText style={styles.divider}>or</AppText>
                <Button
                  label={googleSignIn.isPending ? 'Signing in…' : 'Continue with Google'}
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
          </>
        ) : (
          <>
            <AppText style={shop.heading}>Enter the OTP sent to +91 {mobile}</AppText>
            <TextInput
              accessibilityLabel="OTP"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={v => setOtp(v.replace(/\D/g, ''))}
              placeholder="6-digit code"
              placeholderTextColor={theme.colors.secondary}
              style={styles.fullInput}
            />
            {!isExisting && (
              <>
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
              <AppText accessibilityRole="alert" style={styles.error}>
                {error}
              </AppText>
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
            <Button
              label={cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
              disabled={cooldown > 0 || sendOtp.isPending}
              onPress={requestOtp}
            />
            <Button
              label="Change number"
              onPress={() => {
                setStep('identity');
                setOtp('');
                setError(null);
              }}
            />
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: 16, gap: 14 },
  mobileRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prefix: { fontFamily: theme.fonts.medium, fontSize: 16 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
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
  error: { color: theme.colors.danger },
  invalid: { borderColor: theme.colors.danger, borderWidth: 1.5 },
  fieldError: { color: theme.colors.danger, fontSize: 13 },
  divider: { textAlign: 'center', color: theme.colors.secondary },
});
