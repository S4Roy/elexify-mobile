import { useQuery } from '@tanstack/react-query';
import { unreadNotifications } from '../../api/notifications';
import { useSession } from '../../stores/session';

/**
 * Unread inbox count for the header bell and the Account row. Shares the
 * ['notifications', …] key, so PushProvider refreshes it whenever a push
 * arrives, the app returns to the foreground, or a notification is read.
 */
export function useUnreadNotificationCount(): number {
  const authenticated = useSession(s => s.status === 'authenticated');
  const query = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: unreadNotifications,
    enabled: authenticated,
    staleTime: 30_000,
    // A badge is non-critical: don't hammer an API that lacks the endpoint.
    retry: 1,
  });
  return authenticated ? query.data ?? 0 : 0;
}
