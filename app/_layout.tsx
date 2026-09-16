import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppProviders } from '../src/providers/AppProviders';
import { theme } from '../src/theme';
export { ErrorBoundary } from 'expo-router';
export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });
  if (error) {
    throw error;
  }
  if (!loaded) {
    return (
      <View style={layoutStyles.loading}>
        <ActivityIndicator
          accessibilityLabel="Loading Elexify"
          color={theme.colors.primary}
        />
      </View>
    );
  }
  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </AppProviders>
    </SafeAreaProvider>
  );
}

const layoutStyles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center' },
});
