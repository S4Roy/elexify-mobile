import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

// First-launch sign-in prompt (Flipkart/Myntra pattern): a guest sees the
// login screen once, with "Skip", right after the splash. It is never forced
// and never shown again on its own — guests keep browsing and are asked to
// sign in only where it's needed (checkout, orders, account).

const SEEN_KEY = 'onboarding.welcomeLogin.v1';

type Phase = 'checking' | 'show' | 'done';

type WelcomeStore = {
  phase: Phase;
  /** Decides once per launch, after the session has been restored. */
  decide: (sessionStatus: 'guest' | 'authenticated' | 'error') => Promise<void>;
  /** Login screen left (skipped, backed out or signed in). */
  finish: () => void;
};

export const useWelcome = create<WelcomeStore>((set, get) => ({
  phase: 'checking',
  decide: async sessionStatus => {
    if (get().phase !== 'checking') return;
    if (sessionStatus !== 'guest') {
      set({ phase: 'done' });
      return;
    }
    const seen = (await AsyncStorage.getItem(SEEN_KEY).catch(() => null)) === '1';
    if (seen) {
      set({ phase: 'done' });
      return;
    }
    // Marked as soon as it's shown: killing the app on it still counts.
    await AsyncStorage.setItem(SEEN_KEY, '1').catch(() => undefined);
    set({ phase: 'show' });
  },
  finish: () => set({ phase: 'done' }),
}));
