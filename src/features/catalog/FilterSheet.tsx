import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button } from '../../components/ui';
import { Chip, IconButton, shop } from '../../components/shop';
import { emptyFilters, Filters, priceError } from './filters';
import { useCategories } from './hooks';
import { QueryState } from './QueryState';
import { theme } from '../../theme';
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
  const categories = useCategories({});
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={shop.page}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[shop.between, shop.padded]}>
            <AppText accessibilityRole="header" style={shop.heading}>
              Filter products
            </AppText>
            <IconButton name="close" label="Close filters" onPress={onClose} />
          </View>
          <ScrollView
            contentContainerStyle={shop.padded}
            keyboardShouldPersistTaps="handled"
          >
            <AppText style={shop.heading}>Category</AppText>
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
            <AppText style={shop.heading}>Highlight</AppText>
            <View style={styles.wrap}>
              <Chip
                label="Best selling"
                selected={draft.bestseller}
                onPress={() =>
                  setDraft(d => ({ ...d, bestseller: !d.bestseller }))
                }
              />
            </View>
            <AppText style={shop.heading}>Price range</AppText>
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
          </ScrollView>
          <View style={[shop.row, shop.padded]}>
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
                  if (!message) {
                    onApply(draft);
                  }
                }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
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
