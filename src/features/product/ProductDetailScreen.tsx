import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, Feedback } from '../../components/ui';
import {
  AddToCartControl,
  Chip,
  ShopHeader,
  StarRating,
  StoreImage,
  WishlistHeart,
  money,
  shop,
} from '../../components/shop';
import { openWebsite, websiteProductUrl } from '../catalog/links';
import { QueryState } from '../catalog/QueryState';
import { plainText } from '../../utils/html';
import { theme } from '../../theme';
import { useSession } from '../../stores/session';
import { useCompareStore } from '../../stores/compare';
import { useRecentlyViewed } from '../../stores/recentlyViewed';
import { useCart } from '../cart/hooks';
import type { QuantityDiscount } from '../../api/productDetail';
import type { PickedImage } from '../../api/media';
import {
  useDeliveryCheck,
  useProductDetail,
  useReviews,
  useSpecifications,
  useSubmitRating,
} from './hooks';
import { matchVariation, selectionsFor } from './variant';

const MAX_REVIEW_IMAGES = 5;

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

function Accordion({
  title,
  defaultOpen = true,
  children,
}: React.PropsWithChildren<{ title: string; defaultOpen?: boolean }>) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(o => !o)}
        style={styles.accordionHeader}
      >
        <AppText style={shop.heading}>{title}</AppText>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.secondary}
        />
      </Pressable>
      {open && <View style={styles.accordionBody}>{children}</View>}
    </View>
  );
}

