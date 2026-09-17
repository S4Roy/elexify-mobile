import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Feedback } from '../../components/ui';
import {
  CategoryTile,
  ProductCard,
  ProductGridSkeleton,
  ShopHeader,
  StoreImage,
  shop,
} from '../../components/shop';
import { useCategories, useProducts } from './hooks';
import { uniqueProducts } from './filters';
import { QueryState } from './QueryState';
import { apiConfig } from '../../api/config';
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
  // A leaf category (no subcategories) shows its products directly, instead
  // of an empty "explore this collection" placeholder.
  const showProducts =
    !!current && !children.isPending && !children.error && items.length === 0;
  const products = useProducts({ category: current?.slug ?? '' }, showProducts);
  const productItems = uniqueProducts(
    products.data?.pages.flatMap(p => p.items) ?? [],
  );
  // Copied out as plain booleans so branching on them below doesn't collapse
  // `products`' discriminated-union type to `never` inside the JSX closures.
  const productsPending = products.isPending;
  const productsErrorMessage = products.error?.message ?? null;
  const productsPaused = products.fetchStatus === 'paused';
  const heading = (
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
  );
  // The category is already highlighted in the rail, so the products view
  // skips the duplicate title/CTA and only surfaces a result count.
  const productsCount = !!products.data && (
    <AppText style={[shop.muted, styles.countLabel]}>
      {products.data.pages[0].total}{' '}
      {products.data.pages[0].total === 1 ? 'product' : 'products'}
    </AppText>
  );
  // Kept outside the loading/error/loaded branches so it stays visible
  // throughout, instead of disappearing while products are (re)loading.
  const backToParent = trail.length > 0 && (
    <View style={styles.backRow}>
      <Button
        label="Back to parent"
        onPress={() => setTrail(t => t.slice(0, -1))}
      />
    </View>
  );
  return (
    <View style={shop.page}>
      <ShopHeader />
      <View style={styles.body}>
        <FlatList
          style={styles.rail}
          data={parents}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (roots.hasNextPage && !roots.isFetchingNextPage) {
              roots.fetchNextPage().catch(() => undefined);
            }
          }}
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
            <>
              {roots.isFetchNextPageError && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading more categories"
                  onPress={() => {
                    roots.fetchNextPage().catch(() => undefined);
                  }}
                  style={styles.railRetry}
                >
                  <AppText style={styles.railRetryText}>Retry</AppText>
                </Pressable>
              )}
              {roots.isFetchingNextPage && (
                <AppText style={styles.railLoading}>Loading…</AppText>
              )}
            </>
          }
        />
        {showProducts ? (
          <View style={styles.children}>
            {backToParent}
            {!apiConfig.baseUrl ? (
              <View style={styles.grid}>
                <Feedback
                  title="The store is getting ready"
                  message="Please check back soon to explore our products."
                />
              </View>
            ) : productsErrorMessage ? (
              <View style={styles.grid}>
                <Feedback
                  title="Unable to load"
                  message={productsErrorMessage}
                  onRetry={() => products.refetch().catch(() => undefined)}
                />
              </View>
            ) : productsPending ? (
              productsPaused ? (
                <View style={styles.grid}>
                  <Feedback
                    title="Waiting for connection"
                    message="We’ll load products when you’re back online."
                  />
                </View>
              ) : (
                <ProductGridSkeleton />
              )
            ) : (
              <FlatList
                key={`${current?.id}-products`}
                style={styles.flexOne}
                contentContainerStyle={styles.grid}
                data={productItems}
                numColumns={2}
                columnWrapperStyle={styles.columns}
                keyExtractor={item => item.key}
                onEndReachedThreshold={0.4}
                onEndReached={() => {
                  if (products.hasNextPage && !products.isFetchingNextPage) {
                    products.fetchNextPage().catch(() => undefined);
                  }
                }}
                ListHeaderComponent={productsCount || null}
                renderItem={({ item }) => (
                  <View style={styles.tile}>
                    <ProductCard product={item} />
                  </View>
                )}
                ListEmptyComponent={
                  <Feedback
                    title="No products yet"
                    message="Check back soon for new products in this category."
                  />
                }
                ListFooterComponent={
                  <>
                    {products.isFetchNextPageError && (
                      <Feedback
                        title="Unable to load more"
                        message="Your current products are still here."
                        onRetry={() => {
                          products.fetchNextPage().catch(() => undefined);
                        }}
                      />
                    )}
                    {products.isFetchingNextPage && (
                      <AppText style={shop.muted}>Loading more products…</AppText>
                    )}
                  </>
                }
              />
            )}
          </View>
        ) : (
          <FlatList
            key={current?.id ?? 'empty'}
            style={styles.children}
            contentContainerStyle={styles.grid}
            data={items}
            numColumns={2}
            columnWrapperStyle={styles.columns}
            keyExtractor={item => item.id}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (children.hasNextPage && !children.isFetchingNextPage) {
                children.fetchNextPage().catch(() => undefined);
              }
            }}
            ListHeaderComponent={heading}
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
              !roots.isPending && !roots.error && !children.isPending && !children.error ? (
                <Feedback
                  title={current ? 'Explore this collection' : 'No categories yet'}
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
                {children.isFetchingNextPage && (
                  <AppText style={shop.muted}>Loading more categories…</AppText>
                )}
              </>
            }
          />
        )}
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
  railLoading: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
  railRetry: {
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#005A50',
  },
  railRetryText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.medium,
    fontSize: 12,
  },
  children: { flex: 1 },
  flexOne: { flex: 1 },
  backRow: { paddingBottom: 12 },
  countLabel: { paddingBottom: 4 },
  grid: { gap: 12, paddingBottom: 24 },
  columns: { gap: 10 },
  tile: { flex: 1, maxWidth: '50%' },
  heading: { gap: 12 },
});
