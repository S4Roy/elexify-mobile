import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { AppText, Button, Feedback } from '../../components/ui';
import { ShopHeader, shop } from '../../components/shop';
import { fetchHome } from '../../api/discovery';
import { apiConfig } from '../../api/config';
import { useIdentity } from '../catalog/hooks';
import { QueryState } from '../catalog/QueryState';
import HomeSectionView from './HomeSectionView';
export default function HomeScreen() {
  const identity = useIdentity();
  const client = useQueryClient();
  const home = useQuery({
    queryKey: ['home', identity],
    queryFn: ({ signal }) => fetchHome(signal),
    enabled: !!apiConfig.baseUrl,
  });
  return (
    <View style={shop.page}>
      <ShopHeader search />
      <FlatList
        data={home.data ?? []}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.feed}
        refreshing={home.isRefetching}
        onRefresh={() => {
          client
            .invalidateQueries({ queryKey: ['home'] })
            .catch(() => undefined);
          client
            .invalidateQueries({ queryKey: ['home-section'] })
            .catch(() => undefined);
        }}
        ListHeaderComponent={
          <View style={styles.status}>
            <QueryState
              pending={home.isPending}
              error={home.error}
              paused={home.fetchStatus === 'paused'}
              retry={() => {
                home.refetch().catch(() => undefined);
              }}
            />
          </View>
        }
        renderItem={({ item }) => <HomeSectionView section={item} />}
        ListEmptyComponent={
          !home.isPending && !home.error ? (
            <View style={shop.padded}>
              <Feedback
                title="Discover something new"
                message="Explore our products and find the right parts for your next idea."
              />
              <Button
                label="Browse products"
                onPress={() => router.push('/products')}
              />
            </View>
          ) : null
        }
        ListFooterComponent={
          <View style={shop.padded}>
            <AppText style={shop.muted}>
              Find the parts. Build your next idea.
            </AppText>
            <Button
              label="Explore all products"
              onPress={() => router.push('/products')}
            />
          </View>
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  feed: { paddingBottom: 24, gap: 8 },
  status: { paddingHorizontal: 16, paddingTop: 12 },
});
