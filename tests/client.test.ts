jest.mock('../src/api/config', () => ({
  apiConfig: {
    baseUrl: 'https://example.test/api/v1/',
    publicKey: 'public-client-key',
  },
}));
jest.mock('../src/platform/session', () => ({ sessionStorage: {} }));
import { AxiosHeaders } from 'axios';
import { api } from '../src/api/client';
import { useSession } from '../src/stores/session';
import { parseCatalogPreview } from '../src/api/catalog';
beforeEach(() => {
  useSession.setState({
    status: 'authenticated',
    token: 'test-token',
    guestId: 'guest-a',
  });
});
test('login carries guest identity without bearer credentials', async () => {
  await api.post(
    'auth/user/verify-otp',
    {},
    {
      adapter: async config => {
        expect(config.headers.get('Authorization')).toBeUndefined();
        expect(config.headers.get('x-guest-id')).toBe('guest-a');
        return {
          data: {},
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          config,
        };
      },
    },
  );
});
test('customer requests carry bearer credentials and no guest header', async () => {
  await api.get('user/account/details', {
    adapter: async config => {
      expect(config.headers.get('Authorization')).toBe('Bearer test-token');
      expect(config.headers.get('x-guest-id')).toBeUndefined();
      return {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders(),
        config,
      };
    },
  });
});
test('rejects external URLs before sending credentials', async () => {
  const adapter = jest.fn();
  await expect(api.get('https://other.test', { adapter })).rejects.toThrow(
    'Invalid API route',
  );
  expect(adapter).not.toHaveBeenCalled();
});
test('rejects requests during session restoration', async () => {
  useSession.setState({ status: 'loading' });
  await expect(api.get('user/account/details')).rejects.toThrow(
    'session is not ready',
  );
});
test('malformed product responses are errors, not empty catalogs', () => {
  expect(() => parseCatalogPreview(undefined)).toThrow();
  expect(() => parseCatalogPreview([{ _id: 'a' }])).toThrow();
  expect(parseCatalogPreview([])).toEqual([]);
  expect(parseCatalogPreview([{ _id: 'a', name: 'Board' }])).toEqual([
    { id: 'a', name: 'Board' },
  ]);
});
