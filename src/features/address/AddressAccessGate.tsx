import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { AppText, Button, Feedback, Loading } from '../../components/ui';
import { ShopHeader, shop } from '../../components/shop';
import { useSession } from '../../stores/session';
import { theme } from '../../theme';

/** Mount address queries and forms only after the session is authenticated. */
export function AddressAccessGate({ children }: React.PropsWithChildren) {
  const status = useSession(s => s.status);
  const initialize = useSession(s => s.initialize);

  if (status === 'authenticated') return <>{children}</>;

  return (
    <View style={shop.page}>
      <ShopHeader title="Delivery addresses" back actions={false} />
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {status === 'loading' && <Loading />}
        {status === 'error' && (
          <Feedback
            title="Unable to restore your session"
            message="Please try again to access your saved addresses."
            onRetry={() => {
              initialize().catch(() => undefined);
            }}
          />
        )}
        {status === 'guest' && (
          <View style={styles.card}>
            <View style={styles.icon}>
              <Ionicons
                name="location-outline"
                size={32}
                color={theme.colors.primary}
              />
            </View>
            <AppText accessibilityRole="header" style={styles.title}>
              Your delivery addresses
            </AppText>
            <AppText style={styles.description}>
              Sign in to add a delivery address, view saved addresses and choose
              where your orders arrive.
            </AppText>
            <Button
              label="Sign in or create account"
              onPress={() => router.push('/login')}
            />
            <Button
              label="Continue shopping"
              variant="secondary"
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace('/(tabs)');
              }}
            />
            <View style={styles.trust}>
              <Ionicons
                name="shield-checkmark-outline"
                size={15}
                color={theme.colors.secondary}
              />
              <AppText style={styles.hint}>
                Your addresses stay private and secure
              </AppText>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: 16 },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
    marginBottom: 4,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 23,
    lineHeight: 30,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  trust: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  hint: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
});
