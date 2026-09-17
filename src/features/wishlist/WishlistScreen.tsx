import React, { useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Feedback } from '../../components/ui';
import {
  ProductCard,
  ProductGridSkeleton,
  ScrollShadow,
  ShopHeader,
  shop,
} from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { useWishlist } from './hooks';

export default function WishlistScreen() {
  const wishlist = useWishlist();
  const items = wishlist.data?.pages.flatMap(page => page.items) ?? [];
  const total = wishlist.data?.pages[0]?.total ?? items.length;
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <View style={shop.page}>
      <ShopHeader title="Your wishlist" back />
      {items.length > 0 && (
        <ScrollShadow scrollY={scrollY} style={styles.toolbar}>
          <AppText style={shop.muted}>
            {total} {total === 1 ? 'item' : 'items'} saved
          </AppText>
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
        refreshing={wishlist.isRefetching && !wishlist.isFetchingNextPage}
        onRefresh={() => {
          wishlist.refetch().catch(() => undefined);
        }}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <ProductCard product={item} />
          </View>
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (wishlist.hasNextPage && !wishlist.isFetchingNextPage) {
            wishlist.fetchNextPage().catch(() => undefined);
          }
        }}
        ListHeaderComponent={
          <QueryState
            pending={wishlist.isPending}
            error={wishlist.error}
            paused={wishlist.fetchStatus === 'paused'}
            retry={() => {
              wishlist.refetch().catch(() => undefined);
            }}
            skeleton={<ProductGridSkeleton />}
          />
        }
        ListEmptyComponent={
          !wishlist.isPending && !wishlist.isError ? (
            <View style={styles.empty}>
              <Feedback
                title="Your wishlist is empty"
                message="Tap the heart on any product to save it here."
              />
              <Button label="Explore the store" onPress={() => router.push('/')} />
            </View>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {wishlist.isFetchNextPageError && (
              <Feedback
                title="Unable to load more"
                message="Your saved items are still here."
                onRetry={() => {
                  wishlist.fetchNextPage().catch(() => undefined);
                }}
              />
            )}
            {wishlist.isFetchingNextPage && (
              <AppText style={shop.muted}>Loading more…</AppText>
            )}
          </View>
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  toolbar: { paddingHorizontal: 16, paddingVertical: 12 },
  grid: { padding: 16, gap: 16, flexGrow: 1 },
  column: { gap: 16 },
  cell: { flex: 1 },
  empty: { gap: 16 },
  footer: { gap: 12, marginTop: 8 },
});
