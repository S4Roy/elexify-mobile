import React from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { EmptyState, type EmptyStateAction } from '../../components/EmptyState';
import { AppText } from '../../components/ui';
import { ProductCard } from '../../components/shop';
import { theme } from '../../theme';
import { emptyFilters, productParams } from './filters';
import { useCategories, useProducts } from './hooks';

const RAIL_GAP = 10;
const bestsellerParams = { ...productParams('', { ...emptyFilters(), bestseller: true }, 'newest'), limit: 8 };

// Shown when a product list comes back empty: explains why, offers the most
// useful next step, and gives the shopper somewhere to go instead of a dead end.
export function NoResults({
  search,
  filtersActive,
  onClearFilters,
}: {
  search: string;
  filtersActive: boolean;
  onClearFilters: () => void;
}) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.round(Math.min(200, Math.max(138, (width - 16 - RAIL_GAP * 2) / 2.3)));
  const featured = useCategories({ featured: 'true', limit: 8 });
  // Nothing marked featured yet → fall back to the first categories (as the search screen does).
  const noFeatured = featured.isSuccess && featured.data.pages[0].items.length === 0;
  const allCategories = useCategories({ limit: 8 }, noFeatured);
  const categoryList = (noFeatured ? allCategories : featured).data?.pages.flatMap(p => p.items) ?? [];
  const bestsellers = useProducts(bestsellerParams);
  const bestsellerList = bestsellers.data?.pages[0]?.items ?? [];

  const searchAgain: EmptyStateAction = { label: 'Search again', icon: 'search', onPress: () => router.push('/search') };
  const browse: EmptyStateAction = { label: 'All categories', icon: 'apps-outline', onPress: () => router.push('/categories') };
  const title = search ? `No results for “${search}”` : 'No matching products';
  const text = filtersActive
    ? 'Nothing matches the filters you picked. Clear them to see every result.'
    : search
      ? 'Check the spelling, use fewer or more general words (like “amplifier” instead of a model number), or browse a category below.'
      : 'Nothing here right now. Browse a category or check out our best sellers.';

  return (
    <View style={styles.wrap}>
      <EmptyState
        compact
        icon={filtersActive ? 'options-outline' : 'search-outline'}
        tone="slate"
        title={title}
        text={text}
        primary={filtersActive ? { label: 'Clear filters', icon: 'close-circle-outline', onPress: onClearFilters } : search ? searchAgain : browse}
        secondary={filtersActive ? [searchAgain, browse] : search ? [browse] : []}
      />

      {categoryList.length > 0 && (
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Browse popular categories</AppText>
          <View style={styles.chips}>
            {categoryList.slice(0, 6).map(category => (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityLabel={`Browse ${category.name}`}
                onPress={() => router.push({ pathname: '/products', params: { category: category.slug, title: category.name } })}
                style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
              >
                <Ionicons name="grid-outline" size={14} color={theme.colors.primary} />
                <AppText style={styles.chipText} numberOfLines={1}>{category.name}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {bestsellerList.length > 0 && (
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Best sellers you might like</AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={cardWidth + RAIL_GAP}
            snapToAlignment="start"
            contentContainerStyle={styles.rail}
          >
            {bestsellerList.map(product => (
              <View key={product.key} style={{ width: cardWidth }}>
                <ProductCard product={product} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 24, paddingTop: 4 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: theme.fonts.semibold, color: theme.colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
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
  chipText: { flexShrink: 1, fontSize: 13, color: theme.colors.primary, fontFamily: theme.fonts.medium },
  pressed: { opacity: 0.7 },
  rail: { gap: RAIL_GAP, paddingRight: 16 },
});
