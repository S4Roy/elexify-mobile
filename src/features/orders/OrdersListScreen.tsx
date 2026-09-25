import React, { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText } from '../../components/ui';
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

type OrdersView = 'ongoing' | 'completed' | 'returns' | 'cancelled';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const VIEWS: { id: OrdersView; label: string; icon: IconName }[] = [
  { id: 'ongoing', label: 'Ongoing', icon: 'cube-outline' },
  { id: 'completed', label: 'Completed', icon: 'checkmark-done-outline' },
  { id: 'returns', label: 'Returns', icon: 'return-down-back-outline' },
  { id: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
];

const EMPTY_COPY: Record<
  OrdersView | 'all',
  { icon: IconName; title: string; message: string }
> = {
  all: {
    icon: 'bag-handle-outline',
    title: 'No orders yet',
    message: "Once you place an order, you'll be able to track it right here.",
  },
  ongoing: {
    icon: 'cube-outline',
    title: 'No ongoing orders',
    message:
      "You don't have anything on the way right now. Orders being prepared or shipped will show up here.",
  },
  completed: {
    icon: 'checkmark-done-outline',
    title: 'No completed orders yet',
    message: 'Orders appear here once they have been delivered.',
  },
  returns: {
    icon: 'return-down-back-outline',
    title: 'No returns',
    message: 'Returns you request on delivered orders will appear here.',
  },
  cancelled: {
    icon: 'close-circle-outline',
    title: 'No cancelled orders',
    message: 'None of your orders have been cancelled.',
  },
};

function OrdersEmptyState({
  view,
  hasOtherOrders,
}: {
  view?: OrdersView;
  hasOtherOrders: boolean;
}) {
  const copy = EMPTY_COPY[view ?? 'all'];
  return (
    <View style={styles.empty}>
      <View style={styles.illustration} accessibilityElementsHidden>
        <View style={styles.illustrationRing}>
          <View style={styles.illustrationCore}>
            <Ionicons name={copy.icon} size={40} color={theme.colors.primary} />
          </View>
        </View>
        <View style={[styles.sparkle, styles.sparkleTop]} />
        <View style={[styles.sparkle, styles.sparkleSide]} />
      </View>
      <AppText accessibilityRole="header" style={styles.emptyTitle}>
        {copy.title}
      </AppText>
      <AppText style={styles.emptyText}>{copy.message}</AppText>

      <View style={styles.emptyActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/')}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        >
          <Ionicons name="bag-outline" size={18} color="#FFFFFF" />
          <AppText style={styles.primaryText}>Start shopping</AppText>
        </Pressable>
        {!!view && hasOtherOrders && (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.setParams({ view: '' })}
            style={({ pressed }) => [
              styles.secondary,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="receipt-outline"
              size={17}
              color={theme.colors.primary}
            />
            <AppText style={styles.secondaryText}>View all orders</AppText>
          </Pressable>
        )}
      </View>

      {!!view && (
        <View style={styles.others}>
          <AppText style={styles.othersLabel}>Browse other orders</AppText>
          <View style={styles.othersRow}>
            {VIEWS.filter(v => v.id !== view).map(v => (
              <Pressable
                key={v.id}
                accessibilityRole="button"
                accessibilityLabel={`${v.label} orders`}
                onPress={() => router.setParams({ view: v.id })}
                style={({ pressed }) => [
                  styles.otherChip,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={v.icon}
                  size={15}
                  color={theme.colors.primary}
                />
                <AppText style={styles.otherText}>{v.label}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default function OrdersListScreen() {
  const params = useLocalSearchParams<{ view?: string }>();
  const rawView = Array.isArray(params.view) ? params.view[0] : params.view;
  const view = VIEWS.some(v => v.id === rawView)
    ? (rawView as OrdersView)
    : undefined;
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
            <OrdersEmptyState
              view={view}
              hasOtherOrders={allItems.length > 0}
            />
          ) : null
        }
        renderItem={({ item }) => <Row order={item} />}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  list: { padding: 16, gap: 12, flexGrow: 1 },
  pressed: { opacity: 0.8 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 32,
  },
  illustration: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
  emptyActions: { alignSelf: 'stretch', gap: 10, marginTop: 24 },
  primary: {
    minHeight: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
  },
  primaryText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
  secondary: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#B2DFDB',
    backgroundColor: '#FFFFFF',
  },
  secondaryText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
  others: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 10,
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  othersLabel: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.secondary,
  },
  othersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  otherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  otherText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
  },
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
