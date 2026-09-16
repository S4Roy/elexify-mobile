import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { AppText, Button, Feedback } from '../../components/ui';
import {
  CategoryTile,
  SearchField,
  ShopHeader,
  shop,
} from '../../components/shop';
import { useSearchHistory } from '../../stores/search';
import { useCategories } from '../catalog/hooks';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
export default function SearchScreen() {
  const [text, setText] = useState('');
  const history = useSearchHistory();
  const categories = useCategories({ featured: 'true', limit: 8 });
  const search = (value: string) => {
    const term = value.trim();
    if (!term) {
      return;
    }
    history.add(term);
    router.push({ pathname: '/products', params: { search_key: term } });
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
        {!!text.trim() && (
          <Button
            label={`Search for “${text.trim()}”`}
            onPress={() => search(text)}
          />
        )}
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
          <AppText style={shop.muted}>Your searches will appear here.</AppText>
        ) : (
          history.terms.map(term => (
            <Pressable
              key={term}
              accessibilityRole="button"
              onPress={() => {
                setText(term);
                search(term);
              }}
              style={styles.recent}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={theme.colors.secondary}
              />
              <AppText style={styles.term}>{term}</AppText>
              <Ionicons
                name="arrow-up-outline"
                size={16}
                color={theme.colors.secondary}
              />
            </Pressable>
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
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  recent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    minHeight: 48,
  },
  term: { flex: 1 },
  clear: { minHeight: 44, justifyContent: 'center' },
  categories: { gap: 12 },
  category: { width: 130 },
});