function QuantityDiscountList({
  tiers,
  activeIndex,
}: {
  tiers: QuantityDiscount[];
  activeIndex: number;
}) {
  return (
    <View style={styles.tierList}>
      {tiers.map((tier, index) => {
        const next = tiers[index + 1];
        const label = next
          ? `${tier.minQuantity} to ${next.minQuantity - 1}`
          : `${tier.minQuantity}+`;
        const isActive = index === activeIndex;
        return (
          <View
            key={tier.minQuantity}
            style={[styles.tierRow, isActive && styles.tierRowActive]}
          >
            <View style={[styles.tierDot, isActive && styles.tierDotActive]} />
            <View style={styles.flex}>
              <AppText style={isActive ? styles.tierTextActive : styles.tierText}>
                Buy from {label} items and get{' '}
                <AppText style={styles.tierPercent}>{tier.discountPercent}% OFF</AppText>
              </AppText>
              <AppText style={styles.tierHint}>on each product</AppText>
              {isActive && (
                <View style={styles.tierAppliedBadge}>
                  <AppText style={styles.tierAppliedText}>
                    Applied at your current quantity
                  </AppText>
                </View>
              )}
            </View>
          </View>
        );
      })}
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
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const heroScrollRef = useRef<ScrollView>(null);
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
  const hasDiscount =
    !askForPrice && regularPrice !== null && price !== null && regularPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((regularPrice! - price!) / regularPrice!) * 100)
    : 0;

  useEffect(() => {
    if (data?.id) {
      useRecentlyViewed.getState().add(data.id);
    }
  }, [data?.id]);

  useEffect(() => {
    setActiveImage(0);
    heroScrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [resolved?.id]);

  const specs = useSpecifications(slug);
  const reviews = useReviews(data?.id, resolved?.id);
  const cart = useCart();
  const cartItem = data
    ? cart.data?.items.find(
        item => item.productId === data.id && item.variationId === resolved?.id,
      )
    : undefined;
  const quantityDiscounts = data?.quantityDiscounts ?? [];
  const currentQty = cartItem?.quantity ?? 1;
  const activeDiscountTierIndex = quantityDiscounts.findIndex((tier, index) => {
    const next = quantityDiscounts[index + 1];
    return currentQty >= tier.minQuantity && (!next || currentQty < next.minQuantity);
  });
  const isAuthenticated = useSession(s => s.status === 'authenticated');
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState('');
  const [myImages, setMyImages] = useState<PickedImage[]>([]);
  const submitRating = useSubmitRating(data?.id, resolved?.id);
  const compared = useCompareStore(s => (data ? s.has(data.id) : false));
  const addToCompare = useCompareStore(s => s.add);
  const removeFromCompare = useCompareStore(s => s.remove);
  const [compareError, setCompareError] = useState('');
  const toggleCompare = () => {
    if (!data) {
      return;
    }
    if (compared) {
      removeFromCompare(data.id);
      setCompareError('');
      return;
    }
    const result = addToCompare({ productId: data.id, categoryId: data.categories[0]?.id });
    setCompareError(result.ok ? '' : result.message ?? 'Unable to add to comparison.');
  };

  const pickReviewImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_REVIEW_IMAGES - myImages.length,
      quality: 0.8,
    });
    if (result.canceled) {
      return;
    }
    const picked: PickedImage[] = result.assets.map((asset, index) => ({
      uri: asset.uri,
      name: asset.fileName || `review-${Date.now()}-${index}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
    }));
    setMyImages(current => [...current, ...picked].slice(0, MAX_REVIEW_IMAGES));
  };

  const buyUrl = useMemo(() => {
    if (!data) {
      return null;
    }
    return websiteProductUrl({ slug: data.slug, variationId: resolved?.id });
  }, [data, resolved]);

  const onHeroScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / winWidth);
    setActiveImage(index);
  };

  const goToImage = (index: number) => {
    setActiveImage(index);
    heroScrollRef.current?.scrollTo({ x: index * winWidth, animated: true });
  };

  return (
    <View style={[shop.page, styles.page]}>
      <ShopHeader title={data?.name || 'Product'} back />
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
            <View style={styles.heroWrap}>
              <ScrollView
                ref={heroScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onHeroScrollEnd}
              >
                {(images.length ? images : [undefined]).map((uri, index) => (
                  <StoreImage
                    key={(uri ?? 'placeholder') + index}
                    uri={uri}
                    label={`${data.name} photo ${index + 1}`}
                    style={[styles.hero, { width: winWidth }]}
                  />
                ))}
              </ScrollView>
              {images.length > 1 && (
                <View style={styles.dotsRow} pointerEvents="none">
                  {images.map((_, index) => (
                    <View
                      key={index}
                      style={[styles.dot, index === activeImage && styles.dotActive]}
                    />
                  ))}
                </View>
              )}
            </View>
            {images.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbRow}
              >
                {images.map((uri, index) => (
                  <Pressable
                    key={uri + index}
                    accessibilityRole="button"
                    accessibilityLabel={`View photo ${index + 1}`}
                    accessibilityState={{ selected: index === activeImage }}
                    onPress={() => goToImage(index)}
                    style={[styles.thumb, index === activeImage && styles.thumbActive]}
                  >
                    <StoreImage uri={uri} label="" style={styles.thumbImage} />
                  </Pressable>
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
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={compared ? `Remove ${data.name} from comparison` : `Compare ${data.name}`}
                  accessibilityState={{ selected: compared }}
                  onPress={toggleCompare}
                  hitSlop={6}
                  style={styles.compareButton}
                >
                  <Ionicons
                    name={compared ? 'checkmark-circle' : 'git-compare-outline'}
                    size={24}
                    color={compared ? theme.colors.primary : theme.colors.secondary}
                  />
                </Pressable>
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
              {!!compareError && <AppText style={styles.outOfStock}>{compareError}</AppText>}
              {data.rating !== null && data.rating > 0 && (
                <View style={[shop.row, styles.ratingRow]}>
                  <StarRating value={data.rating} size={15} />
                  <AppText style={shop.muted}>
                    {data.rating.toFixed(1)} · {data.totalReviews} review
                    {data.totalReviews === 1 ? '' : 's'}
                  </AppText>
                </View>
              )}
              {!!data.sku && <AppText style={shop.muted}>SKU: {data.sku}</AppText>}
            </View>

            <View style={styles.section}>
              {askForPrice ? (
                <AppText style={styles.price}>Contact us for pricing</AppText>
              ) : (
                <>
                  <View style={[shop.row, styles.priceRow]}>
                    <AppText style={styles.price}>
                      {price === null ? 'Price unavailable' : money(price)}
                    </AppText>
                    {hasDiscount && (
                      <AppText style={styles.wasLarge}>{money(regularPrice!)}</AppText>
                    )}
                    {hasDiscount && (
                      <View style={styles.discountBadge}>
                        <AppText style={styles.discountText}>-{discountPercent}%</AppText>
                      </View>
                    )}
                  </View>
                  {hasDiscount && (
                    <AppText style={styles.savings}>
                      You save {money(regularPrice! - price!)} ({discountPercent}%)
                    </AppText>
                  )}
                </>
              )}
              <AppText style={inStock ? shop.muted : styles.outOfStock}>
                {!canBuy
                  ? 'Select all options to check availability.'
                  : inStock
                  ? 'In stock'
                  : 'Out of stock'}
              </AppText>
            </View>

            {!askForPrice && quantityDiscounts.length > 0 && (
              <View style={styles.section}>
                <AppText style={shop.heading}>🔥 Buy More Save More!</AppText>
                <QuantityDiscountList
                  tiers={quantityDiscounts}
                  activeIndex={activeDiscountTierIndex}
                />
              </View>
            )}

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
              <Accordion title="Description">
                <AppText>{plainText(data.description)}</AppText>
              </Accordion>
            )}

            {specs.data && specs.data.length > 0 && (
              <Accordion title="Specifications">
                {specs.data.map((spec, index) => (
                  <View
                    key={spec.id}
                    style={[styles.specRow, index % 2 === 1 && styles.specRowAlt]}
                  >
                    <AppText style={styles.specLabel}>{spec.label}</AppText>
                    <AppText style={styles.specValue}>{spec.value}</AppText>
                  </View>
                ))}
              </Accordion>
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
                  <AppText style={shop.muted}>
                    Add photos {`(optional, up to ${MAX_REVIEW_IMAGES})`}
                  </AppText>
                  <View style={styles.reviewImages}>
                    {myImages.map((image, index) => (
                      <View key={image.uri} style={styles.reviewImageThumbWrap}>
                        <Image source={{ uri: image.uri }} style={styles.reviewImageThumb} />
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Remove photo"
                          onPress={() => setMyImages(current => current.filter((_, i) => i !== index))}
                          style={styles.reviewImageRemove}
                        >
                          <Ionicons name="close" size={12} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    ))}
                    {myImages.length < MAX_REVIEW_IMAGES && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Add photo"
                        onPress={pickReviewImages}
                        style={styles.reviewImageAdd}
                      >
                        <Ionicons name="camera-outline" size={20} color={theme.colors.primary} />
                      </Pressable>
                    )}
                  </View>
                  <Button
                    label={submitRating.isPending ? 'Submitting…' : 'Submit review'}
                    disabled={myRating < 1 || submitRating.isPending}
                    onPress={() => {
                      submitRating.mutate(
                        { rating: myRating, description: myReview.trim(), images: myImages },
                        {
                          onSuccess: () => {
                            setMyRating(0);
                            setMyReview('');
                            setMyImages([]);
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
                <Pressable accessibilityRole="button" onPress={() => router.push('/login')}>
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
                  {review.media.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewMediaRow}>
                      {review.media.map((uri, index) => (
                        <Image key={uri + index} source={{ uri }} style={styles.reviewMediaThumb} />
                      ))}
                    </ScrollView>
                  )}
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
      {data && (
        <View style={[styles.stickyBar, { paddingBottom: Math.max(12, insets.bottom) }]}>
          {askForPrice ? (
            <View style={styles.flex}>
              <Button label="Contact us for pricing" onPress={() => buyUrl && openWebsite(buyUrl)} />
            </View>
          ) : !canBuy ? (
            <View style={styles.flex}>
              <Button label="Select options above" disabled onPress={() => undefined} />
            </View>
          ) : !inStock ? (
            <View style={styles.flex}>
              <Button label="Out of stock" disabled onPress={() => undefined} />
            </View>
          ) : (
            <>
              <AddToCartControl
                product={{ id: data.id, variationId: resolved?.id, name: data.name, inStock }}
                variant="full"
              />
              <View style={styles.flex}>
                <Button label="Buy now" onPress={() => buyUrl && openWebsite(buyUrl)} />
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  page: { backgroundColor: '#F4F5F7' },
  body: { paddingBottom: 120, gap: 4 },
  flex: { flex: 1 },
  heroWrap: { position: 'relative', backgroundColor: '#FFFFFF' },
  hero: { aspectRatio: 1, backgroundColor: '#F0F1F3' },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  dotActive: { backgroundColor: theme.colors.primary, width: 16 },
  thumbRow: { padding: 12, gap: 8 },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  thumbActive: { borderColor: theme.colors.primary },
  thumbImage: { width: '100%', height: '100%' },
  section: {
    marginHorizontal: 12,
    marginTop: 10,
    padding: 16,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  titleRow: { alignItems: 'flex-start' },
  title: { fontFamily: theme.fonts.bold, fontSize: 20, lineHeight: 27 },
  ratingRow: { alignItems: 'center', gap: 8 },
  compareButton: { paddingHorizontal: 4 },
  priceRow: { alignItems: 'center', gap: 10 },
  price: { color: theme.colors.primary, fontFamily: theme.fonts.bold, fontSize: 24 },
  wasLarge: { color: theme.colors.secondary, textDecorationLine: 'line-through', fontSize: 16 },
  savings: { color: theme.colors.primary, fontFamily: theme.fonts.medium, fontSize: 13 },
  discountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: theme.colors.danger,
  },
  discountText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
    lineHeight: 14,
  },
  tierList: { gap: 4 },
  tierRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 8,
    borderRadius: 10,
  },
  tierRowActive: { backgroundColor: theme.colors.primaryLight },
  tierDot: {
    marginTop: 3,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  tierDotActive: { backgroundColor: theme.colors.primary },
  tierText: { fontSize: 12, lineHeight: 18, color: theme.colors.secondary },
  tierTextActive: { fontSize: 12, lineHeight: 18, color: theme.colors.text },
  tierPercent: { fontFamily: theme.fonts.semibold, fontSize: 12, color: theme.colors.text },
  tierHint: { fontSize: 11, color: theme.colors.secondary, marginTop: 1 },
  tierAppliedBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  tierAppliedText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 10,
  },
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
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accordionBody: { gap: 10 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, gap: 12 },
  specRowAlt: { backgroundColor: '#F4F5F7', borderRadius: 8 },
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
  reviewImages: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reviewImageThumbWrap: { width: 60, height: 60 },
  reviewImageThumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#F0F1F3' },
  reviewImageRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.danger,
  },
  reviewImageAdd: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewMediaRow: { gap: 8, marginTop: 4 },
  reviewMediaThumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#F0F1F3' },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
