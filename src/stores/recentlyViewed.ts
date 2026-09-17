import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
const MAX_RECENT_PRODUCTS = 20;
export function addRecentProduct(current: string[], id: string): string[] {
  return id.trim()
    ? [id, ...current.filter(item => item !== id)].slice(0, MAX_RECENT_PRODUCTS)
    : current;
}
export const useRecentlyViewed = create<{
  ids: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}>()(
  persist(
    set => ({
      ids: [],
      add: id => set(s => ({ ids: addRecentProduct(s.ids, id) })),
      remove: id => set(s => ({ ids: s.ids.filter(item => item !== id) })),
      clear: () => set({ ids: [] }),
    }),
    {
      name: 'elexify.recently-viewed',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ ids: state.ids }),
    },
  ),
);
