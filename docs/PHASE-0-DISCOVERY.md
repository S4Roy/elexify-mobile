# elexify-mobile: Phase 0 discovery

Date: 2026-09-15

Status: Source audit complete. Live visual review, deployed API verification and native integration tests remain open. Planning only; no application code or dependencies changed.

## Evidence and limitations

- Reviewed the local Next.js storefront, mobile project and Node.js customer routes/controllers.
- Live https://elexify.online could not be opened by the browsing tool. Earlier local access also failed DNS resolution. This does not establish that the public site is down.
- No login, OTP, order, payment or other production mutation was performed. No native build was run.
- Existing mobile Git working tree was clean before this report.

## Existing implementation audit

| Area | Evidence | Migration decision |
| --- | --- | --- |
| Runtime | package.json uses React Native 0.81.4, React 19.1, RN CLI; no Expo dependency | Adopt a stable compatible Expo SDK during Phase 1; let its compatibility matrix determine React/RN versions |
| Navigation | src/navigators contains stack/tab navigators | Replace route wiring with thin Expo Router routes, preserving useful screen content selectively |
| State | Redux Toolkit and Saga | Move remote resources to TanStack Query; small local state to Zustand; avoid two active owners per resource |
| Branding | Mobile bundles Poppins; web globals.css specifies Inter and teal #00796A | Match current web tokens and Inter; verify logo visually before reuse |
| API | src/services/ApiService.ts defaults to api.elexify.com; web uses api.elexify.online/api/v1/ | One environment-configured client aligned with customer contracts |
| Login | AuthSaga calls auth/login and expects data.access_token | Use auth/user OTP contracts and data.token.access_token |
| Account | AuthSaga posts to v1/user/account/details | Current storefront uses GET user/account/details |
| Credentials | AuthSaga persists token in AsyncStorage and logs responses | SecureStore for credentials; redact auth data from diagnostics |
| Guest state | MainSaga embeds a fixed guest ID and API key | Generate a per-install guest identity; configure public client key without treating it as a secret |
| Checkout | CheckoutScreen contains demo product/address/totals; place order logs only | Rebuild against cart, quote, order and payment contracts |
| Diagnostics | App.tsx globally suppresses logs | Restore actionable development diagnostics during implementation |
| Product details | Both screens/product and screens/products contain detail screens | Consolidate into one catalog feature after identifying useful presentation pieces |

Source references: ../package.json, ../src/redux/reduxSaga/AuthSaga.ts, ../src/redux/reduxSaga/MainSaga.ts, ../src/screens/cart/CheckoutScreen.tsx; ../../elexify.online/src/core/lib/services.ts and ../../elexify.online/src/app/globals.css.

## Screen inventory and priority

The presence of an existing screen is not evidence of working API integration.

| Phase | Target screens | Existing material |
| --- | --- | --- |
| 1 | Home, Categories, Cart, Account route shell; shared feedback states | StackNav, BottomTab, common headers/inputs/cards |
| 2 | CMS home, category browser, search/results, filtered listing | home, category, brands, search and ProductList/Filter screens |
| 3 | Product detail/gallery, variants, specifications, reviews, delivery | Duplicate detail screens and AddReview screen |
| 4 | Phone/OTP/profile completion, guest and signed-in cart | auth screens and CartScreen; integration must be replaced/verified |
| 5 | Addresses, review/payment, success/failure/pending | CheckoutScreen is a presentation reference only |
| 6 | Orders/details/tracking/cancel/return/invoice, profile, wishlist, addresses, security, preferences, help | orders and account directories offer partial screen references |
| 7 | Device validation, accessibility, performance and release preparation | Existing test setup requires reassessment after Expo migration |
| 8 | Comparison, review media, push notifications | Notification screen exists; backend push capability is unconfirmed |

## Customer API map

Paths are relative to the configured /api/v1/ base. Source-confirmed, not live-tested.

