import React, { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText, Feedback } from '../../components/ui';
import {
  OrdersListSkeleton,
  ShopHeader,
  money,
  shop,
} from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { OrderSummary } from '../../api/order';
import { useOrders } from './hooks';
import { orderStatusColor, orderStatusLabel as statusLabel } from './tracking';

const fmtDate = (value: string) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

function Row({ order }: { order: OrderSummary }) {
  const color = orderStatusColor(order.orderStatus);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({ pathname: '/orders/[id]', params: { id: order.id } })
      }
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconBadge}>
          <Ionicons
            name="cube-outline"
            size={19}
            color={theme.colors.primary}
          />
        </View>
        <View style={shop.flex}>
          <View style={styles.titleRow}>
            <AppText numberOfLines={1} style={styles.orderNumber}>
              #{order.orderNumber}
            </AppText>
            <View style={[styles.statusPill, { backgroundColor: color.bg }]}>
              <AppText style={[styles.statusPillText, { color: color.text }]}>
                {statusLabel(order.orderStatus)}
              </AppText>
            </View>
          </View>
          <AppText style={shop.muted}>
            Placed on {fmtDate(order.createdAt)}
          </AppText>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.secondary}
        />
      </View>
      <View style={styles.footerRow}>
        <View>
          <AppText style={styles.footerLabel}>Order total</AppText>
          <AppText style={styles.footerTotal}>
            {money(order.grandTotal)}
          </AppText>
        </View>
        <View style={styles.footerRight}>
          <AppText style={styles.footerMeta}>
            {order.totalItems} item{order.totalItems === 1 ? '' : 's'}
          </AppText>
          <AppText style={styles.footerMeta}>
            {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid online'}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

export default function OrdersListScreen() {
  const params = useLocalSearchParams<{ view?: string }>();
  const view = Array.isArray(params.view) ? params.view[0] : params.view;
  const orders = useOrders();
  const allItems = orders.data?.pages.flatMap(page => page.items) ?? [];
  const items = allItems.filter(order => {
    const status = order.orderStatus.toLowerCase();
    if (view === 'ongoing')
      return !['delivered', 'returned', 'cancelled', 'failed'].includes(status);
    if (view === 'completed') return status === 'delivered';
    if (view === 'returns') return status.includes('return');
    if (view === 'cancelled') return status.includes('cancel');
    return true;
  });
  useEffect(() => {
    if (
      view &&
      items.length === 0 &&
      orders.hasNextPage &&
      !orders.isFetchingNextPage &&
      !orders.isFetchNextPageError
    ) {
      orders.fetchNextPage().catch(() => undefined);
    }
  }, [view, items.length, orders]);
  const title =
    view === 'ongoing'
      ? 'Ongoing Orders'
      : view === 'completed'
      ? 'Completed Orders'
      : view === 'returns'
      ? 'Returns'
      : view === 'cancelled'
      ? 'Cancelled Orders'
      : 'Your orders';

  return (
    <View style={shop.page}>
      <ShopHeader title={title} back />
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (orders.hasNextPage && !orders.isFetchingNextPage) {
            orders.fetchNextPage().catch(() => undefined);
          }
        }}
        ListHeaderComponent={
          <QueryState
            pending={orders.isPending}
            error={orders.error}
            paused={orders.fetchStatus === 'paused'}
            retry={() => {
              orders.refetch().catch(() => undefined);
            }}
            skeleton={<OrdersListSkeleton />}
          />
        }
        ListFooterComponent={
          !orders.isPending && orders.isFetchingNextPage ? (
            <View style={styles.loadingMore}>
              <AppText style={shop.muted}>Loading more orders…</AppText>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !orders.isPending && !orders.isError && !orders.hasNextPage ? (
            <Feedback
              title={view ? `No ${title.toLowerCase()}` : 'No orders yet'}
              message={
                view
                  ? 'Orders in this category will appear here.'
                  : 'Orders you place will show up here.'
              }
            />
          ) : null
        }
        renderItem={({ item }) => <Row order={item} />}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  card: {
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  cardPressed: { backgroundColor: theme.colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  orderNumber: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    flexShrink: 1,
  },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusPillText: { fontSize: 10, fontFamily: theme.fonts.semibold },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
  },
  footerLabel: {
    color: theme.colors.secondary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footerTotal: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text,
    marginTop: 2,
  },
  footerRight: { alignItems: 'flex-end', gap: 2 },
  footerMeta: { color: theme.colors.secondary, fontSize: 11 },
  loadingMore: { paddingVertical: 16, alignItems: 'center' },
});
