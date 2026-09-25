import React, { useEffect } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText } from '../../components/ui';
import {
  OrdersListSkeleton,
  ShopHeader,
  StoreImage,
  money,
  shop,
} from '../../components/shop';
import { fmtDate, fmtDay } from './trackingFormat';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { OrderSummary } from '../../api/order';
import { useOrders } from './hooks';
import { orderStatusLabel as statusLabel } from './tracking';

type Look = { icon: IconName; color: string; bg: string; text: string };

/** Headline for the card: what state the order is in, and since when. */
function statusLook(order: OrderSummary): Look {
  const status = order.orderStatus.toLowerCase();
  const on = (at: string | null) => (at ? ` on ${fmtDay(at)}` : '');
  if (status === 'delivered') {
    return {
      icon: 'checkmark-circle',
      color: '#15803D',
      bg: '#F0FDF4',
      text: `Delivered${on(order.deliveredAt)}`,
    };
  }
  if (status.includes('cancel')) {
    return {
      icon: 'close-circle',
      color: '#DC2626',
      bg: '#FEF2F2',
      text: `Cancelled${on(order.cancelledAt)}`,
    };
  }
  if (status === 'failed') {
    return {
      icon: 'alert-circle',
      color: '#6B7280',
      bg: '#F3F4F6',
      text: 'Order not placed — payment incomplete',
    };
  }
  if (status.includes('return')) {
    return {
      icon: 'return-down-back',
      color: '#B45309',
      bg: '#FFFBEB',
      text: status === 'returned' ? 'Returned' : 'Return in progress',
    };
  }
  if (
    order.paymentMethod !== 'cod' &&
    ['pending', 'failed'].includes(order.paymentStatus)
  ) {
    return {
      icon: 'time',
      color: '#B45309',
      bg: '#FFFBEB',
      text: 'Payment pending',
    };
  }
  if (status === 'out_for_delivery') {
    return {
      icon: 'bicycle',
      color: '#4338CA',
      bg: '#EEF2FF',
      text: 'Out for delivery today',
    };
  }
  if (status.includes('shipped') || status.includes('delivered')) {
    return {
      icon: 'car',
      color: '#4338CA',
      bg: '#EEF2FF',
      text: `${statusLabel(order.orderStatus)}${on(order.shippedAt)}`,
    };
  }
  return {
    icon: 'cube',
    color: theme.colors.primary,
    bg: theme.colors.primaryLight,
    text: statusLabel(order.orderStatus),
  };
}

const isOngoing = (status: string) =>
  !['delivered', 'returned', 'cancelled', 'failed'].includes(
    status.toLowerCase(),
  ) && !status.toLowerCase().includes('return');

function Row({ order }: { order: OrderSummary }) {
  const look = statusLook(order);
  const [first] = order.previews;
  const more = Math.max(0, order.totalItems - (first?.quantity ?? 0));
  const status = order.orderStatus.toLowerCase();
  const open = () =>
    router.push({ pathname: '/orders/[id]', params: { id: order.id } });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        look.text,
        first?.name,
        `Order ${order.orderNumber}`,
        money(order.grandTotal),
      ]
        .filter(Boolean)
        .join('. ')}
      onPress={open}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.statusBar, { backgroundColor: look.bg }]}>
        <Ionicons name={look.icon} size={16} color={look.color} />
        <AppText
          numberOfLines={1}
          style={[styles.statusText, { color: look.color }]}
        >
          {look.text}
        </AppText>
        <Ionicons name="chevron-forward" size={16} color={look.color} />
      </View>

      <View style={styles.product}>
        <View>
          <StoreImage
            uri={first?.image ?? undefined}
            label={first?.name ?? ''}
            style={styles.thumb}
          />
          {order.previews.length > 1 && (
            <View style={styles.moreBadge}>
              <AppText style={styles.moreBadgeText}>
                +{order.previews.length - 1}
              </AppText>
            </View>
          )}
        </View>
        <View style={shop.flex}>
          <AppText numberOfLines={2} style={styles.productName}>
            {first?.name ??
              `${order.totalItems} item${order.totalItems === 1 ? '' : 's'}`}
          </AppText>
          <AppText style={styles.productMeta}>
            {first
              ? more > 0
                ? `Qty ${first.quantity} · +${more} more item${
                    more === 1 ? '' : 's'
                  }`
                : `Qty ${first.quantity}`
              : ''}
          </AppText>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={shop.flex}>
          <AppText style={styles.orderNumber}>#{order.orderNumber}</AppText>
          <AppText style={styles.footerMeta}>
            {fmtDate(order.createdAt)} ·{' '}
            {order.paymentMethod === 'cod'
              ? order.isPartialCod
                ? 'Partial COD'
                : 'Cash on delivery'
              : 'Paid online'}
          </AppText>
        </View>
        <AppText style={styles.total}>{money(order.grandTotal)}</AppText>
      </View>

      {(isOngoing(status) || status === 'delivered') && (
        <View style={styles.actions}>
          {isOngoing(status) ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/orders/[id]/track',
                  params: { id: order.id },
                })
              }
              style={({ pressed }) => [
                styles.action,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="navigate-outline"
                size={15}
                color={theme.colors.primary}
              />
              <AppText style={styles.actionText}>Track order</AppText>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={open}
              style={({ pressed }) => [
                styles.action,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="star-outline"
                size={15}
                color={theme.colors.primary}
              />
              <AppText style={styles.actionText}>Rate & review</AppText>
            </Pressable>
          )}
        </View>
      )}
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
        refreshControl={
          <RefreshControl
            refreshing={orders.isRefetching && !orders.isFetchingNextPage}
            onRefresh={() => {
              orders.refetch().catch(() => undefined);
            }}
            colors={[theme.colors.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {allItems.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                {[
                  {
                    id: '' as const,
                    label: 'All',
                    icon: 'receipt-outline' as IconName,
                  },
                  ...VIEWS,
                ].map(v => {
                  const active = (view ?? '') === v.id;
                  return (
                    <Pressable
                      key={v.id || 'all'}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => router.setParams({ view: v.id })}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Ionicons
                        name={v.icon}
                        size={14}
                        color={active ? '#FFFFFF' : theme.colors.primary}
                      />
                      <AppText
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {v.id === 'completed' ? 'Delivered' : v.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            <QueryState
              pending={orders.isPending}
              error={orders.error}
              paused={orders.fetchStatus === 'paused'}
              retry={() => {
                orders.refetch().catch(() => undefined);
              }}
              skeleton={<OrdersListSkeleton />}
            />
          </>
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
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.92 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusText: { flex: 1, fontSize: 13, fontFamily: theme.fonts.semibold },
  product: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#EEF0F2',
  },
  moreBadge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    minWidth: 24,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  moreBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: theme.fonts.semibold,
  },
  productName: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  productMeta: { marginTop: 2, fontSize: 12, color: theme.colors.secondary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    marginHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  orderNumber: {
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
    color: theme.colors.text,
  },
  footerMeta: { marginTop: 1, color: theme.colors.secondary, fontSize: 12 },
  total: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  action: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#B2DFDB',
  },
  actionText: {
    fontSize: 13,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.primary,
  },
  chips: { gap: 8, paddingBottom: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  chipTextActive: { color: '#FFFFFF' },
  loadingMore: { paddingVertical: 16, alignItems: 'center' },
});
