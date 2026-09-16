import React, { useMemo, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, Feedback } from '../../components/ui';
import {
  Chip,
  IconButton,
  ProductCard,
  ShopHeader,
  shop,
} from '../../components/shop';
import { resolvedQuery } from '../../api/discovery';
import {
  emptyFilters,
  Filters,
  priceError,
  productParams,
  sorts,
  uniqueProducts,
} from './filters';
import { useCategories, useProducts } from './hooks';
import { QueryState } from './QueryState';
import FilterSheet from './FilterSheet';
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? '';
export default function ProductListScreen() {
  const route = useLocalSearchParams<Record<string, string | string[]>>();
  const key = JSON.stringify(route);
  return <ProductResults key={key} route={route} />;
}
function ProductResults({
  route,
}: {
  route: Record<string, string | string[]>;
}) {
  const initial: Filters = {
    ...emptyFilters(),
    categories: first(route.category).split(',').filter(Boolean),
    min: first(route.price_min),
    max: first(route.price_max),
    bestseller: first(route.is_bestseller) === 'true',
  };
  const [filters, setFilters] = useState<Filters>(
    priceError(initial) ? { ...initial, min: '', max: '' } : initial,
  );
  const [sort, setSort] = useState(first(route.sort) || 'newest');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const search = first(route.search_key);
  const collection = useMemo(
    () =>
      resolvedQuery(
        {
          ids: first(route.ids),
          tags: first(route.tags),
          classifications: first(route.classifications),
          is_featured: first(route.is_featured),
        },
        'product',
      ),
    [route],
  );
  const params = useMemo(
    () => productParams(search, filters, sort, collection),
    [search, filters, sort, collection],
  );
  const products = useProducts(params);
  const items = uniqueProducts(
    products.data?.pages.flatMap(p => p.items) ?? [],
  );
  const categories = useCategories({});
  const categoryNames = new Map(
    (categories.data?.pages.flatMap(p => p.items) ?? []).map(c => [
      c.slug,
      c.name,
    ]),
  );
  const count =
    filters.categories.length +
    Number(!!filters.min) +
    Number(!!filters.max) +
    Number(filters.bestseller);
  return (
    <View style={shop.page}>
      <ShopHeader
        title={
          search ? `Results for “${search}”` : first(route.title) || 'Products'
        }
        back
      />
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.controls}
        >
          <Chip
            label={`Filter${count ? ` (${count})` : ''}`}
            selected={count > 0}
            onPress={() => setFilterOpen(true)}
          />
          <Chip
            label={sorts.find(s => s.id === sort)?.label ?? 'Sort'}
            onPress={() => setSortOpen(true)}
          />
          <Chip
            label="Best selling"
            selected={filters.bestseller}
            onPress={() =>
              setFilters(f => ({ ...f, bestseller: !f.bestseller }))
            }
          />
        </ScrollView>
      </View>
      <FlatList
        key={JSON.stringify(params)}
        data={items}
        numColumns={2}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columns}
        keyboardShouldPersistTaps="handled"
        refreshing={products.isRefetching && !products.isFetchingNextPage}
        onRefresh={() => {
          products.refetch().catch(() => undefined);
        }}
        ListHeaderComponent={
          <View style={styles.heading}>
            {count > 0 && (
              <View style={styles.active}>
                {filters.categories.map(category => (
                  <Chip
                    key={category}
                    label={`${categoryNames.get(category) ?? category} ×`}
                    selected
                    onPress={() =>
                      setFilters(f => ({
                        ...f,
                        categories: f.categories.filter(c => c !== category),
                      }))
                    }
                  />
                ))}
                {(filters.min || filters.max) && (
                  <Chip
                    label={`₹${filters.min || '0'}–${filters.max || 'Any'} ×`}
                    selected
                    onPress={() =>
                      setFilters(f => ({ ...f, min: '', max: '' }))
                    }
                  />
                )}
                <Chip
                  label="Clear filters"
                  onPress={() => setFilters(emptyFilters())}
                />
              </View>
            )}
            <QueryState
              pending={products.isPending}
              error={
                products.isError && !products.isFetchNextPageError
                  ? products.error
                  : null
              }
              paused={products.fetchStatus === 'paused'}
              retry={() => {
                products.refetch().catch(() => undefined);
              }}
            />
            {products.data && (
              <AppText style={shop.muted}>
                {products.data.pages[0].total} products
              </AppText>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.tile}>
            <ProductCard product={item} />
          </View>
        )}
        ListEmptyComponent={
          !products.isPending && !products.isError ? (
            <Feedback
              title="No matching products"
              message="Try a different search or clear your filters."
            />
          ) : null
        }
        ListFooterComponent={
          <View style={styles.heading}>
            {products.isFetchNextPageError && (
              <Feedback
                title="Unable to load more"
                message="Your current products are still here."
                onRetry={() => {
                  products.fetchNextPage().catch(() => undefined);
                }}
              />
            )}
            {products.hasNextPage && (
              <Button
                label={
                  products.isFetchingNextPage
                    ? 'Loading…'
                    : 'Load more products'
                }
                disabled={products.isFetchingNextPage}
                onPress={() => {
                  products.fetchNextPage().catch(() => undefined);
                }}
              />
            )}
          </View>
        }
      />
      {filterOpen && (
        <FilterSheet
          initial={filters}
          onClose={() => setFilterOpen(false)}
          onApply={next => {
            setFilters(next);
            setFilterOpen(false);
          }}
        />
      )}
      <Modal
        visible={sortOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSortOpen(false)}
      >
        <SafeAreaView style={shop.page}>
          <View style={shop.padded}>
            <View style={shop.between}>
              <AppText style={shop.heading}>Sort products</AppText>
              <IconButton
                name="close"
                label="Close sorting"
                onPress={() => setSortOpen(false)}
              />
            </View>
            {sorts.map(option => (
              <Chip
                key={option.id}
                label={option.label}
                selected={sort === option.id}
                onPress={() => {
                  setSort(option.id);
                  setSortOpen(false);
                }}
              />
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  controls: { padding: 16, gap: 10 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  columns: { gap: 10 },
  tile: { flex: 1, maxWidth: '50%' },
  heading: { gap: 12, marginBottom: 12 },
  active: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
