# Mandatory mobile updates

The app checks the public `GET /api/v1/mobile/update-policy?platform=android|ios` endpoint before rendering navigation, on foreground, and every five active minutes. The installed native marketing version (expo-application) is compared numerically with the minimum supported version. Increment the native Android versionName / iOS CFBundleShortVersionString for every release that changes compatibility; build numbers alone do not trigger this gate.

Backend environment settings (disabled by default):

```
MOBILE_ANDROID_UPDATE_ENABLED=false
MOBILE_ANDROID_MIN_VERSION=1.0.2
MOBILE_IOS_UPDATE_ENABLED=false
MOBILE_IOS_MIN_VERSION=1.0.2
MOBILE_IOS_STORE_URL=https://apps.apple.com/app/idYOUR_REAL_APP_ID
```

Deploy the backend first, rebuild the native app (run CocoaPods installation for iOS), and ship a release containing this gate. Existing releases without this code cannot be retroactively blocked by it. After the target release is available to all supported countries/devices, finish its store rollout, set the corresponding minimum version and enable the policy, then restart/redeploy the backend. Never require a version still awaiting review or in a staged rollout. Keep minimum versions independent for Android and iOS. iOS requires the real numeric App Store ID.

Rollback: set the platform's UPDATE_ENABLED=false and restart/redeploy. Devices recover on the next successful check. Invalid enabled backend configuration returns 503 rather than sending a lockout policy.

The last valid policy is persisted per platform and API environment. A known mandatory update remains blocked offline, across restarts, or on malformed/network responses. An installation with no cached policy continues after the eight-second request timeout, so a backend outage does not lock out new users. This is a client compatibility gate, not a security boundary or server-side API access restriction. It cannot silently install an app or prevent a modified client from bypassing it.

Before production activation, test a release binary below/equal/above the threshold, cold start, deep links, Android back, store return, failed store launch, offline restart after a required update, first launch during outage, and remote rollback. The full-screen gate offers no dismiss action and unmounts app navigation while blocked; foreground checks may interrupt an active flow, so reserve enforcement for necessary compatibility/security releases.
