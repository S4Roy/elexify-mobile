import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppProviders } from '../src/providers/AppProviders';
import { theme } from '../src/theme';
export { ErrorBoundary } from 'expo-router';
export default function RootLayout() {
  const [loaded, error] = useFonts({
    Poppins_400Regular: require('../src/assets/fonts/Poppins-Regular.ttf'),
    Poppins_500Medium: require('../src/assets/fonts/Poppins-Medium.ttf'),
    Poppins_600SemiBold: require('../src/assets/fonts/Poppins-SemiBold.ttf'),
    Poppins_700Bold: require('../src/assets/fonts/Poppins-Bold.ttf'),
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
