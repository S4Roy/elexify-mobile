import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const MAX_COMPARE_PRODUCTS = 4;

export type CompareEntry = { productId: string; categoryId?: string };

type CompareState = {
  items: CompareEntry[];
  has: (productId: string) => boolean;
  add: (entry: CompareEntry) => { ok: boolean; message?: string };
  remove: (productId: string) => void;
  clear: () => void;
  replace: (items: CompareEntry[]) => void;
};

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      has: productId => get().items.some(item => item.productId === productId),
      add: entry => {
        const items = get().items;
        if (items.some(item => item.productId === entry.productId)) {
          return { ok: false, message: 'Already added to comparison.' };
        }
        if (items.length >= MAX_COMPARE_PRODUCTS) {
          return {
            ok: false,
            message: `You can compare up to ${MAX_COMPARE_PRODUCTS} products at a time. Remove a product before adding another.`,
          };
        }
        const category = items.find(item => item.categoryId)?.categoryId;
        if (category && entry.categoryId && category !== entry.categoryId) {
          return { ok: false, message: 'Choose a product from the same category to compare relevant specifications.' };
        }
        set({ items: [...items, entry] });
        return { ok: true };
      },
      remove: productId => set(s => ({ items: s.items.filter(item => item.productId !== productId) })),
      clear: () => set({ items: [] }),
      replace: items => set({ items: items.slice(0, MAX_COMPARE_PRODUCTS) }),
    }),
    {
      name: 'elexify.compare-products',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ items: state.items }),
    },
  ),
);
