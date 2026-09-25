import { api } from './client';
export type InboxNotification = {
  _id: string;
  title: string;
  body: string;
  route?: string;
  image_url?: string;
  read_at: string | null;
  created_at: string;
  expires_at: string;
};
export async function fetchNotifications(
  cursor?: string,
  signal?: AbortSignal,
): Promise<{ items: InboxNotification[]; next_cursor: string | null }> {
  return (
    await api.get('user/notifications', {
      params: { cursor, limit: 25 },
      signal,
    })
  ).data.data;
}
export async function unreadNotifications(): Promise<number> {
  return (await api.get('user/notifications/unread-count')).data.data.count;
}
export async function getNotification(id: string): Promise<InboxNotification> {
  return (await api.get(`user/notifications/${id}`)).data.data.notification;
}
export async function markNotificationRead(id: string) {
  await api.patch(`user/notifications/${id}/read`);
}
export async function markAllNotificationsRead() {
  await api.patch('user/notifications/read-all');
}
export function safeNotificationRoute(route?: string) {
  return route &&
    route.length <= 240 &&
    /^(\/notifications|\/orders(?:\/[A-Za-z0-9_-]+)?|\/products(?:\/[A-Za-z0-9_-]+)?|\/account\/security|\/\(tabs\)\/categories)$/.test(
      route,
    )
    ? route
    : '/notifications';
}
