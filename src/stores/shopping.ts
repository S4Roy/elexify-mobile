import { create } from 'zustand';

type ShoppingState = {
  postcode: string;
  addressId: string | null;
  checkoutMode: 'cart' | 'buy-now';
  selectDelivery: (postcode: string, addressId?: string) => void;
  setCheckoutMode: (mode: 'cart' | 'buy-now') => void;
  reset: () => void;
};
const initial = {
  postcode: '',
  addressId: null,
  checkoutMode: 'cart' as const,
};
// UI intent only. Cart items, quotes and totals belong to the backend/query cache.
export const useShopping = create<ShoppingState>(set => ({
  ...initial,
  selectDelivery: (postcode, addressId) =>
    set({ postcode, addressId: addressId ?? null }),
  setCheckoutMode: checkoutMode => set({ checkoutMode }),
  reset: () => set(initial),
}));
