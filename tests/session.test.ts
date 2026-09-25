jest.mock('../src/platform/session', () => ({
  sessionStorage: {
    readToken: jest.fn(),
    guestId: jest.fn(),
    writeToken: jest.fn(),
    removeToken: jest.fn(),
    resetGuest: jest.fn(),
  },
}));
import { sessionStorage } from '../src/platform/session';
import { useSession } from '../src/stores/session';
const storage = jest.mocked(sessionStorage);
beforeEach(() => {
  useSession.setState({ token: null, guestId: null, status: 'loading' });
  storage.readToken.mockResolvedValue(null);
  storage.guestId.mockResolvedValue('guest-a');
  storage.resetGuest.mockResolvedValue('guest-b');
});
test('restores a guest and preserves their identity during login', async () => {
  await useSession.getState().initialize();
  expect(useSession.getState()).toMatchObject({
    status: 'guest',
    guestId: 'guest-a',
  });
  await useSession.getState().signIn('token-a');
  expect(storage.writeToken).toHaveBeenCalledWith('token-a');
  expect(useSession.getState()).toMatchObject({
    status: 'authenticated',
    guestId: 'guest-a',
    token: 'token-a',
  });
});
test('logout clears credentials and rotates guest identity', async () => {
  await useSession.getState().initialize();
  await useSession.getState().signIn('token-a');
  await useSession.getState().signOut();
  expect(storage.removeToken).toHaveBeenCalled();
  expect(useSession.getState()).toMatchObject({
    status: 'guest',
    guestId: 'guest-b',
    token: null,
  });
});
test('storage failure blocks traffic rather than silently creating a different identity', async () => {
  storage.readToken.mockRejectedValueOnce(new Error('unavailable'));
  await useSession.getState().initialize();
  expect(useSession.getState()).toMatchObject({
    status: 'error',
    token: null,
    guestId: null,
  });
});
test('a queued login wins over slow initialization', async () => {
  let finish!: (value: string | null) => void;
  storage.readToken.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  const hydration = useSession.getState().initialize();
  const login = useSession.getState().signIn('new-token');
  await Promise.resolve();
  finish('old-token');
  await Promise.all([hydration, login]);
  expect(useSession.getState().token).toBe('new-token');
});

test('push cleanup runs with the previous identity before logout and account switching', async () => {
  const { setPushCleanup } = require('../src/platform/pushLifecycle');
  const identities: (string | null)[] = [];
  const remove = setPushCleanup(async () => { identities.push(useSession.getState().token); });
  try {
    await useSession.getState().signIn('account-a');
    await useSession.getState().signIn('account-b');
    await useSession.getState().signOut();
    expect(identities).toEqual(['account-a', 'account-b']);
    expect(useSession.getState().token).toBeNull();
  } finally { remove(); }
});
