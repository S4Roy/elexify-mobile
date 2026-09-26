const base = require('./app.json');
const fs = require('node:fs');
const path = require('node:path');
module.exports = () => {
  const config = { ...base.expo };
  if (process.env.EXPO_PUBLIC_PUSH_ENABLED !== 'true') return config;
  const environment = process.env.EXPO_PUBLIC_APP_ENV;
  const project = process.env.EXPO_PUBLIC_FCM_PROJECT_ID;
  if (!['development', 'staging', 'production'].includes(environment) || !project) throw new Error('Push builds require explicit app environment and Firebase project.');
  const buildProfile = process.env.EAS_BUILD_PROFILE;
  const isProductionBuild = buildProfile
    ? buildProfile === 'production'
    : process.env.CONFIGURATION === 'Release';
  const apnsEnvironment = process.env.APNS_ENVIRONMENT ||
    (isProductionBuild ? 'production' : 'development');
  if (!['development', 'production'].includes(apnsEnvironment)) {
    throw new Error('APNS_ENVIRONMENT must be development or production.');
  }
  const localGoogleServiceInfo = path.join(
    __dirname,
    `ios/Elexify/GoogleService-Info-${environment}.plist`,
  );
  const productionGoogleServiceInfo = path.join(
    __dirname,
    'ios/Elexify/GoogleService-Info.plist',
  );
  const googleServiceInfo = process.env.GOOGLE_SERVICE_INFO_PLIST ||
    (fs.existsSync(localGoogleServiceInfo)
      ? localGoogleServiceInfo
      : environment === 'production' && fs.existsSync(productionGoogleServiceInfo)
        ? productionGoogleServiceInfo
        : undefined);
  config.plugins = [...(config.plugins || []), '@react-native-firebase/app', '@react-native-firebase/messaging'];
  config.android = { ...config.android, googleServicesFile: process.env.GOOGLE_SERVICES_JSON };
  config.ios = {
    ...config.ios,
    entitlements: { ...config.ios?.entitlements, 'aps-environment': apnsEnvironment },
    ...(googleServiceInfo ? { googleServicesFile: googleServiceInfo } : {}),
    infoPlist: { ...config.ios?.infoPlist, UIBackgroundModes: ['remote-notification'] },
  };
  return config;
};
