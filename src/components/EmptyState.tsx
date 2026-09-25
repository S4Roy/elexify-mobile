import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from './ui';
import { theme } from '../theme';

// Illustrated empty/error state used across the store (compare, not found,
// search with no results): icon illustration, headline, one line of help,
// optional "how it works" steps and a primary + secondary actions. Same
// visual language as the wishlist's empty state.

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type EmptyStateAction = { label: string; icon: IconName; onPress: () => void };

const TONES = {
  primary: { ring: '#E6F4F1', icon: theme.colors.primary, dot: '#99D5CB', shadow: theme.colors.primary },
  amber: { ring: '#FEF3C7', icon: '#D97706', dot: '#FCD34D', shadow: '#D97706' },
  slate: { ring: '#EEF2F6', icon: '#475569', dot: '#CBD5E1', shadow: '#475569' },
};

export function EmptyState({
  icon,
  tone = 'primary',
  title,
  text,
  steps,
  primary,
  secondary = [],
  compact = false,
}: {
  icon: IconName;
  tone?: keyof typeof TONES;
  title: string;
  text: string;
  steps?: { icon: IconName; title: string; text: string }[];
  primary?: EmptyStateAction;
  secondary?: EmptyStateAction[];
  /** Smaller illustration, for use inside a scrolling page. */
  compact?: boolean;
}) {
  const colors = TONES[tone];
  const ring = compact ? 96 : 132;
  const core = compact ? 64 : 88;
  return (
    <View style={styles.wrap}>
      <View
        style={[styles.illustration, { width: ring + 16, height: ring + 16 }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View
          style={[
            styles.ring,
            { width: ring, height: ring, borderRadius: ring / 2, backgroundColor: colors.ring },
          ]}
        >
          <View
            style={[
              styles.core,
              { width: core, height: core, borderRadius: core / 2, shadowColor: colors.shadow },
            ]}
          >
            <Ionicons name={icon} size={compact ? 28 : 38} color={colors.icon} />
          </View>
        </View>
        <View style={[styles.dot, styles.dotTop, { backgroundColor: colors.dot }]} />
        <View style={[styles.dot, styles.dotSide, { backgroundColor: colors.dot }]} />
      </View>

      <AppText accessibilityRole="header" style={[styles.title, compact && styles.titleCompact]}>
        {title}
      </AppText>
      <AppText style={styles.text}>{text}</AppText>

      {!!steps?.length && (
        <View style={styles.steps}>
          {steps.map((step, i) => (
            <View key={step.title} style={styles.step}>
              <View style={styles.stepIcon}>
                <Ionicons name={step.icon} size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.flex}>
                <AppText style={styles.stepTitle}>
                  {i + 1}. {step.title}
                </AppText>
                <AppText style={styles.stepText}>{step.text}</AppText>
              </View>
            </View>
          ))}
        </View>
      )}

      {(primary || secondary.length > 0) && (
        <View style={styles.actions}>
          {primary && (
            <Pressable
              accessibilityRole="button"
              onPress={primary.onPress}
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
            >
              <Ionicons name={primary.icon} size={18} color="#FFFFFF" />
              <AppText style={styles.primaryText}>{primary.label}</AppText>
            </Pressable>
          )}
          {secondary.length > 0 && (
            <View style={styles.secondaryRow}>
              {secondary.map(action => (
                <Pressable
                  key={action.label}
                  accessibilityRole="button"
                  onPress={action.onPress}
                  style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
                >
                  <Ionicons name={action.icon} size={16} color={theme.colors.primary} />
                  <AppText style={styles.secondaryText} numberOfLines={1}>
                    {action.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  wrap: { alignItems: 'center', paddingVertical: 16 },
  illustration: { alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  ring: { alignItems: 'center', justifyContent: 'center' },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  dot: { position: 'absolute', borderRadius: 999 },
  dotTop: { width: 14, height: 14, top: 8, right: 16 },
  dotSide: { width: 9, height: 9, bottom: 20, left: 8, opacity: 0.7 },
  title: {
    fontFamily: theme.fonts.semibold,
    fontSize: 20,
    lineHeight: 28,
    color: theme.colors.text,
    textAlign: 'center',
  },
  titleCompact: { fontSize: 17, lineHeight: 24 },
  text: {
    marginTop: 6,
    maxWidth: 310,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  steps: {
    alignSelf: 'stretch',
    gap: 14,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F7FBFA',
    borderWidth: 1,
    borderColor: '#E0F0ED',
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5EBE7',
  },
  stepTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  stepText: { fontSize: 12, lineHeight: 17, color: theme.colors.secondary },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 20 },
  primary: {
    minHeight: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
  },
  primaryText: { color: '#FFFFFF', fontFamily: theme.fonts.semibold, fontSize: 15 },
  secondaryRow: { flexDirection: 'row', gap: 10 },
  secondary: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: '#B2DFDB',
    backgroundColor: '#FFFFFF',
  },
  secondaryText: { color: theme.colors.primary, fontFamily: theme.fonts.semibold, fontSize: 14 },
});
