import { CustomerNameGate } from '../src/features/account/CustomerNameGate';
import { UpdateGate } from '../src/features/app-update/UpdateGate';
import { PushProvider } from '../src/features/notifications/PushProvider';
import React, { useCallback, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProviders } from '../src/providers/AppProviders';
import { AnimatedSplash } from '../src/components/AnimatedSplash';
import { PermissionOnboarding } from '../src/features/onboarding/PermissionOnboarding';
import { WelcomeLogin } from '../src/features/auth/WelcomeLogin';
import { LocationSync } from '../src/features/onboarding/LocationSync';
import { useWelcome } from '../src/features/auth/welcome';
import { NavigationBarInset } from '../src/components/NavigationBarInset';
import { useSession } from '../src/stores/session';
export { ErrorBoundary } from 'expo-router';

// Keep the native launch screen (Theme.App.SplashScreen, registered in
// MainActivity) up until AnimatedSplash — whose first frame matches it
// exactly — has mounted, so there's no blank frame between the two.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Poppins_400Regular: require('../src/assets/fonts/Poppins-Regular.ttf'),
    Poppins_500Medium: require('../src/assets/fonts/Poppins-Medium.ttf'),
    Poppins_600SemiBold: require('../src/assets/fonts/Poppins-SemiBold.ttf'),
    Poppins_700Bold: require('../src/assets/fonts/Poppins-Bold.ttf'),
  });
  const [showSplash, setShowSplash] = useState(true);
  const hideSplash = useCallback(() => setShowSplash(false), []);
  // Session restore (token/guest-id read) happens the moment AppProviders
  // mounts below, in parallel with the splash animation — waiting for it
  // here too means the branded splash covers that gap instead of handing
  // off to AppProviders' plain "Elexify" / Loading… fallback screen.
  const sessionStatus = useSession(state => state.status);
  const welcomePhase = useWelcome(state => state.phase);
  if (error) {
    // The native splash now waits for JS; never leave it covering the error screen.
    SplashScreen.hideAsync().catch(() => undefined);
    throw error;
  }
  const ready = loaded && sessionStatus !== 'loading';
  return (
    <SafeAreaProvider>
      {loaded && (
        <AppProviders>
          <StatusBar style="dark" />
          <UpdateGate>
            <NavigationBarInset>
              <Stack screenOptions={{ headerShown: false }} />
            </NavigationBarInset>
            <CustomerNameGate />
            <PushProvider />
            <WelcomeLogin />
            <LocationSync />
            {/* After the splash and the first-launch login, so neither hides the other. */}
            <PermissionOnboarding enabled={!showSplash && welcomePhase === 'done'} />
          </UpdateGate>
        </AppProviders>
      )}
      {showSplash && (
        <AnimatedSplash ready={ready} brandReady={loaded} onFinish={hideSplash} />
      )}
    </SafeAreaProvider>
  );
}
