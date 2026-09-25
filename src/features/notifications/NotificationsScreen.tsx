import React, { useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { AppText } from '../../components/ui';
import { ShopHeader, SkeletonBlock, shop } from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { useSession } from '../../stores/session';
import {
  type InboxNotification,
  fetchNotifications,
  getNotification,
  markAllNotificationsRead,
  markNotificationRead,
  safeNotificationRoute,
  unreadNotifications,
} from '../../api/notifications';
import { PushOptInCard } from './PushOptIn';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Look = { icon: IconName; color: string; soft: string };

const PRIMARY = {
  color: theme.colors.primary,
  soft: theme.colors.primaryLight,
};
const SUCCESS = { color: '#15803D', soft: '#DCFCE7' };
const DANGER = { color: '#DC2626', soft: '#FEE2E2' };
const WARNING = { color: '#D97706', soft: '#FEF3C7' };
const OFFER = { color: '#DB2777', soft: '#FCE7F3' };

/** Icon and colour per backend notification type (see elexify-backend
 * services/notification/push/templates.js), falling back to the route. */
function lookFor(n: InboxNotification): Look {
  const t = (n.type ?? '').toUpperCase();
  if (/FAILED|CANCELLED|REJECTED/.test(t)) {
    return { icon: 'alert-circle-outline', ...DANGER };
  }
  if (/DELIVERED|COMPLETED/.test(t)) {
    return { icon: 'checkmark-done-outline', ...SUCCESS };
  }
  if (/OUT_FOR_DELIVERY/.test(t)) {
    return { icon: 'bicycle-outline', ...PRIMARY };
  }
  if (/SHIPPED/.test(t)) {
    return { icon: 'car-outline', ...PRIMARY };
  }
  if (/^ORDER_/.test(t)) {
    return { icon: 'cube-outline', ...PRIMARY };
  }
  if (/^PAYMENT_/.test(t)) {
    return { icon: 'card-outline', ...PRIMARY };
  }
  if (/^REFUND_/.test(t)) {
    return { icon: 'wallet-outline', ...SUCCESS };
  }
  if (/^RETURN_/.test(t)) {
    return { icon: 'return-down-back-outline', ...WARNING };
  }
  if (/ACCOUNT|PASSWORD|EMAIL|MOBILE|SUSPICIOUS|SECURITY/.test(t)) {
    return { icon: 'shield-checkmark-outline', ...WARNING };
  }
  if (/PRICE_DROP/.test(t)) {
    return { icon: 'trending-down-outline', ...OFFER };
  }
  if (/BACK_IN_STOCK|NEW_PRODUCT/.test(t)) {
    return { icon: 'sparkles-outline', ...OFFER };
  }
  if (/CART/.test(t)) {
    return { icon: 'bag-handle-outline', ...OFFER };
  }
  if (/PROMO/.test(t)) {
    return { icon: 'pricetag-outline', ...OFFER };
  }
  if (n.route?.startsWith('/orders')) {
    return { icon: 'cube-outline', ...PRIMARY };
  }
  if (n.route?.startsWith('/account')) {
    return { icon: 'shield-checkmark-outline', ...WARNING };
  }
  return { icon: 'notifications-outline', ...PRIMARY };
}

/** "Just now", "12m", "3h", "Yesterday", "24 Sep". */
function timeAgo(iso: string, now = Date.now()) {
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) {
    return '';
  }
  const mins = Math.max(0, Math.round((now - at) / 60000));
  if (mins < 1) {
    return 'Just now';
  }
  if (mins < 60) {
    return `${mins}m ago`;
  }
  const hours = Math.round(mins / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  if (hours < 48) {
    return 'Yesterday';
  }
  return new Date(at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function sectionTitle(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  if (Date.now() - d.getTime() < 7 * 86_400_000) {
    return 'This week';
  }
  return 'Earlier';
}

function groupByDay(items: InboxNotification[]) {
  const sections: { title: string; data: InboxNotification[] }[] = [];
  for (const item of items) {
    const title = sectionTitle(item.created_at);
    const last = sections[sections.length - 1];
    if (last?.title === title) {
      last.data.push(item);
    } else {
      sections.push({ title, data: [item] });
    }
  }
  return sections;
}

function NotificationRow({
  item,
  onPress,
}: {
  item: InboxNotification;
  onPress: () => void;
}) {
  const unread = !item.read_at;
  const look = lookFor(item);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'Unread. ' : ''}${item.title}. ${
        item.body
      }. ${timeAgo(item.created_at)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        unread && styles.rowUnread,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: look.soft }]}>
        <Ionicons name={look.icon} size={20} color={look.color} />
      </View>
      <View style={shop.flex}>
        <View style={styles.rowHead}>
          <AppText
            style={[styles.rowTitle, unread && styles.rowTitleUnread]}
            numberOfLines={2}
          >
            {item.title}
          </AppText>
          <AppText style={styles.rowTime}>{timeAgo(item.created_at)}</AppText>
        </View>
        {!!item.body && (
          <AppText style={styles.rowBody} numberOfLines={3}>
            {item.body}
          </AppText>
        )}
        {!!item.image_url && (
          <Image
            source={{ uri: item.image_url }}
            style={styles.rowImage}
            resizeMode="cover"
          />
        )}
      </View>
      {unread && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

function InboxSkeleton() {
  return (
    <View style={styles.skeleton} accessibilityLabel="Loading notifications">
      {[0, 1, 2, 3, 4].map(i => (
        <View key={i} style={styles.skeletonRow}>
          <SkeletonBlock style={styles.skeletonIcon} />
          <View style={styles.skeletonText}>
            <SkeletonBlock style={styles.skeletonLineWide} />
            <SkeletonBlock style={styles.skeletonLine} />
            <SkeletonBlock style={styles.skeletonLineShort} />
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyState({
  icon,
  title,
  message,
  action,
  onAction,
}: {
  icon: IconName;
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.illustration} accessibilityElementsHidden>
        <View style={styles.illustrationRing}>
          <View style={styles.illustrationCore}>
            <Ionicons name={icon} size={38} color={theme.colors.primary} />
          </View>
        </View>
        <View style={[styles.sparkle, styles.sparkleTop]} />
        <View style={[styles.sparkle, styles.sparkleSide]} />
      </View>
      <AppText accessibilityRole="header" style={styles.emptyTitle}>
        {title}
      </AppText>
      <AppText style={styles.emptyText}>{message}</AppText>
      {!!action && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [
            styles.emptyButton,
            pressed && styles.pressed,
          ]}
        >
          <AppText style={styles.emptyButtonText}>{action}</AppText>
        </Pressable>
      )}
    </View>
  );
}

export default function NotificationsScreen() {
  const authenticated = useSession(s => s.status === 'authenticated');
  const client = useQueryClient();
  const [openError, setOpenError] = useState('');
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
  const [markingAll, setMarkingAll] = useState(false);
  const items = query.data?.pages.flatMap(p => p.items) ?? [];
  const unread = count.data ?? 0;

  const refreshInbox = () =>
    client.invalidateQueries({ queryKey: ['notifications'] });

  const open = async (item: InboxNotification) => {
    setOpenError('');
    try {
      // Re-fetch so the destination comes from the server, not the list.
      const n = await getNotification(item._id);
      if (!item.read_at) {
        await markNotificationRead(item._id);
        refreshInbox().catch(() => undefined);
      }
      router.push(safeNotificationRoute(n.route) as Href);
    } catch (e) {
      setOpenError(
        e instanceof Error ? e.message : 'Unable to open this notification.',
      );
    }
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      await refreshInbox();
    } catch (e) {
      setOpenError(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setMarkingAll(false);
    }
  };

  if (!authenticated) {
    return (
      <View style={shop.page}>
        <ShopHeader title="Notifications" back />
        <EmptyState
          icon="notifications-outline"
          title="Sign in to see your notifications"
          message="Order updates, delivery alerts and account notices will appear here."
          action="Sign in"
          onAction={() => router.push('/login')}
        />
      </View>
    );
  }

  return (
    <View style={shop.page}>
      <ShopHeader title="Notifications" back />
      <SectionList
        sections={groupByDay(items)}
        keyExtractor={item => item._id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => {
              refreshInbox().catch(() => undefined);
            }}
            colors={[theme.colors.primary]}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            query.fetchNextPage().catch(() => undefined);
          }
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <PushOptInCard variant="inbox" />
            {items.length > 0 && (
              <View style={styles.toolbar}>
                <AppText style={styles.toolbarText}>
                  {unread > 0 ? `${unread} unread` : "You're all caught up"}
                </AppText>
                {unread > 0 && (
                  <Pressable
                    accessibilityRole="button"
                    disabled={markingAll}
                    onPress={markAll}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.markAll,
                      (pressed || markingAll) && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name="checkmark-done"
                      size={15}
                      color={theme.colors.primary}
                    />
                    <AppText style={styles.markAllText}>
                      {markingAll ? 'Marking…' : 'Mark all as read'}
                    </AppText>
                  </Pressable>
                )}
              </View>
            )}
            {!!openError && (
              <View accessibilityRole="alert" style={styles.error}>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={theme.colors.danger}
                />
                <AppText style={styles.errorText}>{openError}</AppText>
              </View>
            )}
            <QueryState
              pending={query.isPending}
              error={query.error}
              paused={query.fetchStatus === 'paused'}
              retry={() => {
                query.refetch().catch(() => undefined);
              }}
              skeleton={<InboxSkeleton />}
            />
          </View>
        }
        renderSectionHeader={({ section }) => (
          <AppText style={styles.sectionTitle}>{section.title}</AppText>
        )}
        renderItem={({ item, index, section }) => (
          <View
            style={[
              styles.cardSlice,
              index === 0 && styles.cardFirst,
              index === section.data.length - 1 && styles.cardLast,
            ]}
          >
            {index > 0 && <View style={styles.divider} />}
            <NotificationRow item={item} onPress={() => open(item)} />
          </View>
        )}
        ListEmptyComponent={
          !query.isPending && !query.isError ? (
            <EmptyState
              icon="notifications-off-outline"
              title="No notifications yet"
              message="We'll let you know here when there's news about your orders, payments or account."
              action="Start shopping"
              onAction={() => router.push('/')}
            />
          ) : null
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <AppText style={styles.loadingMore}>Loading more…</AppText>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  list: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  header: { gap: 12 },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  toolbarText: { fontSize: 13, color: theme.colors.secondary },
  markAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: {
    fontSize: 13,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.primary,
  },
  error: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
  },
  errorText: { flex: 1, color: theme.colors.danger, fontSize: 13 },

  // Sections and rows
  sectionTitle: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: theme.fonts.semibold,
    color: theme.colors.secondary,
  },
  cardSlice: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  cardFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 70,
    backgroundColor: theme.colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowUnread: { backgroundColor: '#F4FBF9' },
  rowPressed: { backgroundColor: '#EEF5F4' },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rowTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: theme.fonts.medium,
    color: '#374151',
  },
  rowTitleUnread: {
    fontFamily: theme.fonts.semibold,
    color: theme.colors.text,
  },
  rowTime: { fontSize: 11, lineHeight: 20, color: theme.colors.secondary },
  rowBody: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.secondary,
  },
  rowImage: {
    marginTop: 10,
    width: '100%',
    aspectRatio: 2,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    backgroundColor: theme.colors.primary,
  },
  loadingMore: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
    color: theme.colors.secondary,
  },

  // Skeleton
  skeleton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  skeletonRow: { flexDirection: 'row', gap: 12, padding: 14 },
  skeletonIcon: { width: 44, height: 44, borderRadius: 22 },
  skeletonText: { flex: 1, gap: 8, paddingTop: 2 },
  skeletonLineWide: { height: 13, width: '70%', borderRadius: 6 },
  skeletonLine: { height: 11, width: '95%', borderRadius: 6 },
  skeletonLineShort: { height: 11, width: '40%', borderRadius: 6 },

  // Empty / signed-out
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  illustration: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  illustrationRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  illustrationCore: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sparkle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#80CBC4',
  },
  sparkleTop: { width: 14, height: 14, top: 8, right: 18 },
  sparkleSide: { width: 9, height: 9, bottom: 22, left: 8, opacity: 0.7 },
  emptyTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 20,
    lineHeight: 28,
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 6,
    maxWidth: 300,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  emptyButton: {
    alignSelf: 'stretch',
    minHeight: 50,
    marginTop: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
});
