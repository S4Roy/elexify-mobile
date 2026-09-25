import { Platform } from 'react-native';
// Register before mounting the router. OS displays notification+data payloads while backgrounded.
// No privileged navigation or API work is performed in a background handler.
if (Platform.OS !== 'web' && process.env.EXPO_PUBLIC_PUSH_ENABLED === 'true') {
  const { getApps } = require('@react-native-firebase/app');
  const { getMessaging, setBackgroundMessageHandler } = require('@react-native-firebase/messaging');
  if (getApps().length) setBackgroundMessageHandler(getMessaging(), async () => {});
}
require('expo-router/entry');
