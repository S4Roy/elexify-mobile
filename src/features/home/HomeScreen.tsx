import React, { useRef } from 'react';
import { Animated, Pressable, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { AppText } from '../../components/ui';
import { HomeSearchPanel, ShopHeader, shop } from '../../components/shop';
import { fetchHome } from '../../api/discovery';
import { apiConfig } from '../../api/config';
import { useIdentity } from '../catalog/hooks';
import { QueryState } from '../catalog/QueryState';
import { useAddresses } from '../address/hooks';
import { theme } from '../../theme';
import HomeSectionView, { HomeSkeleton } from './HomeSectionView';

/** End-of-feed card: sends shoppers on to the full catalogue or the
 * category browser instead of leaving them at a dead end. */
function ExploreCard({ empty = false }: { empty?: boolean }) {
  return (
    <View style={styles.explore}>
      <View pointerEvents="none" style={styles.exploreBlob} />
      <View style={styles.exploreIcon}>
        <Ionicons name="grid-outline" size={22} color={theme.colors.primary} />
      </View>
      <AppText accessibilityRole="header" style={styles.exploreTitle}>
        {empty ? 'Discover something new' : 'Explore the full catalogue'}
      </AppText>
      <AppText style={styles.exploreText}>
        Find the parts. Build your next idea.
      </AppText>
      <View style={styles.exploreActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/products')}
          style={({ pressed }) => [
            styles.explorePrimary,
            pressed && styles.pressed,
          ]}
        >
          <AppText style={styles.explorePrimaryText}>
            Explore all products
          </AppText>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/categories')}
          style={({ pressed }) => [
            styles.exploreSecondary,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="apps-outline"
            size={16}
            color={theme.colors.primary}
          />
          <AppText style={styles.exploreSecondaryText}>
            Browse categories
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

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
          !home.isPending && !home.error ? <ExploreCard empty /> : null
        }
        ListFooterComponent={
          !home.isPending && !home.error && sections.length > 0 ? (
            <ExploreCard />
          ) : null
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  feed: { paddingBottom: 28 },
  status: { paddingHorizontal: 16, paddingTop: 12 },
  pressed: { opacity: 0.85 },
  explore: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#F1F9F7',
    borderWidth: 1,
    borderColor: '#D5EBE7',
  },
  exploreBlob: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -120,
    right: -60,
    backgroundColor: 'rgba(0,121,106,0.06)',
  },
  exploreIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  exploreTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 17,
    lineHeight: 24,
    color: theme.colors.text,
    textAlign: 'center',
  },
  exploreText: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  exploreActions: { alignSelf: 'stretch', gap: 10, marginTop: 16 },
  explorePrimary: {
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
  },
  explorePrimaryText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
  },
  exploreSecondary: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#B2DFDB',
    backgroundColor: '#FFFFFF',
  },
  exploreSecondaryText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
  },
});
