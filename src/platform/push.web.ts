export type PushMessage = {
  notificationId?: string;
  title?: string;
  body?: string;
};
export async function requestPushPermission() {
  return false;
}
export async function currentPushToken(): Promise<string | null> {
  return null;
}
export async function deletePushToken() {}
export function observePush(
  _receive: (message: PushMessage, tapped: boolean) => void,
  _refresh: () => void,
) {
  return () => {};
}
