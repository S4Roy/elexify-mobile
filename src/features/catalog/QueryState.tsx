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
          <View style={styles.connectionIcon}>
            <Ionicons
              name="cloud-offline-outline"
              size={21}
              color={theme.colors.primaryDark}
            />
          </View>
          <AppText accessibilityRole="header" style={styles.connectionTitle}>
            Unable to load
          </AppText>
          <AppText style={styles.connectionMessage}>
            Check your connection and try again.
          </AppText>
          <View style={styles.retryAction}>
            <Button
              label="Try again"
              onPress={retry}
              icon={
                <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
              }
            />
          </View>
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
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#D8EAE7',
    borderRadius: 14,
    backgroundColor: '#F8FCFB',
  },
  connectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  connectionTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: theme.colors.text,
  },
  connectionMessage: {
    color: theme.colors.secondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  retryAction: { width: '100%' },
});
