import React, { useState } from 'react';
import { FlatList, Pressable, View, Image } from 'react-native';
import { router, type Href } from 'expo-router';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { AppText, Button, Feedback } from '../../components/ui';
import { ShopHeader, shop } from '../../components/shop';
import { useSession } from '../../stores/session';
import {
  fetchNotifications,
  getNotification,
  markAllNotificationsRead,
  markNotificationRead,
  safeNotificationRoute,
  unreadNotifications,
} from '../../api/notifications';
import { enablePush } from './PushProvider';
export default function NotificationsScreen() {
  const authenticated = useSession(s => s.status === 'authenticated');
  const client = useQueryClient();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const query = useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    queryFn: ({ pageParam, signal }) => fetchNotifications(pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.next_cursor || undefined,
    enabled: authenticated,
  });
  const count = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: unreadNotifications,
    enabled: authenticated,
  });
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await client.invalidateQueries({ queryKey: ['notifications'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={shop.page}>
      <ShopHeader
        title={`Notifications${count.data ? ` (${count.data})` : ''}`}
        back
      />
      {!authenticated ? (
        <Button
          label="Sign in to view notifications"
          onPress={() => router.push('/login')}
        />
      ) : (
        <>
          <Button
            label="Enable device notifications"
            disabled={busy}
            onPress={() => void run(enablePush)}
          />
          <Button
            label="Mark all as read"
            disabled={busy || !count.data}
            onPress={() => void run(markAllNotificationsRead)}
          />
          {!!error && <AppText accessibilityRole="alert">{error}</AppText>}
          {query.isError && (
            <Feedback
              title="Unable to load notifications"
              message={query.error.message}
              onRetry={() => {
                void query.refetch();
              }}
            />
          )}
          <FlatList
            data={query.data?.pages.flatMap(p => p.items) || []}
            keyExtractor={item => item._id}
            refreshing={query.isFetching && !query.isFetchingNextPage}
            onRefresh={() => {
              void query.refetch();
              void count.refetch();
            }}
            onEndReached={() => {
              if (query.hasNextPage && !query.isFetchingNextPage)
                void query.fetchNextPage();
            }}
            ListEmptyComponent={
              !query.isPending ? <AppText>No notifications yet.</AppText> : null
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                style={{
                  padding: 18,
                  borderBottomWidth: 1,
                  borderBottomColor: '#e5e7eb',
                  backgroundColor: item.read_at ? '#fff' : '#eef8f6',
                }}
                onPress={() =>
                  void run(async () => {
                    const n = await getNotification(item._id);
                    await markNotificationRead(item._id);
                    router.push(safeNotificationRoute(n.route) as Href);
                  })
                }
              >
                <AppText>
                  {item.read_at ? '' : '• '}
                  {item.title}
                </AppText>
                <AppText>{item.body}</AppText>
                {!!item.image_url && (
                  <Image
                    source={{ uri: item.image_url }}
                    style={{ width: '100%', height: 140 }}
                    resizeMode="contain"
                  />
                )}
                <AppText>{new Date(item.created_at).toLocaleString()}</AppText>
              </Pressable>
            )}
          />
        </>
      )}
    </View>
  );
}
