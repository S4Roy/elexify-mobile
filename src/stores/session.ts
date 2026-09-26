import { refreshSessionToken, revokeCurrentSession } from '../api/sessionTransport';
import { cleanupPushSession } from '../platform/pushLifecycle';
import { create } from 'zustand';
import { sessionStorage } from '../platform/session';

type Session = {
  endingSession: boolean;
  status: 'loading' | 'guest' | 'authenticated' | 'error';
  token: string | null;
  guestId: string | null;
  initialize: () => Promise<void>;
  signIn: (token: string) => Promise<void>;
  signOut: (localOnly?: boolean) => Promise<void>;
  refreshToken: () => Promise<string>;
  logoutAll: () => Promise<void>;
};
// Serialize identity changes: a slow hydration must never overwrite a later login/logout.
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const next = queue.then(operation, operation);
  queue = next.catch(() => undefined);
  return next;
}
export const useSession = create<Session>(set => ({
  endingSession: false,
  status: 'loading',
  token: null,
  guestId: null,
  initialize: () =>
    serialize(async () => {
      set({ status: 'loading' });
      try {
        let [token, guestId] = await Promise.all([
          sessionStorage.readToken(),
          sessionStorage.guestId(),
        ]);
        if (token?.includes('.')) {
          try {
            const claims = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (!claims.sid && claims.user_id) token = await refreshSessionToken(token);
          } catch (error: any) {
            if ([401, 403].includes(error?.response?.status)) {
              await sessionStorage.removeToken();
              await sessionStorage.removeRefresh();
              token = null;
            }
          }
        }
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
      set({ endingSession: true });
      try { if (useSession.getState().token) await cleanupPushSession().catch(() => undefined); }
      finally { set({ endingSession: false }); }
      await sessionStorage.writeToken(token);
      set({ token, status: 'authenticated' });
    }),
  refreshToken: async () => {
    const before = useSession.getState().token;
    const token = await refreshSessionToken(before);
    if (useSession.getState().token === before) set({ token, status: 'authenticated' });
    return token;
  },
  logoutAll: async () => {
    set({ endingSession: true });
    try {
      await revokeCurrentSession(useSession.getState().token, true);
      await useSession.getState().signOut(true);
    } finally { set({ endingSession: false }); }
  },
  signOut: (localOnly = false) =>
    serialize(async () => {
      set({ endingSession: true });
      try {
      await cleanupPushSession().catch(() => undefined);
      if (!localOnly) await revokeCurrentSession(useSession.getState().token).catch(() => undefined);
      await sessionStorage.removeRefresh();
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
      } finally { set({ endingSession: false }); }
    }),
}));
