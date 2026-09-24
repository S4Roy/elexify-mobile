import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { placeOrder, verifyPayment } from '../../api/order';
import { useIdentity } from '../catalog/hooks';

const KEY_PREFIX = 'elx-checkout-idempotency:';

// Keeps a key only for the exact same request (address/payment method/coupon/
// total). A changed request signature starts a fresh idempotency key instead
// of replaying it against a now-stale request — mirrors the web storefront's
// localStorage-backed key rotation in src/app/(main)/checkout/page.tsx.
export async function getIdempotencyKey(
  mode: 'cart' | 'direct',
  requestSignature: string,
): Promise<string> {
  const storageKey = KEY_PREFIX + mode;
  const raw = await AsyncStorage.getItem(storageKey);
  let previous: { key: string; request: string } | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.key === 'string' &&
        typeof parsed.request === 'string'
      ) {
        previous = parsed;
      }
    } catch {
      // Malformed or a pre-upgrade plain-string value — discard and start fresh.
    }
  }
  const key =
    previous && previous.request === requestSignature
      ? previous.key
      : Crypto.randomUUID();
  await AsyncStorage.setItem(
    storageKey,
    JSON.stringify({ key, request: requestSignature }),
  );
  return key;
}
export async function clearIdempotencyKey(
  mode: 'cart' | 'direct',
): Promise<void> {
  await AsyncStorage.removeItem(KEY_PREFIX + mode);
}

export function usePlaceOrder() {
  return useMutation({ mutationFn: placeOrder });
}

export function useVerifyPayment() {
  return useMutation({ mutationFn: verifyPayment });
}

export function useClearCartOnOrderSuccess() {
  const identity = useIdentity();
  const queryClient = useQueryClient();
  return () => {
    queryClient
      .invalidateQueries({ queryKey: ['cart', identity] })
      .catch(() => undefined);
  };
}
