import React, { useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Feedback } from '../../components/ui';
import {
  ProductCard,
  ProductGridSkeleton,
  ScrollShadow,
  ShopHeader,
  shop,
} from '../../components/shop';
import { uniqueProducts } from '../catalog/filters';
import { apiConfig } from '../../api/config';
import { useRecentlyViewed } from '../../stores/recentlyViewed';
import { useRecentProducts } from './hooks';

export default function RecentlyViewedScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const ids = useRecentlyViewed(s => s.ids);
  const clear = useRecentlyViewed(s => s.clear);
  const order = useMemo(
    () => new Map(ids.map((id, index) => [id, index])),
    [ids],
  );
  const products = useRecentProducts(ids);
  const items = uniqueProducts(products.data?.items ?? [])
    .filter(item => order.has(item.id))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  const pending = ids.length > 0 && products.isPending;
  const missingProducts =
    ids.length > 0 && !pending && !products.isError && items.length === 0;

  return (
    <View style={shop.page}>
      <ShopHeader title="Recently viewed" back />
      {ids.length > 0 && (
        <ScrollShadow scrollY={scrollY} style={styles.toolbar}>
          <AppText style={shop.muted}>
            {items.length > 0
              ? `${items.length} product${items.length === 1 ? '' : 's'}`
              : 'Recently viewed products'}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear recently viewed"
            onPress={clear}
            hitSlop={8}
            style={styles.clearButton}
          >
            <AppText style={shop.link}>Clear all</AppText>
          </Pressable>
        </ScrollShadow>
      )}
      <Animated.FlatList
        data={items}
        keyExtractor={item => item.key}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        refreshing={products.isRefetching}
        onRefresh={
          ids.length > 0
            ? () => {
                products.refetch().catch(() => undefined);
              }
            : undefined
        }
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <ProductCard product={item} />
          </View>
        )}
        ListHeaderComponent={
          !apiConfig.baseUrl && ids.length > 0 ? (
            <Feedback
              title="The store is getting ready"
              message="Please check back soon to explore our products."
            />
          ) : products.isError ? (
            <Feedback
              title="Unable to load"
              message={products.error.message}
              onRetry={() => {
                products.refetch().catch(() => undefined);
              }}
            />
          ) : pending ? (
            <ProductGridSkeleton />
          ) : null
        }
        ListEmptyComponent={
          ids.length === 0 ? (
            <View style={styles.empty}>
              <Feedback
                title="Nothing viewed yet"
                message="Products you open will show up here, so you can find them again easily."
              />
              <Button label="Explore the store" onPress={() => router.push('/')} />
            </View>
          ) : missingProducts ? (
            <View style={styles.empty}>
              <Feedback
                title="These products are no longer available"
                message="Clear this list to start fresh."
              />
              <Button label="Clear list" onPress={clear} />
            </View>
          ) : null
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  clearButton: { minHeight: 32, justifyContent: 'center' },
  grid: { padding: 16, gap: 16, flexGrow: 1 },
  column: { gap: 16 },
  cell: { flex: 1 },
  empty: { gap: 16 },
});
