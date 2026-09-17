import React, { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText, Feedback } from '../../components/ui';
import { ShopHeader, money, shop } from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { OrderSummary } from '../../api/order';
import { useOrders } from './hooks';

const statusLabel = (status: string) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ') : 'Pending';

function Row({ order }: { order: OrderSummary }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })}
      style={styles.row}
    >
      <View style={shop.between}>
        <AppText style={styles.orderNumber}>{order.orderNumber}</AppText>
        <AppText style={shop.link}>{statusLabel(order.orderStatus)}</AppText>
      </View>
      <AppText style={shop.muted}>
        {order.totalItems} item{order.totalItems === 1 ? '' : 's'} · {money(order.grandTotal)}
      </AppText>
      <AppText style={shop.muted}>
        {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid online'} ·{' '}
        {statusLabel(order.paymentStatus)}
      </AppText>
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
    if (view === 'ongoing') return !['delivered', 'returned', 'cancelled', 'failed'].includes(status);
    if (view === 'completed') return status === 'delivered';
    if (view === 'returns') return status.includes('return');
    if (view === 'cancelled') return status.includes('cancel');
    return true;
  });
  useEffect(() => {
    if (view && items.length === 0 && orders.hasNextPage && !orders.isFetchingNextPage && !orders.isFetchNextPageError) {
      orders.fetchNextPage().catch(() => undefined);
    }
  }, [view, items.length, orders]);
  const title = view === 'ongoing' ? 'Ongoing Orders' : view === 'completed' ? 'Completed Orders' : view === 'returns' ? 'Returns' : view === 'cancelled' ? 'Cancelled Orders' : 'Your orders';

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
          />
        }
        ListEmptyComponent={
          !orders.isPending && !orders.isError && !orders.hasNextPage ? (
            <Feedback title={view ? `No ${title.toLowerCase()}` : 'No orders yet'} message={view ? 'Orders in this category will appear here.' : 'Orders you place will show up here.'} />
          ) : null
        }
        renderItem={({ item }) => <Row order={item} />}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  row: {
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    marginBottom: 12,
  },
  orderNumber: { fontFamily: theme.fonts.medium, fontSize: 15 },
});
