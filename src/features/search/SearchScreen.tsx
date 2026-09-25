import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { AppText, Feedback } from '../../components/ui';
import { EmptyState } from '../../components/EmptyState';
import {
  CategoryTile,
  SearchField,
  ShopHeader,
  SkeletonBlock,
  StoreImage,
  money,
  shop,
} from '../../components/shop';
import { useSearchHistory } from '../../stores/search';
import { useRecentlyViewed } from '../../stores/recentlyViewed';
import { useRecentProducts } from '../recentlyViewed/hooks';
import type { Product } from '../../api/discovery';
import { uniqueProducts } from '../catalog/filters';
import { useCategories, useProducts } from '../catalog/hooks';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';

// Mirrors elexify.online's SearchOverlay (src/components/layout/nav/
// SearchOverlay.tsx) — same debounce window and minimum query length, so
// live suggestions feel identical across platforms.
const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;
const SUGGEST_LIMIT = 8;

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

function SuggestionRow({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  const showStrike =
    product.price !== null &&
    product.regularPrice !== null &&
    product.regularPrice > product.price;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.suggestionRow}
    >
      <StoreImage
        uri={product.image}
        label={product.name}
        style={styles.suggestionImage}
      />
      <View style={shop.flex}>
        <AppText numberOfLines={1} style={styles.suggestionName}>
          {product.name}
        </AppText>
        {!!product.category && (
          <AppText numberOfLines={1} style={shop.muted}>
            {product.category}
          </AppText>
        )}
      </View>
      <View style={styles.suggestionPriceCol}>
        <AppText style={styles.suggestionPrice}>
          {product.price === null ? '—' : money(product.price)}
        </AppText>
        {showStrike && (
          <AppText style={styles.suggestionStrike}>
            {money(product.regularPrice!)}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

function SuggestionSkeleton() {
  return (
    <View accessibilityLabel="Searching">
      {[0, 1, 2, 3].map(row => (
        <View key={row} style={styles.suggestionRow}>
          <SkeletonBlock style={styles.suggestionImage} />
          <View style={shop.flex}>
            <SkeletonBlock style={styles.skeletonLineWide} />
            <SkeletonBlock style={styles.skeletonLineNarrow} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function SearchScreen() {
  const [text, setText] = useState('');
  const debouncedText = useDebouncedValue(text, DEBOUNCE_MS);
  const query = debouncedText.trim();
  const showSuggestions = query.length >= MIN_CHARS;

  const history = useSearchHistory();
  const featured = useCategories({ featured: 'true', limit: 8 });
  // Nothing marked featured yet → fall back to the first categories.
  const noFeatured = featured.isSuccess && featured.data.pages[0].items.length === 0;
  const allCategories = useCategories({ limit: 8 }, noFeatured);
  const categories = noFeatured ? allCategories : featured;
  const categoryList = categories.data?.pages.flatMap(p => p.items) ?? [];
  const recentIds = useRecentlyViewed(s => s.ids).slice(0, 10);
  const recent = useRecentProducts(recentIds);
  // Keep most-recent-first order; the API returns them in its own order.
  const recentProducts = recentIds
    .map(id => recent.data?.items.find(p => p.id === id))
    .filter((p): p is Product => !!p);
  const suggestions = useProducts(
    { search_key: query, limit: SUGGEST_LIMIT },
    showSuggestions,
  );
  const results = uniqueProducts(
    suggestions.data?.pages.flatMap(p => p.items) ?? [],
  ).slice(0, SUGGEST_LIMIT);
  const loadingFresh = suggestions.isFetching && results.length === 0;

  const search = (value: string) => {
    const term = value.trim();
    if (!term) {
      return;
    }
    history.add(term);
    router.push({ pathname: '/products', params: { search_key: term } });
  };

  const goToProduct = (product: Product) => {
    history.add(query);
    router.push({
      pathname: '/products/[slug]',
      params: {
        slug: product.slug,
        ...(product.variationId ? { variation_id: product.variationId } : {}),
      },
    });
  };

  return (
    <View style={shop.page}>
      <ShopHeader title="Search" back />
      <ScrollView
        contentContainerStyle={shop.padded}
        keyboardShouldPersistTaps="handled"
      >
        <SearchField
          value={text}
          onChange={setText}
          onSubmit={() => search(text)}
          autoFocus
        />

        {showSuggestions ? (
          <View style={styles.suggestions}>
            <View style={styles.suggestionsHeader}>
              <AppText style={styles.suggestionsHeaderLabel}>
                Suggestions
              </AppText>
              {suggestions.isFetching ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.secondary}
                />
              ) : (
                !suggestions.isError && (
                  <AppText style={styles.suggestionsCount}>
                    {results.length} result{results.length === 1 ? '' : 's'}
                  </AppText>
                )
              )}
            </View>

            {loadingFresh ? (
              <SuggestionSkeleton />
            ) : suggestions.isError && results.length === 0 ? (
              <Feedback
                title="Couldn't load results"
                message="Check your connection and try again."
                onRetry={() => suggestions.refetch()}
              />
            ) : results.length === 0 ? (
              <EmptyState
                compact
                icon="search-outline"
                tone="slate"
                title={`No results for “${query}”`}
                text="Check the spelling, try a more general word (like “sensor” instead of a part number), or browse by category."
                secondary={[
                  { label: 'Clear search', icon: 'close-circle-outline', onPress: () => setText('') },
                  { label: 'Categories', icon: 'apps-outline', onPress: () => router.push('/categories') },
                ]}
              />
            ) : (
              <>
                {results.map(product => (
                  <SuggestionRow
                    key={product.key}
                    product={product}
                    onPress={() => goToProduct(product)}
                  />
                ))}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => search(query)}
                  style={styles.viewAll}
                >
                  <AppText style={shop.link}>
                    View all results for “{query}”
                  </AppText>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={theme.colors.primary}
                  />
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <>
            {history.terms.length > 0 && (
              <View style={styles.section}>
                <View style={shop.between}>
                  <AppText style={styles.sectionTitle}>Recent searches</AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear all recent searches"
                    onPress={history.clear}
                    hitSlop={8}
                    style={styles.clear}
                  >
                    <AppText style={shop.link}>Clear all</AppText>
                  </Pressable>
                </View>
                <View style={styles.chips}>
                  {history.terms.map(term => (
                    <View key={term} style={styles.recentChip}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Search ${term}`}
                        onPress={() => search(term)}
                        style={styles.recentChipTap}
                      >
                        <Ionicons name="time-outline" size={15} color={theme.colors.secondary} />
                        <AppText style={styles.chipText} numberOfLines={1}>
                          {term}
                        </AppText>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${term} from recent searches`}
                        onPress={() => history.remove(term)}
                        hitSlop={6}
                        style={styles.chipRemove}
                      >
                        <Ionicons name="close" size={14} color={theme.colors.secondary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {categoryList.length > 0 && (
              <View style={styles.section}>
                <AppText style={styles.sectionTitle}>Try searching for</AppText>
                <View style={styles.chips}>
                  {categoryList.slice(0, 6).map(c => (
                    <Pressable
                      key={c.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Search ${c.name}`}
                      onPress={() => search(c.name)}
                      style={styles.suggestChip}
                    >
                      <Ionicons name="trending-up" size={15} color={theme.colors.primary} />
                      <AppText style={styles.suggestChipText} numberOfLines={1}>
                        {c.name}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <View style={shop.between}>
                <AppText style={styles.sectionTitle}>Popular categories</AppText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/categories')}
                  hitSlop={8}
                  style={styles.seeAll}
                >
                  <AppText style={shop.link}>See all</AppText>
                  <Ionicons name="chevron-forward" size={15} color={theme.colors.primary} />
                </Pressable>
              </View>
              <QueryState
                pending={categories.isPending}
                error={categories.error}
                paused={categories.fetchStatus === 'paused'}
                retry={() => {
                  categories.refetch().catch(() => undefined);
                }}
                skeleton={
                  <View style={styles.categoryRow}>
                    {[0, 1, 2].map(i => (
                      <SkeletonBlock key={i} style={styles.categorySkeleton} />
                    ))}
                  </View>
                }
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                {categoryList.map(c => (
                  <View key={c.id} style={styles.category}>
                    <CategoryTile category={c} />
                  </View>
                ))}
              </ScrollView>
            </View>

            {recentProducts.length > 0 && (
              <View style={styles.section}>
                <View style={shop.between}>
                  <AppText style={styles.sectionTitle}>Recently viewed</AppText>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/recently-viewed')}
                    hitSlop={8}
                    style={styles.seeAll}
                  >
                    <AppText style={shop.link}>See all</AppText>
                    <Ionicons name="chevron-forward" size={15} color={theme.colors.primary} />
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryRow}
                >
                  {recentProducts.map(product => (
                    <Pressable
                      key={product.key}
                      accessibilityRole="link"
                      accessibilityLabel={product.name}
                      onPress={() =>
                        router.push({
                          pathname: '/products/[slug]',
                          params: {
                            slug: product.slug,
                            ...(product.variationId ? { variation_id: product.variationId } : {}),
                          },
                        })
                      }
                      style={styles.recentCard}
                    >
                      <StoreImage uri={product.image} label={product.name} style={styles.recentImage} />
                      <AppText numberOfLines={2} style={styles.recentName}>
                        {product.name}
                      </AppText>
                      <AppText style={styles.suggestionPrice}>
                        {product.price === null ? '—' : money(product.price)}
                      </AppText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: 12 },
  sectionTitle: { fontFamily: theme.fonts.semibold, fontSize: 16, lineHeight: 22, color: theme.colors.text },
  clear: { minHeight: 32, justifyContent: 'center' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 32 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  recentChipTap: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingLeft: 12,
    paddingRight: 4,
  },
  chipText: { flexShrink: 1, fontSize: 13, color: theme.colors.text },
  chipRemove: { width: 30, height: 38, alignItems: 'center', justifyContent: 'center' },
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F9F7',
    borderWidth: 1,
    borderColor: '#D5EBE7',
    maxWidth: '100%',
  },
  suggestChipText: { flexShrink: 1, fontSize: 13, color: theme.colors.primary, fontFamily: theme.fonts.medium },
  categoryRow: { gap: 12 },
  category: { width: 120 },
  categorySkeleton: { width: 120, height: 140, borderRadius: 14 },
  recentCard: {
    width: 128,
    gap: 6,
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  recentImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryLight,
  },
  recentName: { fontSize: 12, lineHeight: 16, color: theme.colors.text, minHeight: 32 },
  suggestions: { gap: 4 },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
  },
  suggestionsHeaderLabel: {
    color: theme.colors.secondary,
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  suggestionsCount: { color: theme.colors.secondary, fontSize: 11 },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: 8,
  },
  suggestionImage: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryLight,
  },
  suggestionName: { fontFamily: theme.fonts.medium, fontSize: 14 },
  suggestionPriceCol: { alignItems: 'flex-end' },
  suggestionPrice: {
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
    color: theme.colors.primary,
  },
  suggestionStrike: {
    fontSize: 11,
    color: theme.colors.secondary,
    textDecorationLine: 'line-through',
  },
  skeletonLineWide: { height: 13, width: '80%', marginBottom: 6 },
  skeletonLineNarrow: { height: 11, width: '45%' },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
