import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { AppText, Feedback } from '../../components/ui';
import {
  CategoryGridSkeleton,
  CategoryTile,
  ProductCard,
  ProductGridSkeleton,
  ShopHeader,
  SkeletonBlock,
  StoreImage,
  shop,
} from '../../components/shop';
import { useCategories, useProducts } from './hooks';
import { uniqueProducts } from './filters';
import { QueryState } from './QueryState';
import { apiConfig } from '../../api/config';
import type { Category } from '../../api/discovery';
import { theme } from '../../theme';

/** Shimmering placeholder matching the parent-category rail (circle badge + label), shown while the top-level categories are first loading. */
function ParentRailSkeleton() {
  return (
    <View accessibilityLabel="Loading categories">
      {[0, 1, 2, 3, 4, 5].map(item => (
        <View key={item} style={styles.parent}>
          <SkeletonBlock style={styles.circleSkeleton} />
          <SkeletonBlock style={styles.parentTextSkeleton} />
        </View>
      ))}
    </View>
  );
}

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
  const parentName =
    trail.length > 1 ? trail[trail.length - 2].name : active?.name;
  const goBack = () => setTrail(t => t.slice(0, -1));
  const backLink = trail.length > 0 && (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Back to ${parentName ?? 'previous category'}`}
      onPress={goBack}
      hitSlop={8}
      style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}
    >
      <Ionicons name="chevron-back" size={15} color={theme.colors.primary} />
      <AppText numberOfLines={1} style={styles.backText}>
        {parentName ?? 'Back'}
      </AppText>
    </Pressable>
  );
  const viewAll = (category: Category) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View all products in ${category.name}`}
      onPress={() =>
        router.push({
          pathname: '/products',
          params: { category: category.slug, title: category.name },
        })
      }
      hitSlop={6}
      style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}
    >
      <AppText style={styles.viewAllText}>View all</AppText>
      <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
    </Pressable>
  );
  const heading = (
    <View style={styles.heading}>
      {current && (
        <View style={styles.titleBlock}>
          {backLink}
          <View style={styles.titleRow}>
            <AppText
              accessibilityRole="header"
              numberOfLines={2}
              style={styles.title}
            >
              {current.name}
            </AppText>
            {viewAll(current)}
          </View>
          {items.length > 0 && (
            <AppText style={styles.subtitle}>
              {items.length} subcategor{items.length === 1 ? 'y' : 'ies'}
            </AppText>
          )}
        </View>
      )}
      {/* After the title and actions, so the placeholder sits exactly where
          the subcategory tiles render once loaded. */}
      <QueryState
        pending={roots.isPending || (!!current && children.isPending)}
        error={roots.error ?? children.error}
        paused={
          roots.fetchStatus === 'paused' || children.fetchStatus === 'paused'
        }
        retry={() => {
          roots.refetch().catch(() => undefined);
          children.refetch().catch(() => undefined);
        }}
        skeleton={<CategoryGridSkeleton />}
      />
    </View>
  );
  // Leaf category: title and product count stay pinned above the grid while
  // products (re)load, instead of disappearing with the list.
  const total = products.data?.pages[0].total;
  const productsHeader = !!current && (
    <View style={[styles.titleBlock, styles.productsHead]}>
      {backLink}
      <AppText
        accessibilityRole="header"
        numberOfLines={2}
        style={styles.title}
      >
        {current.name}
      </AppText>
      {total !== undefined ? (
        <AppText style={styles.subtitle}>
          {total} {total === 1 ? 'product' : 'products'}
        </AppText>
      ) : (
        <SkeletonBlock style={styles.countSkeleton} />
      )}
    </View>
  );
  return (
    <View style={shop.page}>
      <ShopHeader />
      <View style={styles.body}>
        {roots.isPending ? (
          <View style={styles.rail}>
            <ParentRailSkeleton />
          </View>
        ) : (
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
                {active?.id === item.id && <View style={styles.accent} />}
                <View
                  style={[
                    styles.circleWrap,
                    active?.id === item.id && styles.circleWrapActive,
                  ]}
                >
                  <StoreImage uri={item.image} label="" style={styles.circle} />
                </View>
                <AppText
                  numberOfLines={2}
                  style={[
                    styles.parentText,
                    active?.id === item.id && styles.parentTextActive,
                  ]}
                >
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
        )}
        {showProducts ? (
          <View style={styles.children}>
            {productsHeader}
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
                <View style={styles.skeletonPane}>
                  <ProductGridSkeleton compact gap={8} rowGap={10} />
                </View>
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
                renderItem={({ item }) => (
                  <View style={styles.tile}>
                    <ProductCard product={item} compact />
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
                      <AppText style={shop.muted}>
                        Loading more products…
                      </AppText>
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
const RAIL_WIDTH = 92;

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  body: { flex: 1, flexDirection: 'row' },
  rail: {
    width: RAIL_WIDTH,
    flexGrow: 0,
    backgroundColor: '#F3F5F7',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: theme.colors.border,
  },
  parent: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 6,
    minHeight: 96,
  },
  active: { backgroundColor: '#FFFFFF' },
  // Selected-item marker on the rail's leading edge.
  accent: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  circleWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  circleWrapActive: { borderColor: theme.colors.primary },
  circle: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
  },
  parentText: {
    color: '#4B5563',
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  parentTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
  },
  circleSkeleton: { width: 52, height: 52, borderRadius: 26 },
  parentTextSkeleton: { width: 50, height: 9, borderRadius: 5 },
  railLoading: {
    color: theme.colors.secondary,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 12,
  },
  railRetry: {
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 8,
    marginVertical: 6,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryLight,
  },
  railRetryText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    fontSize: 12,
  },
  children: { flex: 1, backgroundColor: '#FFFFFF' },
  flexOne: { flex: 1 },
  // Clips the placeholder rows that don't fit, instead of squeezing them.
  skeletonPane: { flex: 1, overflow: 'hidden', padding: 12, paddingTop: 0 },
  grid: { padding: 12, gap: 10, paddingBottom: 24 },
  columns: { gap: 8 },
  tile: { flex: 1, maxWidth: '50%' },
  heading: { gap: 12 },
  titleBlock: { gap: 2 },
  productsHead: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    flexShrink: 1,
    fontFamily: theme.fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
  },
  subtitle: { fontSize: 12, lineHeight: 17, color: theme.colors.secondary },
  countSkeleton: { width: 70, height: 11, marginTop: 4 },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 30,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 15,
    backgroundColor: theme.colors.primaryLight,
  },
  viewAllText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginBottom: 4,
    marginLeft: -3,
    maxWidth: '100%',
  },
  backText: {
    flexShrink: 1,
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    lineHeight: 16,
  },
});
