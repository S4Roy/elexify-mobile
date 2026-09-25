const base = require('./app.json');
module.exports = () => {
  const config = { ...base.expo };
  if (process.env.EXPO_PUBLIC_PUSH_ENABLED !== 'true') return config;
  const environment = process.env.EXPO_PUBLIC_APP_ENV;
  const project = process.env.EXPO_PUBLIC_FCM_PROJECT_ID;
  if (!['development', 'staging', 'production'].includes(environment) || !project) throw new Error('Push builds require explicit app environment and Firebase project.');
  config.plugins = [...(config.plugins || []), '@react-native-firebase/app', '@react-native-firebase/messaging'];
  config.android = { ...config.android, googleServicesFile: process.env.GOOGLE_SERVICES_JSON };
  config.ios = { ...config.ios, entitlements: { ...config.ios?.entitlements, 'aps-environment': process.env.APNS_ENVIRONMENT || 'development' }, googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST, infoPlist: { ...config.ios?.infoPlist, UIBackgroundModes: ['remote-notification'] } };
  return config;
};
