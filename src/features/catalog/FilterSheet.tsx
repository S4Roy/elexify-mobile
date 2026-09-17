import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText, Button } from '../../components/ui';
import { BottomSheet, Chip, shop } from '../../components/shop';
import { emptyFilters, Filters, priceError } from './filters';
import { useCategories } from './hooks';
import { QueryState } from './QueryState';
import { theme } from '../../theme';

type TabId = 'category' | 'price' | 'highlights';

const tabs: { id: TabId; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'category', label: 'Category', icon: 'grid-outline' },
  { id: 'price', label: 'Price', icon: 'pricetag-outline' },
  { id: 'highlights', label: 'Highlights', icon: 'flash-outline' },
];

const pricePresets: { label: string; min: string; max: string }[] = [
  { label: 'Under ₹500', min: '', max: '500' },
  { label: '₹500 – ₹1,000', min: '500', max: '1000' },
  { label: '₹1,000 – ₹2,000', min: '1000', max: '2000' },
  { label: 'Above ₹2,000', min: '2000', max: '' },
];

export default function FilterSheet({
  initial,
  onApply,
  onClose,
}: {
  initial: Filters;
  onApply: (f: Filters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Filters>({
    ...initial,
    categories: [...initial.categories],
  });
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('category');
  const { height: windowHeight } = useWindowDimensions();
  const bodyHeight = Math.min(Math.max(windowHeight * 0.45, 320), 440);
  const categories = useCategories({});
  const categoryActive = draft.categories.length > 0;
  const priceActive = !!(draft.min || draft.max);
  const highlightsActive = draft.bestseller;
  return (
    <BottomSheet
      title="Filter products"
      onClose={onClose}
      // eslint-disable-next-line react/no-unstable-nested-components -- render prop invoked inline, never mounted as a JSX component type
      footer={close => (
        <>
          <View style={styles.flex}>
            <Button
              label="Clear all"
              onPress={() => {
                setDraft(emptyFilters());
                setError(null);
              }}
            />
          </View>
          <View style={styles.flex}>
            <Button
              label="Apply filters"
              onPress={() => {
                const message = priceError(draft);
                setError(message);
                if (message) {
                  setTab('price');
                  return;
                }
                onApply(draft);
                close();
              }}
            />
          </View>
        </>
      )}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.body, { height: bodyHeight }]}>
          <View style={styles.rail}>
            {tabs.map(t => {
              const active = tab === t.id;
              const flagged =
                (t.id === 'category' && categoryActive) ||
                (t.id === 'price' && priceActive) ||
                (t.id === 'highlights' && highlightsActive);
              return (
                <Pressable
                  key={t.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setTab(t.id)}
                  style={[styles.railItem, active && styles.railItemActive]}
                >
                  <Ionicons
                    name={t.icon}
                    size={19}
                    color={active ? theme.colors.primary : theme.colors.secondary}
                  />
                  <AppText
                    numberOfLines={1}
                    style={[styles.railLabel, active && styles.railLabelActive]}
                  >
                    {t.label}
                  </AppText>
                  {flagged && <View style={styles.railDot} />}
                </Pressable>
              );
            })}
          </View>
          <ScrollView
            style={styles.panel}
            contentContainerStyle={styles.panelContent}
            keyboardShouldPersistTaps="handled"
          >
            {tab === 'category' && (
              <>
                <QueryState
                  pending={categories.isPending}
                  error={categories.error}
                  paused={categories.fetchStatus === 'paused'}
                  retry={() => {
                    categories.refetch().catch(() => undefined);
                  }}
                />
                <View style={styles.wrap}>
                  {categories.data?.pages
                    .flatMap(p => p.items)
                    .map(c => (
                      <Chip
                        key={c.id}
                        label={c.name}
                        selected={draft.categories.includes(c.slug)}
                        onPress={() =>
                          setDraft(d => ({
                            ...d,
                            categories: d.categories.includes(c.slug)
                              ? d.categories.filter(v => v !== c.slug)
                              : [...d.categories, c.slug],
                          }))
                        }
                      />
                    ))}
                </View>
                {categories.hasNextPage && (
                  <Button
                    label="More categories"
                    disabled={categories.isFetchingNextPage}
                    onPress={() => {
                      categories.fetchNextPage().catch(() => undefined);
                    }}
                  />
                )}
              </>
            )}
            {tab === 'price' && (
              <>
                <AppText style={shop.muted}>Quick ranges</AppText>
                <View style={styles.wrap}>
                  {pricePresets.map(preset => (
                    <Chip
                      key={preset.label}
                      label={preset.label}
                      selected={draft.min === preset.min && draft.max === preset.max}
                      onPress={() => {
                        setDraft(d =>
                          d.min === preset.min && d.max === preset.max
                            ? { ...d, min: '', max: '' }
                            : { ...d, min: preset.min, max: preset.max },
                        );
                        setError(null);
                      }}
                    />
                  ))}
                </View>
                <AppText style={shop.muted}>Custom range</AppText>
                <View style={shop.row}>
                  <View style={styles.flex}>
                    <AppText style={shop.muted}>Minimum (₹)</AppText>
                    <TextInput
                      accessibilityLabel="Minimum price"
                      keyboardType="decimal-pad"
                      value={draft.min}
                      onChangeText={min => {
                        setDraft(d => ({ ...d, min }));
                        setError(null);
                      }}
                      placeholder="0"
                      style={styles.price}
                    />
                  </View>
                  <View style={styles.flex}>
                    <AppText style={shop.muted}>Maximum (₹)</AppText>
                    <TextInput
                      accessibilityLabel="Maximum price"
                      keyboardType="decimal-pad"
                      value={draft.max}
                      onChangeText={max => {
                        setDraft(d => ({ ...d, max }));
                        setError(null);
                      }}
                      placeholder="Any"
                      style={styles.price}
                    />
                  </View>
                </View>
                {error && (
                  <AppText accessibilityRole="alert" style={styles.error}>
                    {error}
                  </AppText>
                )}
              </>
            )}
            {tab === 'highlights' && (
              <View style={styles.wrap}>
                <Chip
                  icon="flash-outline"
                  label="Best selling"
                  selected={draft.bestseller}
                  onPress={() =>
                    setDraft(d => ({ ...d, bestseller: !d.bestseller }))
                  }
                />
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { flexDirection: 'row' },
  rail: {
    width: 104,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    backgroundColor: '#FAFAFA',
    paddingVertical: 4,
  },
  railItem: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  railItemActive: {
    borderLeftColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  railLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  railLabelActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
  },
  railDot: {
    position: 'absolute',
    top: 10,
    right: 14,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: theme.colors.primary,
  },
  panel: { flex: 1 },
  panelContent: { padding: 16, gap: 14 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  price: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
  },
  error: { color: theme.colors.danger },
});
