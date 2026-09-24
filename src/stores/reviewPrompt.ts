import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Apple limits the native prompt to ~3/year per app anyway; this cooldown
// keeps us from even asking Android (which has no built-in throttle) too often.
const COOLDOWN_DAYS = 60;
const MAX_PROMPTS = 3;

type ReviewPromptState = {
  lastPromptedAt: string | null;
  promptCount: number;
  canPrompt: () => boolean;
  recordPrompt: () => void;
};

export const useReviewPromptStore = create<ReviewPromptState>()(
  persist(
    (set, get) => ({
      lastPromptedAt: null,
      promptCount: 0,
      canPrompt: () => {
        const { lastPromptedAt, promptCount } = get();
        if (promptCount >= MAX_PROMPTS) {
          return false;
        }
        if (!lastPromptedAt) {
          return true;
        }
        const elapsedDays = (Date.now() - new Date(lastPromptedAt).getTime()) / 86_400_000;
        return elapsedDays >= COOLDOWN_DAYS;
      },
      recordPrompt: () =>
        set(s => ({ lastPromptedAt: new Date().toISOString(), promptCount: s.promptCount + 1 })),
    }),
    {
      name: 'elexify.review-prompt',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ lastPromptedAt: state.lastPromptedAt, promptCount: state.promptCount }),
    },
  ),
);
