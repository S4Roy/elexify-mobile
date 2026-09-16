import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../ui';
import { theme } from '../../theme';
import type { Category, Product } from '../../api/discovery';
import { useToggleWishlist } from '../../features/wishlist/hooks';

export const shop = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  searchLabel: { flex: 1, color: theme.colors.secondary },
  header: { backgroundColor: '#ECFDFC' },
  headerInner: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  logo: { width: 130, height: 38, resizeMode: 'contain' },
  title: {
    fontFamily: theme.fonts.medium,
    fontSize: 20,
    color: theme.colors.primary,
    flex: 1,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minHeight: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 12,
  },
  padded: { padding: 16, gap: 16 },
  heading: { fontFamily: theme.fonts.bold, fontSize: 18, lineHeight: 26 },
  muted: { color: theme.colors.secondary, fontSize: 13, lineHeight: 20 },
  link: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  selected: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  product: {
    flex: 1,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  productName: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 40,
  },
  categoryLabel: { color: '#A65C00', fontSize: 11, lineHeight: 16 },
  price: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
  },
  was: {
    color: theme.colors.secondary,
    textDecorationLine: 'line-through',
    fontSize: 12,
  },
  priceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  productImage: {
    width: '100%',
    aspectRatio: 1.15,
    borderRadius: 9,
    backgroundColor: '#F0F1F3',
  },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  imageWrap: { position: 'relative' },
  wishlistButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  categoryTile: {
    flex: 1,
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#B2DAD5',
    borderRadius: 12,
    alignItems: 'center',
  },
  categoryImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#F6F7F7',
  },
  categoryName: {
    color: theme.colors.primary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
export function IconButton({
  name,
  label,
  onPress,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={shop.icon}
    >
      <Ionicons name={name} size={24} color={theme.colors.primary} />
    </Pressable>
  );
}
export function ShopHeader({
  title,
  search = false,
  back = false,
}: {
  title?: string;
  search?: boolean;
  back?: boolean;
}) {
  return (
    <SafeAreaView edges={['top']} style={shop.header}>
      <View style={shop.headerInner}>
        <View style={shop.row}>
          {back && (
            <IconButton
              name="chevron-back"
              label="Go back"
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace('/')
              }
            />
          )}
          {title ? (
            <AppText style={shop.title}>{title}</AppText>
          ) : (
            <View style={shop.flex}>
              <Image
                source={require('../../assets/images/Logo.png')}
                accessibilityLabel="Elexify"
                style={shop.logo}
              />
            </View>
          )}
          {!search && (
            <IconButton
              name="search-outline"
              label="Search products"
              onPress={() => router.push('/search')}
            />
          )}
          <IconButton
            name="bag-outline"
            label="Open cart"
            onPress={() => router.push('/cart')}
          />
        </View>
        {search && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search products"
            onPress={() => router.push('/search')}
            style={shop.search}
          >
            <AppText style={shop.searchLabel}>Search products…</AppText>
            <Ionicons
              name="search-outline"
              size={22}
              color={theme.colors.secondary}
            />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
export function SearchField({
  value,
  onChange,
  onSubmit,
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  autoFocus?: boolean;
}) {
  return (
    <View style={shop.search}>
      <Ionicons name="search-outline" size={20} color={theme.colors.primary} />
      <TextInput
        accessibilityLabel="Search products"
        placeholder="Search products…"
        placeholderTextColor={theme.colors.secondary}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoFocus={autoFocus}
        autoCorrect={false}
        maxLength={120}
        style={shop.input}
      />
      {!!value && (
        <IconButton
          name="close-outline"
          label="Clear search"
          onPress={() => onChange('')}
        />
      )}
    </View>
  );
}
export function StoreImage({
  uri,
  style,
  label,
}: {
  uri?: string;
  style: React.ComponentProps<typeof Image>['style'];
  label: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  return uri && !failed ? (
    <Image
      source={{ uri }}
      accessibilityLabel={label}
      resizeMode="contain"
      style={style}
      onError={() => setFailed(true)}
    />
  ) : (
    <View
      accessibilityLabel={label + ', image unavailable'}
      style={[style, shop.placeholder]}
    >
      <Ionicons name="image-outline" size={30} color={theme.colors.secondary} />
    </View>
  );
}
export const money = (value: number) =>
  '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
export function WishlistHeart({
  product,
  size = 20,
  overlay = true,
}: {
  product: Pick<Product, 'id' | 'variationId' | 'inWishlist' | 'name'>;
  size?: number;
  overlay?: boolean;
}) {
  const [active, setActive] = useState(product.inWishlist);
  useEffect(() => setActive(product.inWishlist), [product.inWishlist]);
  const toggle = useToggleWishlist();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        (active ? 'Remove ' : 'Add ') + product.name + (active ? ' from wishlist' : ' to wishlist')
      }
      accessibilityState={{ selected: active }}
      disabled={toggle.isPending}
      onPress={() =>
        toggle.mutate(
          { productId: product.id, variationId: product.variationId },
          { onSuccess: () => setActive(a => !a) },
        )
      }
      style={overlay ? shop.wishlistButton : shop.icon}
    >
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={size}
        color={active ? '#E0245E' : theme.colors.secondary}
      />
    </Pressable>
  );
}
export function ProductCard({ product }: { product: Product }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${product.name}. ${
        product.price === null ? 'Price unavailable' : money(product.price)
      }. View product details`}
      onPress={() =>
        router.push({
          pathname: '/products/[slug]',
          params: {
            slug: product.slug,
            ...(product.variationId ? { variation_id: product.variationId } : {}),
          },
        })
      }
      style={shop.product}
    >
      <View style={shop.imageWrap}>
        <StoreImage
          uri={product.image}
          label={product.name}
          style={shop.productImage}
        />
        <WishlistHeart product={product} />
      </View>
      {!!product.category && (
        <AppText numberOfLines={1} style={shop.categoryLabel}>
          {product.category}
        </AppText>
      )}
      <AppText numberOfLines={2} style={shop.productName}>
        {product.name}
      </AppText>
      <View style={shop.priceRow}>
        {product.regularPrice !== null &&
          product.price !== null &&
          product.regularPrice > product.price && (
            <AppText style={shop.was}>{money(product.regularPrice)}</AppText>
          )}
        <AppText style={shop.price}>
          {product.price === null ? 'Price unavailable' : money(product.price)}
        </AppText>
      </View>
      {product.rating !== null && product.rating > 0 && (
        <AppText style={shop.muted}>★ {product.rating.toFixed(1)}</AppText>
      )}
      {!product.inStock && <AppText style={shop.muted}>Out of stock</AppText>}
    </Pressable>
  );
}
export function CategoryTile({
  category,
  onPress,
}: {
  category: Category;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={category.name}
      onPress={
        onPress ??
        (() =>
          router.push({
            pathname: '/products',
            params: { category: category.slug, title: category.name },
          }))
      }
      style={shop.categoryTile}
    >
      <StoreImage
        uri={category.image}
        label={category.name}
        style={shop.categoryImage}
      />
      <AppText numberOfLines={2} style={shop.categoryName}>
        {category.name}
      </AppText>
    </Pressable>
  );
}
export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[shop.chip, selected && shop.selected]}
    >
      <AppText style={shop.link}>{label}</AppText>
    </Pressable>
  );
}
