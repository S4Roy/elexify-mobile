import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { placeOrder, verifyPayment } from '../../api/order';
import { useIdentity } from '../catalog/hooks';

const KEY_PREFIX = 'elx-checkout-idempotency:';

export async function getIdempotencyKey(mode: 'cart' | 'direct'): Promise<string> {
  const storageKey = KEY_PREFIX + mode;
  const existing = await AsyncStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }
  const fresh = Crypto.randomUUID();
  await AsyncStorage.setItem(storageKey, fresh);
  return fresh;
}
export async function clearIdempotencyKey(mode: 'cart' | 'direct'): Promise<void> {
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
    queryClient.invalidateQueries({ queryKey: ['cart', identity] }).catch(() => undefined);
  };
}
