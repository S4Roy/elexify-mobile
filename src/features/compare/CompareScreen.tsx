import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { AppText, Feedback, Loading } from '../../components/ui';
import { AddToCartControl, BottomSheet, ShopHeader, StoreImage, money, shop } from '../../components/shop';
import { fetchProducts, Product } from '../../api/discovery';
import type { CompareProduct } from '../../api/compare';
import { theme } from '../../theme';
import { MAX_COMPARE_PRODUCTS, useCompareStore } from '../../stores/compare';
import { useCompareProducts } from './hooks';
import { EmptyState } from '../../components/EmptyState';

// Layout: product cards pinned at the top, spec sections scrolling beneath,
// every row labelled full-width above its values (the Flipkart/Amazon mobile
// pattern — no label column eating half the screen). Two columns fill the
// width; with more, the next column peeks in to show it scrolls sideways.
const GUTTER = 12;
const GAP = 8;

type Section = 'Overview' | 'Details' | 'Key specifications';
const SECTIONS: Section[] = ['Overview', 'Details', 'Key specifications'];

type Row = {
  key: string;
  label: string;
  section: Section;
  cell: (product: CompareProduct, selectedVariation?: string) => string;
};

const norm = (v: string) => v.trim().toLowerCase();

function effective(product: CompareProduct, variationId?: string) {
  const variation = product.variations.find(v => v.id === variationId);
  if (!variation) {
    return {
      price: product.price,
      regularPrice: product.regularPrice,
      stockQuantity: product.stockQuantity,
      inStock: product.inStock,
      image: product.image,
    };
  }
  return {
    price: variation.price,
    regularPrice: variation.regularPrice,
    stockQuantity: variation.stockQuantity,
    inStock: (variation.stockQuantity ?? 0) > 0,
    image: variation.image || product.image,
  };
}

