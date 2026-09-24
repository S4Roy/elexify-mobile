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
import { AppText, Button, Feedback } from '../../components/ui';
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
  const categories = useCategories({ featured: 'true', limit: 8 });
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
              <AppText style={shop.muted}>No results for “{query}”.</AppText>
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
            <View style={shop.between}>
              <AppText style={shop.heading}>Recent searches</AppText>
              {history.terms.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear all recent searches"
                  onPress={history.clear}
                  style={styles.clear}
                >
                  <AppText style={shop.link}>Clear all</AppText>
                </Pressable>
              )}
            </View>
            {history.terms.length === 0 ? (
              <AppText style={shop.muted}>
                Your searches will appear here.
              </AppText>
            ) : (
              history.terms.map(term => (
                <View key={term} style={styles.recent}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setText(term)}
                    style={styles.recentTap}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={theme.colors.secondary}
                    />
                    <AppText style={styles.term}>{term}</AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${term} from recent searches`}
                    onPress={() => history.remove(term)}
                    style={styles.removeRecent}
                  >
                    <Ionicons
                      name="close"
                      size={16}
                      color={theme.colors.secondary}
                    />
                  </Pressable>
                </View>
              ))
            )}
            <AppText style={shop.heading}>Popular categories</AppText>
            <QueryState
              pending={categories.isPending}
              error={categories.error}
              paused={categories.fetchStatus === 'paused'}
              retry={() => {
                categories.refetch().catch(() => undefined);
              }}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categories}
            >
              {categories.data?.pages
                .flatMap(p => p.items)
                .map(c => (
                  <View key={c.id} style={styles.category}>
                    <CategoryTile category={c} />
                  </View>
                ))}
            </ScrollView>
            {categories.data?.pages[0].items.length === 0 && (
              <Feedback
                title="Explore our collections"
                message="Browse all categories to find your next project."
              />
            )}
            <Button
              label="Browse all categories"
              onPress={() => router.push('/categories')}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  recent: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  recentTap: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center' },
  removeRecent: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  term: { flex: 1 },
  clear: { minHeight: 44, justifyContent: 'center' },
  categories: { gap: 12 },
  category: { width: 130 },
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
