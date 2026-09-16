import axios from 'axios';
import { apiConfig } from './config';
import { useSession } from '../stores/session';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}
const authRoutes = new Set([
  'auth/user/login',
  'auth/user/signup',
  'auth/user/send-otp',
  'auth/user/verify-otp',
  'auth/user/google',
  'auth/user/request-password-reset',
  'auth/user/reset-password',
]);
export const api = axios.create({
  baseURL: apiConfig.baseUrl ?? undefined,
  timeout: 15000,
});
api.interceptors.request.use(config => {
  if (!apiConfig.baseUrl) {
    throw new ApiError(
      'The store connection is unavailable. Please try again later.',
    );
  }
  const path = config.url ?? '';
  if (
    !path ||
    path.startsWith('/') ||
    path.includes('://') ||
    path.includes('..')
  ) {
    throw new ApiError('Invalid API route.');
  }
  const session = useSession.getState();
  if (session.status === 'loading' || session.status === 'error') {
    throw new ApiError('Your session is not ready. Please try again.');
  }
  config.headers.set('x-api-key', apiConfig.publicKey);
  config.headers.delete('Authorization');
  config.headers.delete('x-guest-id');
  if (session.token && !authRoutes.has(path.split('?')[0])) {
    config.headers.set('Authorization', `Bearer ${session.token}`);
  } else if (session.guestId) {
    config.headers.set('x-guest-id', session.guestId);
  }
  return config;
});
api.interceptors.response.use(
  response => response,
  async (error: unknown) => {
    if (error instanceof ApiError || axios.isCancel(error)) {
      return Promise.reject(error);
    }
    if (!axios.isAxiosError(error)) {
      return Promise.reject(
        new ApiError('Something went wrong. Please try again.'),
      );
    }
    const status = error.response?.status;
    // Ignore an old request's 401 after the user has switched sessions.
    const token = useSession.getState().token;
    if (
      status === 401 &&
      token &&
      error.config?.headers.get('Authorization') === `Bearer ${token}`
    ) {
      await useSession
        .getState()
        .signOut()
        .catch(() => undefined);
    }
    const data = error.response?.data;
    const message = data?.validation?.body?.message ?? data?.message;
    return Promise.reject(
      new ApiError(
        typeof message === 'string'
          ? message
          : status
          ? 'The request could not be completed.'
          : 'Unable to connect. Check your connection and try again.',
        status,
      ),
    );
  },
);
