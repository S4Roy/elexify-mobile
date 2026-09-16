import { create } from 'zustand';
import { sessionStorage } from '../platform/session';

type Session = {
  status: 'loading' | 'guest' | 'authenticated' | 'error';
  token: string | null;
  guestId: string | null;
  initialize: () => Promise<void>;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};
// Serialize identity changes: a slow hydration must never overwrite a later login/logout.
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const next = queue.then(operation, operation);
  queue = next.catch(() => undefined);
  return next;
}
export const useSession = create<Session>(set => ({
  status: 'loading',
  token: null,
  guestId: null,
  initialize: () =>
    serialize(async () => {
      set({ status: 'loading' });
      try {
        const [token, guestId] = await Promise.all([
          sessionStorage.readToken(),
          sessionStorage.guestId(),
        ]);
        set({ token, guestId, status: token ? 'authenticated' : 'guest' });
      } catch {
        set({ token: null, guestId: null, status: 'error' });
      }
    }),
  signIn: token =>
    serialize(async () => {
      if (!token.trim()) {
        throw new Error('A valid session token is required.');
      }
      await sessionStorage.writeToken(token);
      set({ token, status: 'authenticated' });
    }),
  signOut: () =>
    serialize(async () => {
      // Stop authenticated traffic even if secure storage subsequently fails.
      set({ token: null, guestId: null, status: 'loading' });
      try {
        await sessionStorage.removeToken();
        const guestId = await sessionStorage.resetGuest();
        set({ token: null, guestId, status: 'guest' });
      } catch {
        set({ status: 'error' });
        throw new Error(
          'Could not clear your saved session. Please try again.',
        );
      }
    }),
}));
