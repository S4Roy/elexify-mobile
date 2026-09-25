import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { useSmsUserConsent } from '../../platform/smsUserConsent';
import { normalizeOtpInput } from '../../utils/otp';

export function AppText({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.text, style]} />;
}
export function Button({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon}
      <AppText
        style={[
          styles.buttonText,
          variant === 'secondary' && styles.buttonTextSecondary,
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
/** Boxed one-time-code input: a single hidden TextInput (so paste, iOS
 * "From Messages" and Android autofill work normally) rendered as separate
 * digit boxes. On Android it also listens for the OTP SMS via the SMS User
 * Consent API and fills the code after a one-tap system prompt. */
export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus,
  onComplete,
  smsConsent = true,
  listenKey,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  /** Called once all `length` digits are present (typed, pasted or autofilled). */
  onComplete?: (code: string) => void;
  /** Listen for the code by SMS (Android). Turn off for email codes. */
  smsConsent?: boolean;
  /** Change after each resend so a fresh SMS listen starts. */
  listenKey?: string | number;
}) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, length - 1);

  const accept = (code: string) => {
    onChange(code);
    if (code.length === length) {
      onComplete?.(code);
    }
  };

  useSmsUserConsent({
    enabled: smsConsent,
    length,
    listenKey,
    onCode: code => {
      accept(code);
      inputRef.current?.blur();
    },
  });

  return (
    <Pressable
      accessibilityRole="none"
      onPress={() => inputRef.current?.focus()}
      style={otpStyles.row}
    >
      {Array.from({ length }, (_, index) => value[index] ?? '').map(
        (digit, index) => (
          <View
            key={index}
            style={[
              otpStyles.box,
              !!digit && otpStyles.boxFilled,
              focused && index === activeIndex && otpStyles.boxActive,
            ]}
          >
            <AppText style={otpStyles.digit}>{digit}</AppText>
          </View>
        ),
      )}
      <TextInput
        ref={inputRef}
        accessibilityLabel={`One-time code, ${length} digits`}
        value={value}
        onChangeText={next => {
          const code = normalizeOtpInput(value, next, length);
          if (code !== value) {
            accept(code);
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        // No maxLength: it truncates an autofilled code inserted after
        // already-typed digits; normalizeOtpInput caps the length instead.
        autoFocus={autoFocus}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        importantForAutofill="yes"
        caretHidden
        selectionColor="transparent"
        style={otpStyles.hiddenInput}
      />
    </Pressable>
  );
}
export function Screen({
  title,
  subtitle,
  children,
}: React.PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AppText accessibilityRole="header" style={styles.title}>
          {title}
        </AppText>
        {subtitle && <AppText style={styles.secondary}>{subtitle}</AppText>}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Card({ children }: React.PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}
export function Feedback({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card>
      <AppText accessibilityRole="header" style={styles.heading}>
        {title}
      </AppText>
      <AppText style={styles.secondary}>{message}</AppText>
      {onRetry && <Button label="Try again" onPress={onRetry} />}
    </Card>
  );
}
export function Loading() {
  return (
    <View accessibilityLabel="Loading" style={styles.card}>
      <ActivityIndicator color={theme.colors.primary} />
      <AppText>Loading…</AppText>
    </View>
  );
}
export function Skeleton() {
  return (
    <View accessibilityLabel="Loading products" style={styles.card}>
      {[0, 1, 2].map(item => (
        <View key={item} style={styles.skeleton} />
      ))}
    </View>
  );
}
export const styles = StyleSheet.create({
  text: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
  },
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, gap: 20, flexGrow: 1 },
  title: { fontFamily: theme.fonts.semibold, fontSize: 24, lineHeight: 32 },
  heading: { fontFamily: theme.fonts.semibold, fontSize: 20, lineHeight: 28 },
  secondary: { color: theme.colors.secondary },
  card: {
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: theme.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  buttonText: { color: '#FFFFFF', fontFamily: theme.fonts.medium },
  buttonTextSecondary: { color: theme.colors.text },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  disabled: { opacity: 0.5 },
  skeleton: {
    height: 24,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
  },
});
const otpStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, position: 'relative' },
  box: {
    width: 46,
    height: 54,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  boxFilled: {
    borderColor: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryLight,
  },
  boxActive: { borderColor: theme.colors.primary, borderWidth: 2 },
  digit: {
    fontFamily: theme.fonts.semibold,
    fontSize: 20,
    color: theme.colors.text,
  },
  // Nearly (not fully) transparent: some Android keyboards and autofill
  // services skip a view at opacity 0, and then never offer the SMS code.
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.011,
    color: 'transparent',
    fontSize: 1,
  },
});
