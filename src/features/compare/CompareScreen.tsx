import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { AppText, Button, Feedback, Loading } from '../../components/ui';
import { AddToCartControl, BottomSheet, ShopHeader, StoreImage, money, shop } from '../../components/shop';
import { fetchProducts, Product } from '../../api/discovery';
import type { CompareProduct } from '../../api/compare';
import { theme } from '../../theme';
import { MAX_COMPARE_PRODUCTS, useCompareStore } from '../../stores/compare';
import { useCompareProducts } from './hooks';

const LABEL_WIDTH = 108;
const COLUMN_WIDTH = 160;

type Row = {
  key: string;
  label: string;
  group?: string;
  cell: (product: CompareProduct, selectedVariation?: string) => React.ReactNode;
};

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

  const rows = useMemo((): Row[] => {
    const fixed: Row[] = [
      { key: 'brand', label: 'Brand', cell: p => p.brand || '—' },
      { key: 'sku', label: 'SKU', cell: p => p.sku || '—' },
      { key: 'category', label: 'Category', cell: p => p.category || '—' },
      { key: 'weight', label: 'Weight', cell: p => (p.weight ? `${p.weight} kg` : '—') },
      { key: 'dimensions', label: 'Dimensions', cell: p => p.dimensions || '—' },
    ];
    const specKeys = new Map<string, string>();
    products.forEach(p => p.specifications.forEach(s => specKeys.set(s.key, s.label)));
    const dynamic: Row[] = [...specKeys.entries()].map(([key, label]) => ({
      key: `spec-${key}`,
      label,
      group: 'Key Specifications',
      cell: (p, variationId) => {
        const candidates = p.specifications.filter(s => s.key === key);
        const spec =
          candidates.find(s => variationId && s.variationId === variationId) ??
          candidates.find(s => !s.variationId) ??
          candidates[0];
        return spec?.value || '—';
      },
    }));
    const all = [...fixed, ...dynamic];
    if (!hideIdentical || products.length < 2) {
      return all;
    }
    return all.filter(row => {
      const values = products.map(p => row.cell(p, selectedVariations[p.id]));
      return new Set(values.map(v => String(v).trim().toLowerCase())).size > 1;
    });
  }, [products, hideIdentical, selectedVariations]);

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
        <View style={styles.empty}>
          <Feedback
            title="Nothing to compare yet"
            message="Add products to compare prices, features, and specifications side by side."
          />
          <Button label="Browse Products" onPress={() => router.push('/')} />
        </View>
      </View>
    );
  }

  return (
    <View style={shop.page}>
      <ShopHeader title="Compare Products" back />
      <View style={styles.toolbar}>
        <AppText style={shop.muted}>
          {products.length} of {MAX_COMPARE_PRODUCTS} products selected
        </AppText>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: hideIdentical }}
          onPress={() => setHideIdentical(v => !v)}
          style={styles.hideRow}
        >
          <Ionicons
            name={hideIdentical ? 'checkbox' : 'square-outline'}
            size={20}
            color={theme.colors.primary}
          />
          <AppText style={shop.muted}>Hide identical specs</AppText>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={styles.row}>
            <View style={[styles.labelCell, styles.headCell]} />
            {products.map(product => (
              <View key={`remove-${product.id}`} style={[styles.cell, styles.headCell]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${product.name} from comparison`}
                  onPress={() => removeEntry(product.id)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close" size={16} color={theme.colors.danger} />
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.row}>
            <View style={[styles.labelCell, styles.headLabel]}>
              <AppText style={styles.rowLabel}>Product</AppText>
            </View>
            {products.map(product => {
              const eff = effective(product, selectedVariations[product.id]);
              return (
                <Pressable
                  key={`title-${product.id}`}
                  accessibilityRole="link"
                  accessibilityLabel={`View ${product.name}`}
                  onPress={() => router.push({ pathname: '/products/[slug]', params: { slug: product.slug } })}
                  style={styles.cell}
                >
                  <StoreImage uri={eff.image} label={product.name} style={styles.productImage} />
                  <AppText numberOfLines={2} style={styles.productName}>{product.name}</AppText>
                  {product.totalReviews > 0 ? (
                    <AppText style={shop.muted}>
                      ★ {(product.rating ?? 0).toFixed(1)} ({product.totalReviews})
                    </AppText>
                  ) : (
                    <AppText style={shop.muted}>No reviews yet</AppText>
                  )}
                </Pressable>
              );
            })}
          </View>

          {products.some(p => p.variations.length > 0) && (
            <View style={styles.row}>
              <View style={styles.labelCell}>
                <AppText style={styles.rowLabel}>Options</AppText>
              </View>
              {products.map(product => (
                <View key={`option-${product.id}`} style={styles.cell}>
                  {product.variations.length ? (
                    <View style={styles.optionWrap}>
                      {product.variations.map(variation => {
                        const selected = selectedVariations[product.id] === variation.id;
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
                    </View>
                  ) : (
                    <AppText style={shop.muted}>—</AppText>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.row}>
            <View style={styles.labelCell}>
              <AppText style={styles.rowLabel}>Price</AppText>
            </View>
            {products.map(product => {
              const eff = effective(product, selectedVariations[product.id]);
              const hasDiscount = eff.regularPrice !== null && eff.price !== null && eff.regularPrice > eff.price;
              return (
                <View key={`price-${product.id}`} style={styles.cell}>
                  <AppText style={styles.price}>{eff.price === null ? '—' : money(eff.price)}</AppText>
                  {hasDiscount && <AppText style={styles.was}>{money(eff.regularPrice!)}</AppText>}
                </View>
              );
            })}
          </View>

          <View style={styles.row}>
            <View style={styles.labelCell}>
              <AppText style={styles.rowLabel}>Stock</AppText>
            </View>
            {products.map(product => {
              const eff = effective(product, selectedVariations[product.id]);
              return (
                <View key={`stock-${product.id}`} style={styles.cell}>
                  <AppText style={eff.inStock ? styles.inStock : styles.outOfStock}>
                    {eff.inStock ? `In stock${eff.stockQuantity ? ` (${eff.stockQuantity})` : ''}` : 'Out of stock'}
                  </AppText>
                </View>
              );
            })}
          </View>

          <View style={styles.row}>
            <View style={styles.labelCell}>
              <AppText style={styles.rowLabel}>Action</AppText>
            </View>
            {products.map(product => {
              const variationId = selectedVariations[product.id];
              const eff = effective(product, variationId);
              const needsVariation = product.variations.length > 0 && !variationId;
              return (
                <View key={`action-${product.id}`} style={styles.cell}>
                  {needsVariation ? (
                    <AppText style={shop.muted}>Select an option</AppText>
                  ) : (
                    <AddToCartControl
                      product={{ id: product.id, variationId, name: product.name, inStock: eff.inStock }}
                      variant="full"
                    />
                  )}
                </View>
              );
            })}
          </View>

          {rows.map((row, index) => (
            <React.Fragment key={row.key}>
              {row.group && (index === 0 || rows[index - 1]?.group !== row.group) && (
                <View style={styles.groupRow}>
                  <AppText style={styles.groupLabel}>{row.group}</AppText>
                </View>
              )}
              <View style={styles.row}>
                <View style={styles.labelCell}>
                  <AppText style={styles.rowLabel}>{row.label}</AppText>
                </View>
                {products.map(product => (
                  <View key={`${row.key}-${product.id}`} style={styles.cell}>
                    <AppText style={styles.cellValue}>{row.cell(product, selectedVariations[product.id])}</AppText>
                  </View>
                ))}
              </View>
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {!!pickError && <AppText style={styles.outOfStock}>{pickError}</AppText>}
        <Button
          label="Add Product to Compare"
          disabled={products.length >= MAX_COMPARE_PRODUCTS}
          onPress={() => setPickerOpen(true)}
        />
      </View>

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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  hideRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  empty: { padding: 20, gap: 16 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  labelCell: {
    width: LABEL_WIDTH,
    padding: 10,
    justifyContent: 'center',
    backgroundColor: '#FAFBFB',
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  headCell: { width: COLUMN_WIDTH, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  headLabel: { justifyContent: 'flex-end' },
  cell: {
    width: COLUMN_WIDTH,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    gap: 4,
  },
  rowLabel: { fontFamily: theme.fonts.medium, fontSize: 12 },
  cellValue: { fontSize: 13, textAlign: 'center' },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDECEC',
  },
  productImage: { width: 88, height: 88, borderRadius: 8, backgroundColor: '#F0F1F3' },
  productName: { fontFamily: theme.fonts.medium, fontSize: 13, textAlign: 'center' },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  optionChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  optionChipSelected: { borderColor: theme.colors.primary },
  optionChipText: { fontSize: 11 },
  price: { fontFamily: theme.fonts.semibold, fontSize: 15 },
  was: { fontSize: 11, color: theme.colors.secondary, textDecorationLine: 'line-through' },
  inStock: { color: '#1B8A5A', fontFamily: theme.fonts.medium, fontSize: 12 },
  outOfStock: { color: theme.colors.danger, fontFamily: theme.fonts.medium, fontSize: 12 },
  groupRow: { backgroundColor: '#F2F8F7', paddingHorizontal: 16, paddingVertical: 6 },
  groupLabel: {
    fontFamily: theme.fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.primary,
  },
  footer: { padding: 16, gap: 8, borderTopWidth: 1, borderTopColor: theme.colors.border },
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
