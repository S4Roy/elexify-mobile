const base = require('./app.json');
module.exports = () => {
  const config = { ...base.expo };
  if (process.env.EXPO_PUBLIC_PUSH_ENABLED !== 'true') return config;
  const environment = process.env.EXPO_PUBLIC_APP_ENV;
  const project = process.env.EXPO_PUBLIC_FCM_PROJECT_ID;
  if (!['development', 'staging', 'production'].includes(environment) || !project) throw new Error('Push builds require explicit app environment and Firebase project.');
  const apnsEnvironment = process.env.APNS_ENVIRONMENT ||
    (process.env.EAS_BUILD_PROFILE === 'production' ? 'production' : 'development');
  if (!['development', 'production'].includes(apnsEnvironment)) {
    throw new Error('APNS_ENVIRONMENT must be development or production.');
  }
  config.plugins = [...(config.plugins || []), '@react-native-firebase/app', '@react-native-firebase/messaging'];
  config.android = { ...config.android, googleServicesFile: process.env.GOOGLE_SERVICES_JSON };
  config.ios = { ...config.ios, entitlements: { ...config.ios?.entitlements, 'aps-environment': apnsEnvironment }, googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST, infoPlist: { ...config.ios?.infoPlist, UIBackgroundModes: ['remote-notification'] } };
  return config;
};
