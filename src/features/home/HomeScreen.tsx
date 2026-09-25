import React, { useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { AppText, Button, Feedback } from '../../components/ui';
import { HomeSearchPanel, ShopHeader, shop } from '../../components/shop';
import { fetchHome } from '../../api/discovery';
import { apiConfig } from '../../api/config';
import { useIdentity } from '../catalog/hooks';
import { QueryState } from '../catalog/QueryState';
import { useAddresses } from '../address/hooks';
import HomeSectionView, { HomeSkeleton } from './HomeSectionView';
export default function HomeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const identity = useIdentity();
  const client = useQueryClient();
  const home = useQuery({
    queryKey: ['home', identity],
    queryFn: ({ signal }) => fetchHome(signal),
    enabled: !!apiConfig.baseUrl,
  });
  const addresses = useAddresses();
  const defaultAddress = addresses.data?.items.find(
    address => address.isDefault,
  );
  const deliveryLabel = defaultAddress
    ? [
        defaultAddress.addressLine1,
        defaultAddress.city.name,
        defaultAddress.state.name,
      ]
        .filter(Boolean)
        .join(', ')
    : 'Choose delivery address';
  const sections = [...(home.data ?? [])];
  const heroIndex = sections.findIndex(section => section.type === 'hero');
  const categoryIndex = sections.findIndex(
    section => section.type === 'category_section',
  );
  if (categoryIndex > heroIndex + 1) {
    const [category] = sections.splice(categoryIndex, 1);
    sections.splice(heroIndex + 1, 0, category);
  }
  return (
    <View style={shop.page}>
      <ShopHeader search scrollY={scrollY} />
      <Animated.FlatList
        data={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.feed}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
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
          <>
            <HomeSearchPanel deliveryLabel={deliveryLabel} />
            {home.error || (home.isPending && home.fetchStatus === 'paused') ? (
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
            ) : home.isPending ? (
              <HomeSkeleton />
            ) : null}
          </>
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
  feed: { paddingBottom: 24 },
  status: { paddingHorizontal: 16, paddingTop: 12 },
});
