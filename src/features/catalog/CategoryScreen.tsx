import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Feedback } from '../../components/ui';
import {
  CategoryTile,
  ShopHeader,
  StoreImage,
  shop,
} from '../../components/shop';
import { useCategories } from './hooks';
import { QueryState } from './QueryState';
import type { Category } from '../../api/discovery';
import { theme } from '../../theme';

export default function CategoryScreen() {
  const roots = useCategories({ type: 'parent' });
  const parents = roots.data?.pages.flatMap(p => p.items) ?? [];
  const [selected, setSelected] = useState<Category | null>(null);
  const active = selected ?? parents[0];
  const [trail, setTrail] = useState<Category[]>([]);
  const current = trail[trail.length - 1] ?? active;
  const children = useCategories(
    { parent_category_slug: current?.slug ?? '' },
    !!current,
  );
  const items = children.data?.pages.flatMap(p => p.items) ?? [];
  return (
    <View style={shop.page}>
      <ShopHeader />
      <View style={styles.body}>
        <FlatList
          style={styles.rail}
          data={parents}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active?.id === item.id }}
              accessibilityLabel={item.name}
              onPress={() => {
                setSelected(item);
                setTrail([]);
              }}
              style={[styles.parent, active?.id === item.id && styles.active]}
            >
              <StoreImage
                uri={item.image}
                label={item.name}
                style={styles.circle}
              />
              <AppText numberOfLines={2} style={styles.parentText}>
                {item.name}
              </AppText>
            </Pressable>
          )}
          ListFooterComponent={
            roots.hasNextPage ? (
              <Button
                label="More"
                onPress={() => {
                  roots.fetchNextPage().catch(() => undefined);
                }}
                disabled={roots.isFetchingNextPage}
              />
            ) : null
          }
        />
        <FlatList
          key={current?.id ?? 'empty'}
          style={styles.children}
          contentContainerStyle={styles.grid}
          data={items}
          numColumns={2}
          columnWrapperStyle={styles.columns}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <View style={styles.heading}>
              <QueryState
                pending={roots.isPending || (!!current && children.isPending)}
                error={roots.error ?? children.error}
                paused={
                  roots.fetchStatus === 'paused' ||
                  children.fetchStatus === 'paused'
                }
                retry={() => {
                  roots.refetch().catch(() => undefined);
                  children.refetch().catch(() => undefined);
                }}
              />
              {current && (
                <>
                  <AppText accessibilityRole="header" style={shop.heading}>
                    {current.name}
                  </AppText>
                  {trail.length > 0 && (
                    <Button
                      label="Back to parent"
                      onPress={() => setTrail(t => t.slice(0, -1))}
                    />
                  )}
                  <Button
                    label="View all products"
                    onPress={() =>
                      router.push({
                        pathname: '/products',
                        params: { category: current.slug, title: current.name },
                      })
                    }
                  />
                </>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.tile}>
              <CategoryTile
                category={item}
                onPress={
                  item.hasChildren
                    ? () => setTrail(t => [...t, item])
                    : undefined
                }
              />
            </View>
          )}
          ListEmptyComponent={
            !roots.isPending &&
            !roots.error &&
            !children.isPending &&
            !children.error ? (
              <Feedback
                title={
                  current ? 'Explore this collection' : 'No categories yet'
                }
                message={
                  current
                    ? 'View all products in this category above.'
                    : 'Check back soon for new collections.'
                }
              />
            ) : null
          }
          ListFooterComponent={
            <>
              {children.isFetchNextPageError && (
                <Feedback
                  title="Unable to load more"
                  message="Please try again."
                  onRetry={() => {
                    children.fetchNextPage().catch(() => undefined);
                  }}
                />
              )}
              {children.hasNextPage && (
                <Button
                  label={
                    children.isFetchingNextPage ? 'Loading…' : 'More categories'
                  }
                  disabled={children.isFetchingNextPage}
                  onPress={() => {
                    children.fetchNextPage().catch(() => undefined);
                  }}
                />
              )}
            </>
          }
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  body: { flex: 1, flexDirection: 'row', padding: 12, gap: 12 },
  rail: {
    maxWidth: 98,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
  },
  parent: {
    alignItems: 'center',
    padding: 8,
    gap: 7,
    minHeight: 108,
    margin: 4,
    borderRadius: 14,
  },
  active: { backgroundColor: '#005A50' },
  parentText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  children: { flex: 1 },
  grid: { gap: 12, paddingBottom: 24 },
  columns: { gap: 10 },
  tile: { flex: 1, maxWidth: '50%' },
  heading: { gap: 12 },
});
