import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { AppText, Feedback } from '../../components/ui';
import {
  ProductCard,
  ProductGridSkeleton,
  ScrollShadow,
  ShopHeader,
  shop,
} from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { useWishlist } from './hooks';

const STEPS: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  text: string;
}[] = [
  {
    icon: 'heart-outline',
    title: 'Tap the heart',
    text: 'On any product card or product page.',
  },
  {
    icon: 'sync-outline',
    title: 'Saved to your account',
    text: 'Find it here or on elexify.online anytime.',
  },
  {
    icon: 'bag-add-outline',
    title: 'Add to cart when ready',
    text: 'Buy straight from your wishlist.',
  },
];

function WishlistEmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.illustration} accessibilityElementsHidden>
        <View style={styles.illustrationRing}>
          <View style={styles.illustrationCore}>
            <Ionicons name="heart" size={40} color="#F43F5E" />
          </View>
        </View>
        <View style={[styles.sparkle, styles.sparkleTop]} />
        <View style={[styles.sparkle, styles.sparkleSide]} />
        <View style={styles.miniHeart}>
          <Ionicons name="heart" size={12} color="#FB7185" />
        </View>
      </View>
      <AppText accessibilityRole="header" style={styles.emptyTitle}>
        Your wishlist is empty
      </AppText>
      <AppText style={styles.emptyText}>
        Save the parts you like and come back to them whenever you're ready to
        build.
      </AppText>

      <View style={styles.steps}>
        {STEPS.map((step, i) => (
          <View key={step.title} style={styles.step}>
            <View style={styles.stepIcon}>
              <Ionicons
                name={step.icon}
                size={18}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.stepBody}>
              <AppText style={styles.stepTitle}>
                {i + 1}. {step.title}
              </AppText>
              <AppText style={styles.stepText}>{step.text}</AppText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/products')}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        >
          <Ionicons name="storefront-outline" size={18} color="#FFFFFF" />
          <AppText style={styles.primaryText}>Explore products</AppText>
        </Pressable>
        <View style={styles.secondaryRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/categories')}
            style={({ pressed }) => [
              styles.secondary,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="apps-outline"
              size={16}
              color={theme.colors.primary}
            />
            <AppText style={styles.secondaryText}>Categories</AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/recently-viewed')}
            style={({ pressed }) => [
              styles.secondary,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={theme.colors.primary}
            />
            <AppText style={styles.secondaryText}>Recently viewed</AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function WishlistScreen() {
  const wishlist = useWishlist();
  const items = wishlist.data?.pages.flatMap(page => page.items) ?? [];
  const total = wishlist.data?.pages[0]?.total ?? items.length;
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <View style={shop.page}>
      <ShopHeader title="Your wishlist" back />
      {items.length > 0 && (
        <ScrollShadow scrollY={scrollY} style={styles.toolbar}>
          <AppText style={shop.muted}>
            {total} {total === 1 ? 'item' : 'items'} saved
          </AppText>
        </ScrollShadow>
      )}
      <Animated.FlatList
        data={items}
        keyExtractor={item => item.key}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        refreshing={wishlist.isRefetching && !wishlist.isFetchingNextPage}
        onRefresh={() => {
          wishlist.refetch().catch(() => undefined);
        }}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <ProductCard product={item} />
          </View>
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (wishlist.hasNextPage && !wishlist.isFetchingNextPage) {
            wishlist.fetchNextPage().catch(() => undefined);
          }
        }}
        ListHeaderComponent={
          <QueryState
            pending={wishlist.isPending}
            error={wishlist.error}
            paused={wishlist.fetchStatus === 'paused'}
            retry={() => {
              wishlist.refetch().catch(() => undefined);
            }}
            skeleton={<ProductGridSkeleton gap={16} rowGap={16} />}
          />
        }
        ListEmptyComponent={
          !wishlist.isPending && !wishlist.isError ? (
            <WishlistEmptyState />
          ) : null
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {wishlist.isFetchNextPageError && (
              <Feedback
                title="Unable to load more"
                message="Your saved items are still here."
                onRetry={() => {
                  wishlist.fetchNextPage().catch(() => undefined);
                }}
              />
            )}
            {wishlist.isFetchingNextPage && (
              <AppText style={shop.muted}>Loading more…</AppText>
            )}
          </View>
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  toolbar: { paddingHorizontal: 16, paddingVertical: 12 },
  grid: { padding: 16, gap: 16, flexGrow: 1 },
  column: { gap: 16 },
  cell: { flex: 1 },
  pressed: { opacity: 0.85 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  illustration: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  illustrationRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
  },
  illustrationCore: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#F43F5E',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sparkle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FDA4AF',
  },
  sparkleTop: { width: 14, height: 14, top: 8, right: 18 },
  sparkleSide: { width: 9, height: 9, bottom: 22, left: 8, opacity: 0.7 },
  miniHeart: { position: 'absolute', top: 30, left: 14 },
  emptyTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 20,
    lineHeight: 28,
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 6,
    maxWidth: 300,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  steps: {
    alignSelf: 'stretch',
    gap: 14,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F7FBFA',
    borderWidth: 1,
    borderColor: '#E0F0ED',
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5EBE7',
  },
  stepBody: { flex: 1 },
  stepTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  stepText: { fontSize: 12, lineHeight: 17, color: theme.colors.secondary },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 20 },
  primary: {
    minHeight: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
  },
  primaryText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
  secondaryRow: { flexDirection: 'row', gap: 10 },
  secondary: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#B2DFDB',
    backgroundColor: '#FFFFFF',
  },
  secondaryText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
  },
  footer: { gap: 12, marginTop: 8 },
});
