import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Feedback } from '../../components/ui';
import { ProductCard, ShopHeader, shop } from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { useWishlist } from './hooks';

export default function WishlistScreen() {
  const wishlist = useWishlist();
  const items = wishlist.data?.pages.flatMap(page => page.items) ?? [];

  return (
    <View style={shop.page}>
      <ShopHeader title="Your wishlist" back />
      <FlatList
        data={items}
        keyExtractor={item => item.key}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <ProductCard product={item} />
          </View>
        )}
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
      />
    </View>
  );
}
const styles = StyleSheet.create({
  grid: { padding: 16, gap: 16, flexGrow: 1 },
  column: { gap: 16 },
  cell: { flex: 1 },
  empty: { gap: 16 },
});
