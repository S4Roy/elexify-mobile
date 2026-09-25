jest.mock('../src/api/client', () => ({
  api: { get: jest.fn(), patch: jest.fn() },
}));
import { api } from '../src/api/client';
import {
  fetchNotifications,
  getNotification,
  markNotificationRead,
  markAllNotificationsRead,
  safeNotificationRoute,
  unreadNotifications,
} from '../src/api/notifications';
import {
  setPushCleanup,
  cleanupPushSession,
} from '../src/platform/pushLifecycle';
const mocked = jest.mocked(api);
test('notification routes reject external URLs, traversal and query payloads', () => {
  for (const route of [
    'https://evil.test',
    '//evil.test',
    '/orders/../security',
    '/orders/%2f',
    '/products/a?token=secret',
    undefined,
  ])
    expect(safeNotificationRoute(route)).toBe('/notifications');
  expect(safeNotificationRoute('/orders/abc123')).toBe('/orders/abc123');
  expect(safeNotificationRoute('/products/amplifier')).toBe(
    '/products/amplifier',
  );
});
test('inbox requests use authenticated user paths and preserve pagination', async () => {
  mocked.get.mockResolvedValueOnce({
    data: { data: { items: [], next_cursor: 'next' } },
  });
  expect(await fetchNotifications('cursor')).toEqual({
    items: [],
    next_cursor: 'next',
  });
  expect(mocked.get).toHaveBeenCalledWith(
    'user/notifications',
    expect.objectContaining({ params: { cursor: 'cursor', limit: 25 } }),
  );
  mocked.get.mockResolvedValueOnce({
    data: { data: { notification: { _id: 'id' } } },
  });
  expect(await getNotification('id')).toEqual({ _id: 'id' });
  await markNotificationRead('id');
  expect(mocked.patch).toHaveBeenCalledWith('user/notifications/id/read');
  await markAllNotificationsRead();
  expect(mocked.patch).toHaveBeenCalledWith('user/notifications/read-all');
  mocked.get.mockResolvedValueOnce({ data: { data: { count: 3 } } });
  expect(await unreadNotifications()).toBe(3);
});
test('cleanup unregisters only its own handler and propagates completion', async () => {
  const first = jest.fn(async () => {}),
    second = jest.fn(async () => {});
  const removeFirst = setPushCleanup(first);
  const removeSecond = setPushCleanup(second);
  removeFirst();
  await cleanupPushSession();
  expect(second).toHaveBeenCalledTimes(1);
  expect(first).not.toHaveBeenCalled();
  removeSecond();
  await cleanupPushSession();
  expect(second).toHaveBeenCalledTimes(1);
});
