import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
export function addRecent(current: string[], input: string): string[] {
  const term = input.trim().slice(0, 120);
  return term
    ? [
        term,
        ...current.filter(item => item.toLowerCase() !== term.toLowerCase()),
      ].slice(0, 8)
    : current;
}
export const useSearchHistory = create<{
  terms: string[];
  add: (term: string) => void;
  remove: (term: string) => void;
  clear: () => void;
}>()(
  persist(
    set => ({
      terms: [],
      add: term => set(s => ({ terms: addRecent(s.terms, term) })),
      remove: term => set(s => ({ terms: s.terms.filter(t => t !== term) })),
      clear: () => set({ terms: [] }),
    }),
    {
      name: 'elexify.recent-searches',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ terms: state.terms }),
    },
  ),
);
