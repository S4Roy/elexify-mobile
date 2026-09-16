import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText, Button, Feedback } from '../../components/ui';
import { Chip, ShopHeader, StoreImage, WishlistHeart, money, shop } from '../../components/shop';
import { openWebsite, websiteProductUrl } from '../catalog/links';
import { QueryState } from '../catalog/QueryState';
import { plainText } from '../../utils/html';
import { theme } from '../../theme';
import { useSession } from '../../stores/session';
import { useCart, useCartMutation } from '../cart/hooks';
import {
  useDeliveryCheck,
  useProductDetail,
  useReviews,
  useSpecifications,
  useSubmitRating,
} from './hooks';
import { matchVariation, selectionsFor } from './variant';

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={shop.row}>
      {[1, 2, 3, 4, 5].map(star => (
        <Pressable
          key={star}
          accessibilityRole="button"
          accessibilityLabel={`Rate ${star} star${star === 1 ? '' : 's'}`}
          onPress={() => onChange(star)}
          hitSlop={6}
        >
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={28}
            color={theme.colors.primary}
          />
        </Pressable>
      ))}
    </View>
  );
}

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? '';

export default function ProductDetailScreen() {
  const route = useLocalSearchParams<{ slug: string; variation_id?: string }>();
  const slug = first(route.slug);
  const routeVariationId = first(route.variation_id);
  const product = useProductDetail(slug, routeVariationId || undefined);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [seeded, setSeeded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [postcode, setPostcode] = useState('');
  const delivery = useDeliveryCheck();
  const data = product.data;

  if (data && !seeded) {
    setSeeded(true);
    const initial = routeVariationId
      ? data.variations.find(v => v.id === routeVariationId)
      : undefined;
    if (initial) {
      setSelected(selectionsFor(initial));
    }
  }

  const variation = data ? matchVariation(data.variations, selected) : undefined;
  const requiresVariation = !!data && data.attributes.length > 0;
  const resolved = requiresVariation ? variation : undefined;
  const images = (resolved?.images.length ? resolved.images : data?.images) ?? [];
  const price = resolved ? resolved.price : data?.price ?? null;
  const regularPrice = resolved ? resolved.regularPrice : data?.regularPrice ?? null;
  const stockQuantity = resolved ? resolved.stockQuantity : data?.stockQuantity ?? null;
  const askForPrice = resolved ? resolved.askForPrice : data?.askForPrice ?? false;
  const inStock = stockQuantity === null || stockQuantity > 0;
  const canBuy = !requiresVariation || !!variation;

  const specs = useSpecifications(slug);
  const reviews = useReviews(data?.id, resolved?.id);
  const cart = useCart();
  const cartMutation = useCartMutation();
  const isAuthenticated = useSession(s => s.status === 'authenticated');
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState('');
  const submitRating = useSubmitRating(data?.id, resolved?.id);

  const buyUrl = useMemo(() => {
    if (!data) {
      return null;
    }
    return websiteProductUrl({ slug: data.slug, variationId: resolved?.id });
  }, [data, resolved]);

  const addToCart = () => {
    if (!data) {
      return;
    }
    const variationId = resolved?.id;
    const existing = cart.data?.items.find(
      item => item.productId === data.id && item.variationId === variationId,
    );
    cartMutation.mutate({
      productId: data.id,
      variationId,
      quantity: (existing?.quantity ?? 0) + 1,
    });
  };

  return (
    <View style={shop.page}>
      <ShopHeader title={data?.name || 'Product'} back />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <QueryState
          pending={product.isPending}
          error={product.error}
          paused={product.fetchStatus === 'paused'}
          retry={() => {
            product.refetch().catch(() => undefined);
          }}
        />
        {data && (
          <>
            <StoreImage
              uri={images[activeImage] ?? images[0]}
              label={data.name}
              style={styles.hero}
            />
            {images.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
                {images.map((uri, index) => (
                  <Chip
                    key={uri + index}
                    label={String(index + 1)}
                    selected={index === activeImage}
                    onPress={() => setActiveImage(index)}
                  />
                ))}
              </ScrollView>
            )}

            <View style={styles.section}>
              {!!data.categories[0] && (
                <AppText style={shop.categoryLabel}>{data.categories[0].name}</AppText>
              )}
              <View style={[shop.row, styles.titleRow]}>
                <AppText accessibilityRole="header" style={[styles.title, styles.flex]}>
                  {data.name}
                </AppText>
                <WishlistHeart
                  product={{
                    id: data.id,
                    variationId: resolved?.id,
                    inWishlist: data.inWishlist,
                    name: data.name,
                  }}
                  size={26}
                  overlay={false}
                />
              </View>
              {data.rating !== null && data.rating > 0 && (
                <AppText style={shop.muted}>
                  ★ {data.rating.toFixed(1)} · {data.totalReviews} review
                  {data.totalReviews === 1 ? '' : 's'}
                </AppText>
              )}
              {!!data.sku && <AppText style={shop.muted}>SKU: {data.sku}</AppText>}
            </View>

            <View style={[shop.row, styles.section]}>
              {askForPrice ? (
                <AppText style={styles.price}>Contact us for pricing</AppText>
              ) : (
                <>
                  {regularPrice !== null && price !== null && regularPrice > price && (
                    <AppText style={shop.was}>{money(regularPrice)}</AppText>
                  )}
                  <AppText style={styles.price}>
                    {price === null ? 'Price unavailable' : money(price)}
                  </AppText>
                </>
              )}
            </View>

            {data.attributes.map(attribute => (
              <View key={attribute.id} style={styles.section}>
                <AppText style={shop.heading}>Select {attribute.name}</AppText>
                <View style={styles.wrap}>
                  {attribute.values.map(value => (
                    <Chip
                      key={value.id}
                      label={value.name}
                      selected={selected[attribute.id] === value.id}
                      onPress={() =>
                        setSelected(current => ({ ...current, [attribute.id]: value.id }))
                      }
                    />
                  ))}
                </View>
              </View>
            ))}

            <View style={styles.section}>
              <AppText style={inStock ? shop.muted : styles.outOfStock}>
                {!canBuy
                  ? 'Select all options to check availability.'
                  : inStock
                  ? 'In stock'
                  : 'Out of stock'}
              </AppText>
              <View style={shop.row}>
                <View style={styles.flex}>
                  <Button
                    label={cartMutation.isPending ? 'Adding…' : 'Add to cart'}
                    disabled={!canBuy || !inStock || cartMutation.isPending}
                    onPress={addToCart}
                  />
                </View>
                <View style={styles.flex}>
                  <Button
                    label="Buy now"
                    disabled={!canBuy || !inStock}
                    onPress={() => buyUrl && openWebsite(buyUrl)}
                  />
                </View>
              </View>
              {cartMutation.isError && (
                <AppText style={styles.outOfStock}>{cartMutation.error.message}</AppText>
              )}
              {cartMutation.isSuccess && (
                <AppText style={shop.muted}>Added to your cart.</AppText>
              )}
              <AppText style={shop.muted}>Checkout completes on our website.</AppText>
            </View>

            <View style={styles.section}>
              <AppText style={shop.heading}>Delivery</AppText>
              <View style={shop.row}>
                <TextInput
                  accessibilityLabel="Delivery pincode"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={postcode}
                  onChangeText={setPostcode}
                  placeholder="Enter pincode"
                  style={styles.pincode}
                />
                <Button
                  label={delivery.isPending ? 'Checking…' : 'Check'}
                  disabled={postcode.trim().length < 3 || delivery.isPending}
                  onPress={() => {
                    delivery.mutate({
                      postcode: postcode.trim(),
                      productId: data.id,
                      variationId: resolved?.id,
                    });
                  }}
                />
              </View>
              {delivery.data && (
                <AppText style={shop.muted}>
                  {delivery.data.isAvailable
                    ? `Delivery by ${delivery.data.deliveryDisplay || 'soon'} · ${
                        delivery.data.shippingAmount === 0 || delivery.data.shippingAmount === null
                          ? 'Free delivery'
                          : money(delivery.data.shippingAmount)
                      }`
                    : 'Not serviceable at this pincode.'}
                </AppText>
              )}
              {delivery.isError && (
                <AppText style={styles.outOfStock}>{delivery.error.message}</AppText>
              )}
            </View>

            {!!data.description && (
              <View style={styles.section}>
                <AppText style={shop.heading}>Description</AppText>
                <AppText>{plainText(data.description)}</AppText>
              </View>
            )}

            {specs.data && specs.data.length > 0 && (
              <View style={styles.section}>
                <AppText style={shop.heading}>Specifications</AppText>
                {specs.data.map((spec, index) => (
                  <View
                    key={spec.id}
                    style={[styles.specRow, index % 2 === 1 && styles.specRowAlt]}
                  >
                    <AppText style={styles.specLabel}>{spec.label}</AppText>
                    <AppText style={styles.specValue}>{spec.value}</AppText>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <AppText style={shop.heading}>Reviews</AppText>
              {isAuthenticated ? (
                <View style={styles.reviewForm}>
                  <AppText style={shop.muted}>Your rating</AppText>
                  <StarPicker value={myRating} onChange={setMyRating} />
                  <TextInput
                    accessibilityLabel="Your review"
                    value={myReview}
                    onChangeText={setMyReview}
                    placeholder="Share your experience (optional)"
                    placeholderTextColor={theme.colors.secondary}
                    multiline
                    style={styles.reviewInput}
                  />
                  <Button
                    label={submitRating.isPending ? 'Submitting…' : 'Submit review'}
                    disabled={myRating < 1 || submitRating.isPending}
                    onPress={() => {
                      submitRating.mutate(
                        { rating: myRating, description: myReview.trim() },
                        {
                          onSuccess: () => {
                            setMyRating(0);
                            setMyReview('');
                          },
                        },
                      );
                    }}
                  />
                  {submitRating.isError && (
                    <AppText style={styles.outOfStock}>{submitRating.error.message}</AppText>
                  )}
                  {submitRating.isSuccess && (
                    <AppText style={shop.muted}>Thanks for your review!</AppText>
                  )}
                </View>
              ) : (
                <Pressable onPress={() => router.push('/login')}>
                  <AppText style={shop.link}>Sign in to write a review</AppText>
                </Pressable>
              )}
              {reviews.isPending && reviews.fetchStatus !== 'idle' && (
                <AppText style={shop.muted}>Loading reviews…</AppText>
              )}
              {reviews.data && reviews.data.length === 0 && (
                <AppText style={shop.muted}>No reviews yet.</AppText>
              )}
              {reviews.data?.map(review => (
                <View key={review.id} style={styles.review}>
                  <AppText style={shop.link}>
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)} · {review.userName}
                  </AppText>
                  {!!review.description && <AppText>{review.description}</AppText>}
                </View>
              ))}
            </View>
          </>
        )}
        {!product.isPending && !product.isError && !data && (
          <Feedback
            title="Product unavailable"
            message="This product could not be found."
          />
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  body: { paddingBottom: 32, gap: 4 },
  flex: { flex: 1 },
  hero: { width: '100%', aspectRatio: 1, backgroundColor: '#F0F1F3' },
  thumbRow: { padding: 12, gap: 8 },
  section: { padding: 16, gap: 10 },
  titleRow: { alignItems: 'flex-start' },
  title: { fontFamily: theme.fonts.bold, fontSize: 20, lineHeight: 27 },
  price: { color: theme.colors.primary, fontFamily: theme.fonts.bold, fontSize: 22 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  outOfStock: { color: theme.colors.danger },
  pincode: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
  },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, gap: 12 },
  specRowAlt: { backgroundColor: theme.colors.background, borderRadius: 8 },
  specLabel: { color: theme.colors.secondary, flex: 1 },
  specValue: { flex: 1, textAlign: 'right' },
  review: { gap: 4, paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.colors.border },
  reviewForm: {
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
  },
  reviewInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
    textAlignVertical: 'top',
  },
});
