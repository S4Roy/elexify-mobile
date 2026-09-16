import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';

export function AppText({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.text, style]} />;
}
export function Button({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        (pressed || disabled) && styles.dim,
      ]}
    >
      <AppText style={styles.buttonText}>{label}</AppText>
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
  title: { fontFamily: theme.fonts.bold, fontSize: 30, lineHeight: 38 },
  heading: { fontFamily: theme.fonts.bold, fontSize: 20, lineHeight: 28 },
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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  buttonText: { color: '#FFFFFF', fontFamily: theme.fonts.medium },
  dim: { opacity: 0.6 },
  skeleton: {
    height: 24,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
  },
});
