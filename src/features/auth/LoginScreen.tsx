import React, { useEffect, useRef, useState } from 'react';
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
import { router, type Href } from 'expo-router';
import { AppText, Button, OtpInput } from '../../components/ui';
import { ShopHeader, shop } from '../../components/shop';
import { theme } from '../../theme';
import {
  useGoogleSignIn,
  useGoogleSignInAvailable,
  useSendOtp,
  useVerifyOtp,
} from './hooks';

const mobilePattern = /^[6-9]\d{9}$/;
const otpPattern = /^\d{6}$/;
const legal = (slug: string): Href => ({
  pathname: '/legal/[slug]',
  params: { slug },
});
/** 9876543210 → "98765 43210", the way Indian numbers are read aloud. */
const formatMobile = (value: string) =>
  value.length > 5 ? `${value.slice(0, 5)} ${value.slice(5)}` : value;
const formatCooldown = (seconds: number) =>
  `0:${String(seconds).padStart(2, '0')}`;

const BENEFITS: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}[] = [
  { icon: 'cube-outline', label: 'Track orders' },
  { icon: 'flash-outline', label: 'Faster checkout' },
  { icon: 'pricetag-outline', label: 'Member offers' },
];

function finishSignIn() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)/account');
  }
}

export default function LoginScreen() {
  const [step, setStep] = useState<'identity' | 'verify'>('identity');
  const [mobile, setMobile] = useState('');
  const [isExisting, setIsExisting] = useState(true);
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cooldown, setCooldown] = useState(0);
  // Bumped on every OTP send so the SMS listener restarts after a resend.
  const [otpRequest, setOtpRequest] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  // Validate only once the person has typed and left the field, or tried to
  // continue — never on an empty field (e.g. when tapping Google instead).
  const [showMobileError, setShowMobileError] = useState(false);
  const [focused, setFocused] = useState(false);
  const mobileRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();
  const googleSignIn = useGoogleSignIn();
  const googleAvailable = useGoogleSignInAvailable();
  const mobileValid = mobilePattern.test(mobile);
  const mobileInvalid = showMobileError && !mobileValid;

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const requestOtp = () => {
    if (!mobileValid) {
      setShowMobileError(true);
      mobileRef.current?.focus();
      return;
    }
    setError(null);
    setGoogleError(null);
    sendOtp.mutate(mobile, {
      onSuccess: result => {
        setIsExisting(result.isExistingUser);
        setOtp('');
        setStep('verify');
        setCooldown(60);
        setOtpRequest(n => n + 1);
      },
      onError: err => setError(err.message),
    });
  };
  const submitOtp = (code = otp) => {
    if (verifyOtp.isPending) {
      return;
    }
    setError(null);
    verifyOtp.mutate(
      {
        mobile,
        otp: code,
        firstName: isExisting ? undefined : firstName.trim(),
        lastName: isExisting ? undefined : lastName.trim(),
      },
      { onSuccess: finishSignIn, onError: err => setError(err.message) },
    );
  };
  const signInWithGoogle = () => {
    setError(null);
    setGoogleError(null);
    googleSignIn.mutate(undefined, {
      onSuccess: result => {
        if (result) finishSignIn();
      },
      onError: err => setGoogleError(err.message),
    });
  };
  const editNumber = () => {
    setStep('identity');
    setOtp('');
    setError(null);
  };

  return (
    <View style={styles.page}>
      <ShopHeader
        title={step === 'identity' ? 'Login' : 'Verify'}
        back
        actions={false}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'identity' ? (
            <>
              <View style={styles.hero}>
                <Image
                  source={require('../../assets/images/Logo.png')}
                  accessibilityLabel="Elexify"
                  style={styles.heroLogo}
                />
                <AppText style={styles.title} accessibilityRole="header">
                  Login or sign up
                </AppText>
                <AppText style={styles.subtitle}>
                  Use your mobile number to continue. New here? We’ll create
                  your account.
                </AppText>
                <View style={styles.benefits}>
                  {BENEFITS.map(b => (
                    <View key={b.label} style={styles.benefit}>
                      <Ionicons
                        name={b.icon}
                        size={14}
                        color={theme.colors.primary}
                      />
                      <AppText style={styles.benefitText}>{b.label}</AppText>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.form}>
                <AppText style={styles.fieldLabel} nativeID="mobileLabel">
                  Mobile number
                </AppText>
                <View
                  style={[
                    styles.mobileRow,
                    focused && styles.mobileRowFocused,
                    mobileInvalid && styles.invalid,
                  ]}
                >
                  <AppText style={styles.prefix}>🇮🇳 +91</AppText>
                  <View style={styles.prefixDivider} />
                  <TextInput
                    ref={mobileRef}
                    accessibilityLabel="Mobile number"
                    accessibilityLabelledBy="mobileLabel"
                    keyboardType="number-pad"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    maxLength={10}
                    value={mobile}
                    onChangeText={v => {
                      setMobile(v.replace(/\D/g, ''));
                      setGoogleError(null);
                      setError(null);
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => {
                      setFocused(false);
                      if (mobile.length > 0) setShowMobileError(true);
                    }}
                    onSubmitEditing={requestOtp}
                    returnKeyType="done"
                    placeholder="Enter 10-digit number"
                    placeholderTextColor={theme.colors.secondary}
                    autoFocus
                    style={styles.input}
                  />
                  {mobile.length > 0 && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear mobile number"
                      hitSlop={10}
                      onPress={() => {
                        setMobile('');
                        setShowMobileError(false);
                        mobileRef.current?.focus();
                      }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={theme.colors.secondary}
                      />
                    </Pressable>
                  )}
                  {mobileValid && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={theme.colors.primary}
                      accessibilityLabel="Valid number"
                    />
                  )}
                </View>
                {mobileInvalid && (
                  <AppText accessibilityRole="alert" style={styles.fieldError}>
                    Enter a valid 10-digit mobile number starting with 6–9.
                  </AppText>
                )}
                {!!error && <ErrorBanner message={error} />}
                <Button
                  label={sendOtp.isPending ? 'Sending OTP…' : 'Continue'}
                  disabled={sendOtp.isPending}
                  onPress={requestOtp}
                />
              </View>

              {googleAvailable && (
                <View style={styles.form}>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <AppText style={styles.dividerText}>
                      or continue with
                    </AppText>
                    <View style={styles.dividerLine} />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: googleSignIn.isPending,
                      busy: googleSignIn.isPending,
                    }}
                    disabled={googleSignIn.isPending}
                    onPress={signInWithGoogle}
                    style={({ pressed }) => [
                      styles.googleButton,
                      pressed && styles.pressed,
                      googleSignIn.isPending && styles.disabled,
                    ]}
                  >
                    <Ionicons name="logo-google" size={18} color="#4285F4" />
                    <AppText style={styles.googleText}>
                      {googleSignIn.isPending ? 'Signing in…' : 'Google'}
                    </AppText>
                  </Pressable>
                  {!!googleError && <ErrorBanner message={googleError} />}
                </View>
              )}

              <AppText style={styles.consent}>
                By continuing, you agree to Elexify’s{' '}
                <AppText
                  style={styles.consentLink}
                  accessibilityRole="link"
                  onPress={() => router.push(legal('terms-conditions'))}
                >
                  Terms of Use
                </AppText>{' '}
                and{' '}
                <AppText
                  style={styles.consentLink}
                  accessibilityRole="link"
                  onPress={() => router.push(legal('privacy-policy'))}
                >
                  Privacy Policy
                </AppText>
                .
              </AppText>
            </>
          ) : (
            <>
              <View style={styles.hero}>
                <View style={styles.otpBadge}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={26}
                    color={theme.colors.primary}
                  />
                </View>
                <AppText style={styles.title} accessibilityRole="header">
                  {isExisting
                    ? 'Enter verification code'
                    : 'Create your account'}
                </AppText>
                <View style={styles.sentRow}>
                  <AppText style={styles.subtitle}>
                    6-digit code sent to +91 {formatMobile(mobile)}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Edit mobile number"
                    hitSlop={8}
                    onPress={editNumber}
                    style={styles.editButton}
                  >
                    <Ionicons
                      name="create-outline"
                      size={15}
                      color={theme.colors.primary}
                    />
                    <AppText style={styles.editText}>Edit</AppText>
                  </Pressable>
                </View>
              </View>

              <View style={styles.form}>
                <OtpInput
                  value={otp}
                  onChange={v => {
                    setOtp(v);
                    setError(null);
                  }}
                  autoFocus
                  listenKey={otpRequest}
                  // Returning users go straight in once the code is complete;
                  // new users still need to add their name first.
                  onComplete={code => {
                    if (isExisting) {
                      submitOtp(code);
                    }
                  }}
                />
                {!isExisting && (
                  <>
                    <AppText style={styles.fieldLabel}>Your name</AppText>
                    <View style={styles.nameRow}>
                      <TextInput
                        accessibilityLabel="First name"
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="First name"
                        placeholderTextColor={theme.colors.secondary}
                        autoComplete="given-name"
                        textContentType="givenName"
                        autoCapitalize="words"
                        returnKeyType="next"
                        onSubmitEditing={() => lastNameRef.current?.focus()}
                        style={[styles.fullInput, styles.flex]}
                      />
                      <TextInput
                        ref={lastNameRef}
                        accessibilityLabel="Last name"
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Last name"
                        placeholderTextColor={theme.colors.secondary}
                        autoComplete="family-name"
                        textContentType="familyName"
                        autoCapitalize="words"
                        returnKeyType="done"
                        style={[styles.fullInput, styles.flex]}
                      />
                    </View>
                  </>
                )}
                {!!error && <ErrorBanner message={error} />}
                <Button
                  label={
                    verifyOtp.isPending
                      ? 'Verifying…'
                      : isExisting
                      ? 'Verify & continue'
                      : 'Create account'
                  }
                  disabled={
                    !otpPattern.test(otp) ||
                    verifyOtp.isPending ||
                    (!isExisting && (!firstName.trim() || !lastName.trim()))
                  }
                  onPress={() => submitOtp()}
                />
                <View style={styles.resendRow}>
                  <AppText style={styles.resendHint}>
                    Didn’t get the code?
                  </AppText>
                  {cooldown > 0 ? (
                    <AppText style={styles.resendWait}>
                      Resend in {formatCooldown(cooldown)}
                    </AppText>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      disabled={sendOtp.isPending}
                      onPress={requestOtp}
                      hitSlop={8}
                    >
                      <AppText style={shop.link}>
                        {sendOtp.isPending ? 'Sending…' : 'Resend OTP'}
                      </AppText>
                    </Pressable>
                  )}
                </View>
              </View>
            </>
          )}

          <View style={styles.trustRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={theme.colors.secondary}
            />
            <AppText style={styles.trustLabel}>
              Secured with one-time password · We never share your number
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View accessibilityRole="alert" style={styles.errorBanner}>
      <Ionicons name="alert-circle" size={16} color={theme.colors.danger} />
      <AppText style={styles.errorText}>{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F9F9' },
  flex: { flex: 1 },
  body: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryLight,
  },
  heroLogo: {
    width: 150,
    height: 43,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  benefits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  benefitText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.text,
  },
  form: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fieldLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.text,
  },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  mobileRowFocused: { borderColor: theme.colors.primary },
  invalid: { borderColor: theme.colors.danger },
  prefix: {
    fontFamily: theme.fonts.medium,
    fontSize: 16,
    color: theme.colors.text,
  },
  prefixDivider: { width: 1, height: 24, backgroundColor: theme.colors.border },
  input: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: 17,
    letterSpacing: 0.5,
    color: theme.colors.text,
    paddingVertical: 12,
  },
  fieldError: { color: theme.colors.danger, fontSize: 13, marginTop: -4 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FDECEC',
  },
  errorText: {
    flex: 1,
    color: theme.colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.secondary, fontSize: 12 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  googleText: {
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
    color: theme.colors.text,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  consent: {
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.secondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  consentLink: {
    fontSize: 12,
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
  },
  otpBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  sentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  editText: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    color: theme.colors.primary,
  },
  nameRow: { flexDirection: 'row', gap: 10 },
  fullInput: {
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  resendHint: { fontSize: 13, color: theme.colors.secondary },
  resendWait: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.text,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 'auto',
    paddingTop: 8,
  },
  trustLabel: {
    fontSize: 11,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
});
