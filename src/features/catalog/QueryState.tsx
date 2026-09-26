import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText, Button, Feedback, Skeleton } from '../../components/ui';
import { apiConfig } from '../../api/config';
import { theme } from '../../theme';
export function QueryState({
  pending,
  error,
  paused,
  retry,
  skeleton,
}: {
  pending: boolean;
  error: Error | null;
  paused?: boolean;
  retry: () => void;
  /** Custom placeholder shown while pending (e.g. a grid-shaped skeleton). Defaults to the generic bar Skeleton. */
  skeleton?: React.ReactNode;
}) {
  if (!apiConfig.baseUrl) {
    return (
      <Feedback
        title="The store is getting ready"
        message="Please check back soon to explore our products."
      />
    );
  }
  if (error) {
    if (/unable to connect/i.test(error.message)) {
      return (
        <View
          accessibilityLiveRegion="polite"
          style={styles.connectionCard}
        >
          <View style={styles.connectionHeading}>
            <View style={styles.connectionIcon}>
              <Ionicons
                name="cloud-offline-outline"
                size={23}
                color={theme.colors.primaryDark}
              />
            </View>
            <View style={styles.connectionCopy}>
              <AppText accessibilityRole="header" style={styles.connectionTitle}>
                We couldn’t load this
              </AppText>
              <AppText style={styles.connectionHint}>Connection problem</AppText>
            </View>
          </View>
          <AppText style={styles.connectionMessage}>
            Check your internet connection, then try again. Your account and items are safe.
          </AppText>
          <Button
            label="Try again"
            onPress={retry}
            icon={<Ionicons name="refresh-outline" size={18} color="#FFFFFF" />}
          />
        </View>
      );
    }
    return (
      <Feedback
        title="Unable to load"
        message={error.message}
        onRetry={retry}
      />
    );
  }
  if (pending) {
    if (paused) {
      return (
        <Feedback
          title="Waiting for connection"
          message="We’ll load the store when you’re back online."
        />
      );
    }
    return <>{skeleton ?? <Skeleton />}</>;
  }
  return null;
}

const styles = StyleSheet.create({
  connectionCard: {
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#D8EAE7',
    borderRadius: 16,
    backgroundColor: '#F8FCFB',
  },
  connectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  connectionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  connectionCopy: { flex: 1, gap: 2 },
  connectionTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 17,
    lineHeight: 24,
    color: theme.colors.text,
  },
  connectionHint: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.primaryDark,
  },
  connectionMessage: { color: theme.colors.secondary, fontSize: 14, lineHeight: 21 },
});
