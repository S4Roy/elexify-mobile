import React, { useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useShopping } from '../stores/shopping';
import { useSession } from '../stores/session';
import { AppText, Feedback, Loading, Screen } from '../components/ui';
import { ApiError } from '../api/client';
import { theme } from '../theme';

export function AppProviders({ children }: React.PropsWithChildren) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60000,
            retry: (count, error) =>
              count < 1 &&
              !(
                error instanceof ApiError &&
                error.status &&
                error.status < 500
              ),
          },
          mutations: { retry: false },
        },
      }),
  );
  const status = useSession(state => state.status);
  const initialize = useSession(state => state.initialize);
  const network = useNetInfo();
  useEffect(() => {
    const unsubscribe = useSession.subscribe((state, previous) => {
      if (
        state.token !== previous.token ||
        state.guestId !== previous.guestId
      ) {
        client.cancelQueries().catch(() => undefined);
        client.clear();
        useShopping.getState().reset();
      }
    });
    initialize().catch(() => undefined);
    const unsubscribeNetwork = NetInfo.addEventListener(state =>
      onlineManager.setOnline(
        state.isConnected !== false && state.isInternetReachable !== false,
      ),
    );
    focusManager.setFocused(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', state =>
      focusManager.setFocused(state === 'active'),
    );
    return () => {
      unsubscribe();
      unsubscribeNetwork();
      subscription.remove();
    };
  }, [client, initialize]);
  return (
    <QueryClientProvider client={client}>
      <View style={providerStyles.container}>
        {(network.isConnected === false ||
          network.isInternetReachable === false) && (
          <AppText accessibilityRole="alert" style={providerStyles.offline}>
            You’re offline. Reconnect to refresh the store.
          </AppText>
        )}
        {status === 'loading' ? (
          <Screen title="Elexify">
            <Loading />
          </Screen>
        ) : status === 'error' ? (
          <Screen title="Elexify">
            <Feedback
              title="Unable to restore your session"
              message="Please try again to continue."
              onRetry={() => {
                initialize().catch(() => undefined);
              }}
            />
          </Screen>
        ) : (
          children
        )}
      </View>
    </QueryClientProvider>
  );
}

const providerStyles = StyleSheet.create({
  container: { flex: 1 },
  offline: { backgroundColor: theme.colors.primaryLight, padding: 12 },
});
