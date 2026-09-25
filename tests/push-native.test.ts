jest.mock('@react-native-firebase/app', () => ({
  getApps: jest.fn(() => [{}]),
}));
jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(async () => 'fcm-test-token'),
  deleteToken: jest.fn(async () => {}),
  requestPermission: jest.fn(async () => 1),
  hasPermission: jest.fn(async () => 1),
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 },
  onTokenRefresh: jest.fn(() => jest.fn()),
  onMessage: jest.fn(() => jest.fn()),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn(async () => null),
}));
import * as messaging from '@react-native-firebase/messaging';
import {
  currentPushToken,
  deletePushToken,
  observePush,
  requestPushPermission,
} from '../src/platform/push';
const m = jest.mocked(messaging);
beforeEach(() => {
  process.env.EXPO_PUBLIC_PUSH_ENABLED = 'true';
  m.hasPermission.mockResolvedValue(1);
});
afterAll(() => {
  delete process.env.EXPO_PUBLIC_PUSH_ENABLED;
});
test('permission denial does not generate a token', async () => {
  m.hasPermission.mockResolvedValueOnce(0);
  expect(await currentPushToken()).toBeNull();
  expect(m.getToken).not.toHaveBeenCalled();
  expect(await currentPushToken()).toBe('fcm-test-token');
  await deletePushToken();
  expect(m.deleteToken).toHaveBeenCalled();
});
test('disabled native configuration cannot request permission or generate a token', async () => {
  process.env.EXPO_PUBLIC_PUSH_ENABLED = 'false';
  expect(await requestPushPermission()).toBe(false);
  expect(await currentPushToken()).toBeNull();
  expect(m.requestPermission).not.toHaveBeenCalled();
  expect(m.getToken).not.toHaveBeenCalled();
});
test('foreground, background taps, cold start and token refresh listeners are wired and cleaned up', async () => {
  const receive = jest.fn(),
    refresh = jest.fn();
  m.getInitialNotification.mockResolvedValueOnce({
    fcmOptions: {},
    data: { notificationId: 'cold' },
  });
  const cleanup = observePush(receive, refresh);
  await Promise.resolve();
  expect(receive).toHaveBeenCalledWith(
    expect.objectContaining({ notificationId: 'cold' }),
    true,
  );
  m.onMessage.mock.calls[0][1]({
    fcmOptions: {},
    data: { notificationId: 'foreground' },
    notification: { title: 'Update' },
  });
  expect(receive).toHaveBeenCalledWith(
    expect.objectContaining({ notificationId: 'foreground' }),
    false,
  );
  m.onNotificationOpenedApp.mock.calls[0][1]({
    fcmOptions: {},
    data: { notificationId: 'background' },
  });
  expect(receive).toHaveBeenCalledWith(
    expect.objectContaining({ notificationId: 'background' }),
    true,
  );
  m.onTokenRefresh.mock.calls[0][1]('rotated');
  expect(refresh).toHaveBeenCalled();
  cleanup();
  expect(m.onMessage.mock.results[0].value).toHaveBeenCalled();
  expect(m.onNotificationOpenedApp.mock.results[0].value).toHaveBeenCalled();
  expect(m.onTokenRefresh.mock.results[0].value).toHaveBeenCalled();
});