| Feature | Method and path |
| --- | --- |
| Home/navigation | GET site/cms/home; GET site/navigation |
| Catalog | GET site/inventory/product/list; GET site/inventory/product/details/:slug |
| Filters/categories | GET site/inventory/product/filter-options; GET site/inventory/category/list |
| Delivery | POST site/inventory/shipping/estimate |
| Cart | PUT site/inventory/product/cart/manage; GET site/inventory/product/carts |
| Buy Now | PUT site/inventory/product/temp-cart/manage; GET site/inventory/product/temp-carts |
| Coupon | POST site/inventory/product/cart/apply-coupon |
| OTP | POST auth/user/send-otp; POST auth/user/verify-otp |
| Google | POST auth/user/google |
| Profile | GET user/account/details; PUT user/account/edit |
| Address | GET user/address/list; POST user/address/add; PUT user/address/edit; DELETE user/address/delete |
| Purchase | POST site/inventory/order/place; POST site/inventory/order/verify-payment |
| Orders | GET site/inventory/order/list; GET site/inventory/order/invoice |
| After-sales | POST site/inventory/order/cancel; POST site/inventory/order/return; GET site/inventory/order/returns |
| Wishlist | PUT site/inventory/product/wishlist/toggle; GET site/inventory/product/wishlist |
| Preferences | GET/PATCH user/account/notification-preferences |

### Contract requirements

- OTP auth uses purpose=auth, mobile and phone_code=91. Verification adds otp and supports first/last names. Response data includes user, is_new_user and token.access_token/access_token_expiry.
- Carry x-guest-id on guest and login requests. Backend OTP/Google controllers transfer guest shopping resources to the user. Refetch cart/wishlist after successful login.
- Bearer token on protected requests; no bearer token on login routes. Match the existing x-api-key middleware configuration without exposing values in documentation.
- Reviewed token generator issues an access token; reviewed auth routes expose no refresh endpoint. Reauthenticate on expiry unless another supported contract is discovered.
- Keep standard cart and temporary Buy Now resources separate. Requote after address/cart/coupon changes.
- Persist the placement idempotency key and active checkout intent across interruption. Never automatically retry placement with a fresh key after an ambiguous response.
- Payment verification requires order_id, razorpay_order_id, razorpay_payment_id and razorpay_signature. Server verification/order status decides success.
- Confirm payloads, error envelopes, pagination and IDs against staging responses before defining final TypeScript contracts. Never derive payable totals from demo values.

## Native integration assessment

### Expo and migration

Recommend a controlled migration within this mobile repository. Preserve the existing implementation in version history; introduce the Expo foundation, migrate useful screens feature by feature, and remove obsolete wiring only after replacements work. Do not run destructive native regeneration until existing Android/iOS customizations have been audited. Do not change web/backend package structure.

Use app/ for routes and src/features, components, theme, api, stores, platform, hooks and utils. Platform adapters own storage, native payments, links and file sharing. Routes do not make raw HTTP calls.

### Google

Expo documents native Google libraries requiring a config plugin and development build: https://docs.expo.dev/guides/google-authentication/.

The backend verifies id_token against its configured Google client ID. Configure native sign-in to request an ID token for the accepted audience; confirm Android signing fingerprints and iOS client configuration in a later integration step. Do not assume web OAuth configuration alone covers native builds.

### Razorpay

Official Android steps document Expo installation and prebuild: https://razorpay.com/docs/payments/payment-gateway/react-native-integration/standard/integration-steps-android/?preferred-country=IN.

An older troubleshooting page contradicts these instructions. Treat current integration steps as a candidate approach, not proof of compatibility with a selected Expo SDK. Test native builds on Android/iOS with test-mode credentials, successful/failed/cancelled payments, UPI app return where applicable, and interrupted verification. Do not reuse the storefront's browser script loader.

## Open checkpoints

| Checkpoint | Required evidence | When |
| --- | --- | --- |
| Live brand/content | Reachable deployed site and actual mobile viewport review | Before final screen styling |
| Environment | Confirmed staging URL, required client configuration, read-only sample payloads | Before live integration |
| Expo/native baseline | Existing native customization audit; compatible pinned SDK/dependencies | Phase 1 |
| Google | Accepted audience and successful native ID-token exchange | Before enabling Google login |
| Payments | Android/iOS test-mode build evidence and interruption recovery | Before checkout release |
| App links | Domain association files and app identifiers | Separately scoped platform configuration |
| Push | Device registration and sending contract | Phase 8, no assumed backend support |

## Phase 1 execution checklist

1. Inventory native customizations and select the Expo dependency baseline.
2. Establish Expo Router's four-tab shell with placeholder feature boundaries.
3. Add Elexify theme and accessible primitives, skeleton/error/empty/offline states.
4. Add environment-aware API client and response adapters without production mutations.
5. Add Query provider, local stores, SecureStore adapter and guest identity lifecycle.
6. Verify TypeScript and Android/iOS startup; read staging catalog data when configured.

Phase 0 is not fully signed off until live visual and environment checkpoints are resolved. The source audit is sufficient to define the foundation work; it does not certify production or native compatibility.
