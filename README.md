# elexify-mobile

Elexify's Expo + React Native + TypeScript customer app. Phase 1 establishes the application foundation; catalog browsing, authentication UI and checkout are subsequent phases.

## Setup

Use Node 20.19.4 or newer and npm:

```sh
npm ci
cp .env.example .env
npm start
```

Set `EXPO_PUBLIC_API_URL` to an approved staging base URL ending in `/api/v1/`, and configure `EXPO_PUBLIC_X_API_KEY` if the backend requires it. Both values are public app configuration. Do not copy backend secrets or the website's entire `.env` file. Without a configured URL the shell runs without making API requests.

`npm start` opens Metro for a development build. Build/install with `npm run android` (JDK/Android SDK required) or `npm run ios` (full Xcode and CocoaPods required). Expo Go is not the target for payment/auth integration.

## Structure

- `app/`: Expo Router root, four tabs and not-found route.
- `src/features/foundation/`: initial read-only home preview.
- `src/components/ui/`, `src/theme/`: Elexify primitives and Inter/teal tokens.
- `src/api/`: configured Axios transport, normalized errors, catalog response adapter.
- `src/platform/`, `src/stores/`: secure credentials, guest identity and local UI intent.
- `src/providers/`: query cache, session bootstrap, connectivity and app focus.
- `tests/`: foundation contract/session tests.

Existing `src/screens`, `src/navigators`, Redux/Saga and helper files are retained as migration references and are not imported by the Expo entry. Their older implementation is excluded from the foundation typecheck/lint/test scope; it is not certified by these checks. The old `__tests__/App.test.tsx` belongs to that implementation.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npx expo install --check
npx expo export --platform android --platform ios --output-dir /private/tmp/elexify-mobile-export
```

The app currently renders Home, Categories, Cart and Account. Only Home makes an optional read-only product-list request. Other tabs clearly indicate upcoming functionality. No demo checkout or unsupported login is exposed.

Credentials use SecureStore. Guest IDs use AsyncStorage. Auth transitions cancel and clear query data and reset local shopping intent. No refresh-token contract is assumed. Payment adapters and persisted checkout idempotency will be implemented in Phase 5.

See [Phase 0](docs/PHASE-0-DISCOVERY.md) and [Phase 1](docs/PHASE-1-FOUNDATION.md) for findings and validation limits.