function ProductPicker({
  excludeIds,
  categorySlug,
  onPick,
  onClose,
}: {
  excludeIds: string[];
  categorySlug?: string;
  onPick: (product: Product) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearching(true);
      fetchProducts({ search_key: query, ...(categorySlug ? { category: categorySlug } : {}), limit: 12 })
        .then(page => setResults(page.items.filter(p => !excludeIds.includes(p.id))))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <BottomSheet title="Add a product" onClose={onClose}>
      <View style={styles.pickerSearch}>
        <Ionicons name="search-outline" size={18} color={theme.colors.secondary} />
        <TextInput
          accessibilityLabel="Search products to compare"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by product name"
          placeholderTextColor={theme.colors.secondary}
          autoFocus
          style={styles.pickerInput}
        />
      </View>
      {!!categorySlug && (
        <AppText style={shop.muted}>Only products from the same category are shown.</AppText>
      )}
      <ScrollView style={styles.pickerResults}>
        {searching && <Loading />}
        {!searching &&
          results.map(product => (
            <Pressable
              key={product.key}
              accessibilityRole="button"
              accessibilityLabel={`Add ${product.name} to comparison`}
              onPress={() => onPick(product)}
              style={styles.pickerRow}
            >
              <StoreImage uri={product.image} label={product.name} style={styles.pickerImage} />
              <View style={shop.flex}>
                <AppText numberOfLines={2}>{product.name}</AppText>
                {product.price !== null && <AppText style={shop.link}>{money(product.price)}</AppText>}
              </View>
              <Ionicons name="add-circle" size={22} color={theme.colors.primary} />
            </Pressable>
          ))}
        {!searching && results.length === 0 && (
          <AppText style={[shop.muted, styles.pickerEmpty]}>No products found.</AppText>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

export default function CompareScreen() {
  const entries = useCompareStore(s => s.items);
  const removeEntry = useCompareStore(s => s.remove);
  const addEntry = useCompareStore(s => s.add);
  const replaceEntries = useCompareStore(s => s.replace);
  const ids = useMemo(() => entries.map(e => e.productId), [entries]);
  const compare = useCompareProducts(ids);
  const products = useMemo(
    () => ids.map(id => compare.data?.find(p => p.id === id)).filter((p): p is CompareProduct => !!p),
    [compare.data, ids],
  );
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [hideIdentical, setHideIdentical] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickError, setPickError] = useState('');
  const [areaHeight, setAreaHeight] = useState(0);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (!compare.data || compare.isPending) {
      return;
    }
    const resolvedIds = new Set(compare.data.map(p => p.id));
    if (resolvedIds.size !== ids.length) {
      replaceEntries(entries.filter(e => resolvedIds.has(e.productId)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compare.data]);

  const allRows = useMemo((): Row[] => {
    const overview: Row[] = [
      {
        key: 'rating',
        label: 'Customer rating',
        section: 'Overview',
        cell: p => (p.totalReviews > 0 ? `★ ${(p.rating ?? 0).toFixed(1)} (${p.totalReviews})` : 'No reviews yet'),
      },
      {
        key: 'discount',
        label: 'Discount',
        section: 'Overview',
        cell: (p, v) => {
          const eff = effective(p, v);
          return eff.regularPrice && eff.price !== null && eff.regularPrice > eff.price
            ? `${Math.round(((eff.regularPrice - eff.price) / eff.regularPrice) * 100)}% off`
            : '—';
        },
      },
      {
        key: 'stock',
        label: 'Availability',
        section: 'Overview',
        cell: (p, v) => {
          const eff = effective(p, v);
          return eff.inStock ? `In stock${eff.stockQuantity ? ` (${eff.stockQuantity})` : ''}` : 'Out of stock';
        },
      },
    ];
    const details: Row[] = [
      { key: 'brand', label: 'Brand', section: 'Details', cell: p => p.brand || '—' },
      { key: 'category', label: 'Category', section: 'Details', cell: p => p.category || '—' },
      { key: 'sku', label: 'SKU', section: 'Details', cell: p => p.sku || '—' },
      { key: 'weight', label: 'Weight', section: 'Details', cell: p => (p.weight ? `${p.weight} kg` : '—') },
      { key: 'dimensions', label: 'Dimensions', section: 'Details', cell: p => p.dimensions || '—' },
    ];
    const specKeys = new Map<string, string>();
    products.forEach(p => p.specifications.forEach(sp => specKeys.set(sp.key, sp.label)));
    const specs: Row[] = [...specKeys.entries()].map(([key, label]) => ({
      key: `spec-${key}`,
      label,
      section: 'Key specifications',
      cell: (p, variationId) => {
        const candidates = p.specifications.filter(sp => sp.key === key);
        const spec =
          candidates.find(sp => variationId && sp.variationId === variationId) ??
          candidates.find(sp => !sp.variationId) ??
          candidates[0];
        return spec?.value || '—';
      },
    }));
    return [...overview, ...details, ...specs];
  }, [products]);

  const differs = (row: Row) =>
    products.length > 1 &&
    new Set(products.map(p => norm(row.cell(p, selectedVariations[p.id])))).size > 1;
  const rows = hideIdentical ? allRows.filter(differs) : allRows;

  if (compare.isPending && ids.length > 0) {
    return (
      <View style={shop.page}>
        <ShopHeader title="Compare Products" back />
        <Loading />
      </View>
    );
  }

  if (compare.isError) {
    return (
      <View style={shop.page}>
        <ShopHeader title="Compare Products" back />
        <Feedback
          title="Comparison unavailable"
          message={compare.error.message}
          onRetry={() => compare.refetch().catch(() => undefined)}
        />
      </View>
    );
  }

  if (ids.length === 0 || products.length === 0) {
    return (
      <View style={shop.page}>
        <ShopHeader title="Compare Products" back />
        <ScrollView contentContainerStyle={styles.emptyBody}>
          <EmptyState
            icon="git-compare-outline"
            title="Nothing to compare yet"
            text="Pick two or more products to see prices, stock and specifications side by side."
            steps={[
              { icon: 'search-outline', title: 'Find a product', text: 'Browse a category or search for the part you need.' },
              { icon: 'git-compare-outline', title: 'Tap Compare', text: 'On the product page, add it to your comparison.' },
              { icon: 'layers-outline', title: `Add up to ${MAX_COMPARE_PRODUCTS}`, text: 'Products from the same category compare best.' },
            ]}
            primary={{ label: 'Browse products', icon: 'storefront-outline', onPress: () => router.push('/products') }}
            secondary={[
              { label: 'Categories', icon: 'apps-outline', onPress: () => router.push('/categories') },
              { label: 'Recently viewed', icon: 'time-outline', onPress: () => router.push('/recently-viewed') },
            ]}
          />
        </ScrollView>
      </View>
    );
  }

  const canAdd = products.length < MAX_COMPARE_PRODUCTS;
  const columns = products.length + (canAdd ? 1 : 0);
  const usable = width - GUTTER * 2 - GAP;
  const colWidth = Math.floor(columns <= 2 ? usable / 2 : usable / 2.3);
  const contentWidth = columns * colWidth + (columns - 1) * GAP + GUTTER * 2;
  const colStyle = { width: colWidth };

  return (
    <View style={shop.page}>
      <ShopHeader title="Compare" back />
      <View style={styles.toolbar}>
        <View style={shop.flex}>
          <AppText style={styles.toolbarTitle}>
            Comparing {products.length} product{products.length === 1 ? '' : 's'}
          </AppText>
          {products.length < 2 && (
            <AppText style={styles.toolbarHint}>Add one more to see differences.</AppText>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove all products from comparison"
          onPress={() => replaceEntries([])}
          hitSlop={8}
        >
          <AppText style={styles.clearAll}>Clear all</AppText>
        </Pressable>
      </View>
      {products.length > 1 && (
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: hideIdentical }}
          onPress={() => setHideIdentical(v => !v)}
          style={styles.diffRow}
        >
          <Ionicons name="git-compare-outline" size={16} color={theme.colors.primary} />
          <AppText style={styles.diffText}>Show only differences</AppText>
          <Switch
            value={hideIdentical}
            onValueChange={setHideIdentical}
            trackColor={{ true: '#99D5CB', false: '#D1D5DB' }}
            thumbColor={hideIdentical ? theme.colors.primary : '#FFFFFF'}
          />
        </Pressable>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={contentWidth > width + 1}
        style={shop.flex}
        contentContainerStyle={styles.hContent}
        onLayout={e => setAreaHeight(e.nativeEvent.layout.height)}
      >
        <View style={{ width: contentWidth, height: areaHeight || undefined }}>
          {/* Pinned product cards */}
          <View style={styles.cardsRow}>
            {products.map(product => {
              const variationId = selectedVariations[product.id];
              const eff = effective(product, variationId);
              const hasDiscount =
                eff.regularPrice !== null && eff.price !== null && eff.regularPrice > eff.price;
              const needsVariation = product.variations.length > 0 && !variationId;
              return (
                <View key={product.id} style={[styles.card, colStyle]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${product.name} from comparison`}
                    onPress={() => removeEntry(product.id)}
                    hitSlop={8}
                    style={styles.remove}
                  >
                    <Ionicons name="close" size={15} color={theme.colors.secondary} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`View ${product.name}`}
                    onPress={() => router.push({ pathname: '/products/[slug]', params: { slug: product.slug } })}
                    style={styles.cardLink}
                  >
                    <StoreImage uri={eff.image} label={product.name} style={styles.cardImage} />
                    <AppText numberOfLines={2} style={styles.cardName}>
                      {product.name}
                    </AppText>
                  </Pressable>
                  <View style={styles.priceLine}>
                    <AppText style={styles.price}>{eff.price === null ? '—' : money(eff.price)}</AppText>
                    {hasDiscount && <AppText style={styles.was}>{money(eff.regularPrice!)}</AppText>}
                  </View>
                  {product.variations.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
                      {product.variations.map(variation => {
                        const selected = variationId === variation.id;
                        return (
                          <Pressable
                            key={variation.id}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            onPress={() =>
                              setSelectedVariations(current => ({
                                ...current,
                                [product.id]: selected ? '' : variation.id,
                              }))
                            }
                            style={[styles.optionChip, selected && styles.optionChipSelected]}
                          >
                            <AppText style={[styles.optionChipText, selected && shop.link]} numberOfLines={1}>
                              {variation.label}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}
                  <View style={styles.cardAction}>
                    {!eff.inStock ? (
                      <View style={styles.oosPill}>
                        <AppText style={styles.oosText}>Out of stock</AppText>
                      </View>
                    ) : needsVariation ? (
                      <View style={styles.oosPill}>
                        <AppText style={styles.pickText}>Select an option</AppText>
                      </View>
                    ) : (
                      <AddToCartControl
                        product={{ id: product.id, variationId, name: product.name, inStock: eff.inStock }}
                      />
                    )}
                  </View>
                </View>
              );
            })}
            {canAdd && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a product to compare"
                onPress={() => setPickerOpen(true)}
                style={({ pressed }) => [styles.card, styles.addCard, colStyle, pressed && styles.pressed]}
              >
                <View style={styles.addIcon}>
                  <Ionicons name="add" size={26} color={theme.colors.primary} />
                </View>
                <AppText style={styles.addTitle}>Add product</AppText>
                <AppText style={styles.addText}>
                  {MAX_COMPARE_PRODUCTS - products.length} more can be added
                </AppText>
              </Pressable>
            )}
          </View>
          {!!pickError && <AppText style={styles.pickError}>{pickError}</AppText>}

          {/* Specs */}
          <ScrollView style={shop.flex} contentContainerStyle={styles.specs} showsVerticalScrollIndicator={false}>
            {rows.length === 0 && (
              <View style={styles.sameNote}>
                <Ionicons name="checkmark-done-outline" size={18} color={theme.colors.primary} />
                <AppText style={styles.sameText}>These products have identical specifications.</AppText>
              </View>
            )}
            {SECTIONS.map(section => {
              const sectionRows = rows.filter(r => r.section === section);
              if (!sectionRows.length) {
                return null;
              }
              return (
                <View key={section} style={styles.section}>
                  <AppText style={styles.sectionTitle}>{section}</AppText>
                  {sectionRows.map(row => {
                    const highlight = !hideIdentical && differs(row);
                    return (
                      <View key={row.key} style={[styles.specRow, highlight && styles.specRowDiff]}>
                        <AppText style={styles.specLabel}>{row.label}</AppText>
                        <View style={styles.specValues}>
                          {products.map(product => {
                            const value = row.cell(product, selectedVariations[product.id]);
                            const isStock = row.key === 'stock';
                            return (
                              <AppText
                                key={product.id}
                                style={[
                                  styles.specValue,
                                  colStyle,
                                  value === '—' && styles.specEmpty,
                                  isStock && (value.startsWith('In stock') ? styles.inStock : styles.outOfStock),
                                ]}
                              >
                                {value}
                              </AppText>
                            );
                          })}
                          {canAdd && <View style={colStyle} />}
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      {pickerOpen && (
        <ProductPicker
          excludeIds={ids}
          categorySlug={products[0]?.categorySlug}
          onClose={() => setPickerOpen(false)}
          onPick={product => {
            const result = addEntry({ productId: product.id, categoryId: undefined });
            if (!result.ok) {
              setPickError(result.message ?? 'Unable to add product.');
              return;
            }
            setPickError('');
            setPickerOpen(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  emptyBody: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: GUTTER + 4,
    paddingTop: 12,
    paddingBottom: 8,
  },
  toolbarTitle: { fontFamily: theme.fonts.semibold, fontSize: 15, color: theme.colors.text },
  toolbarHint: { fontSize: 12, color: theme.colors.secondary, marginTop: 1 },
  clearAll: { color: theme.colors.danger, fontFamily: theme.fonts.semibold, fontSize: 13 },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: GUTTER,
    marginBottom: 8,
    paddingLeft: 12,
    paddingRight: 6,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#F1F9F7',
  },
  diffText: { flex: 1, fontSize: 13, fontFamily: theme.fonts.medium, color: theme.colors.text },
  hContent: { paddingHorizontal: GUTTER },
  cardsRow: {
    flexDirection: 'row',
    gap: GAP,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  card: {
    padding: 10,
    paddingTop: 12,
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  remove: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 1,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  cardLink: { gap: 6 },
  cardImage: {
    width: 76,
    height: 76,
    alignSelf: 'center',
    borderRadius: 10,
    backgroundColor: '#F5F6F8',
  },
  cardName: { fontFamily: theme.fonts.medium, fontSize: 13, lineHeight: 18, minHeight: 36, color: theme.colors.text },
  priceLine: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 6 },
  price: { fontFamily: theme.fonts.semibold, fontSize: 16, color: theme.colors.text },
  was: { fontSize: 12, color: theme.colors.secondary, textDecorationLine: 'line-through' },
  optionRow: { gap: 6 },
  optionChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  optionChipSelected: { borderColor: theme.colors.primary, backgroundColor: '#F1F9F7' },
  optionChipText: { fontSize: 11 },
  cardAction: { marginTop: 'auto', paddingTop: 2 },
  oosPill: {
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F6F8',
  },
  oosText: { fontSize: 12, fontFamily: theme.fonts.medium, color: theme.colors.danger },
  pickText: { fontSize: 12, fontFamily: theme.fonts.medium, color: theme.colors.secondary },
  addCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#99D5CB',
    backgroundColor: '#F7FBFA',
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5EBE7',
  },
  addTitle: { fontFamily: theme.fonts.semibold, fontSize: 14, color: theme.colors.primary },
  addText: { fontSize: 11, color: theme.colors.secondary, textAlign: 'center' },
  pickError: { color: theme.colors.danger, fontSize: 12, paddingVertical: 6 },
  specs: { paddingBottom: 32 },
  section: { paddingTop: 16 },
  sectionTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.primary,
    paddingBottom: 6,
  },
  specRow: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  specRowDiff: { backgroundColor: '#FFFBEB', borderRadius: 8 },
  specLabel: { fontSize: 12, color: theme.colors.secondary, fontFamily: theme.fonts.medium },
  specValues: { flexDirection: 'row', gap: GAP },
  specValue: { fontSize: 14, lineHeight: 20, color: theme.colors.text },
  specEmpty: { color: '#9CA3AF' },
  inStock: { color: '#15803D', fontFamily: theme.fonts.medium },
  outOfStock: { color: theme.colors.danger, fontFamily: theme.fonts.medium },
  sameNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F1F9F7',
  },
  sameText: { flex: 1, fontSize: 13, color: theme.colors.text },
  pickerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  pickerInput: { flex: 1, paddingVertical: 10, fontFamily: theme.fonts.regular, fontSize: 14 },
  pickerResults: { maxHeight: 360 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pickerImage: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#F0F1F3' },
  pickerEmpty: { textAlign: 'center', paddingVertical: 24 },
});
