import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Share,
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
import { ImageViewer } from '../../components/ImageViewer';
import {
  AddToCartControl,
  Chip,
  ProductCard,
  ShopHeader,
  SkeletonBlock,
  StarRating,
  StoreImage,
  WishlistHeart,
  money,
  shop,
} from '../../components/shop';
import { openWebsite, websiteProductUrl } from '../catalog/links';
import { QueryState } from '../catalog/QueryState';
import { uniqueProducts } from '../catalog/filters';
import { plainText } from '../../utils/html';
import { theme } from '../../theme';
import { useSession } from '../../stores/session';
import { useCompareStore } from '../../stores/compare';
import { useRecentlyViewed } from '../../stores/recentlyViewed';
import { useRecentProducts } from '../recentlyViewed/hooks';
import { useCart, useCartMutation } from '../cart/hooks';
import type { Product } from '../../api/discovery';
import type { QuantityDiscount, Review } from '../../api/productDetail';
import type { PickedImage } from '../../api/media';
import {
  useAlsoLike,
  useDeliveryCheck,
  useProductDetail,
  useReviews,
  useSpecifications,
  useSubmitRating,
} from './hooks';
import { matchVariation, selectionsFor } from './variant';

const MAX_REVIEW_IMAGES = 5;
const LOW_STOCK = 5;
const SPEC_PREVIEW = 6;
const REVIEW_PREVIEW = 3;
const DESCRIPTION_PREVIEW_LINES = 6;
const STAR = '#F5A623';
const GREEN = '#15803D';
const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

type ViewerState = {
  images: string[];
  index: number;
  title: string;
  fromGallery: boolean;
};

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.starPicker}>
      {[1, 2, 3, 4, 5].map(star => (
        <Pressable
          key={star}
          accessibilityRole="button"
          accessibilityLabel={`Rate ${star} star${star === 1 ? '' : 's'}`}
          accessibilityState={{ selected: star <= value }}
          onPress={() => onChange(star)}
          hitSlop={4}
        >
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={32}
            color={star <= value ? STAR : '#C7CBD1'}
          />
        </Pressable>
      ))}
    </View>
  );
}

/** Full-width white block, the building unit of the page. */
function Block({
  title,
  action,
  children,
  onLayout,
}: React.PropsWithChildren<{
  title?: string;
  action?: React.ReactNode;
  onLayout?: (y: number) => void;
}>) {
  return (
    <View
      style={styles.block}
      onLayout={onLayout ? e => onLayout(e.nativeEvent.layout.y) : undefined}
    >
      {(!!title || !!action) && (
        <View style={styles.blockHead}>
          {!!title && (
            <AppText accessibilityRole="header" style={styles.blockTitle}>
              {title}
            </AppText>
          )}
          {action}
        </View>
      )}
      {children}
    </View>
  );
}

function TextToggle({
  expanded,
  onPress,
  more,
  less = 'Show less',
}: {
  expanded: boolean;
  onPress: () => void;
  more: string;
  less?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onPress}
      hitSlop={6}
      style={styles.toggle}
    >
      <AppText style={styles.toggleText}>{expanded ? less : more}</AppText>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={16}
        color={theme.colors.primary}
      />
    </Pressable>
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tierRow}
    >
      {tiers.map((tier, index) => {
        const next = tiers[index + 1];
        const label = next
          ? `${tier.minQuantity}–${next.minQuantity - 1} items`
          : `${tier.minQuantity}+ items`;
        const isActive = index === activeIndex;
        return (
          <View
            key={tier.minQuantity}
            accessible
            accessibilityLabel={`Buy ${label}, get ${
              tier.discountPercent
            } percent off each${isActive ? ', applied' : ''}`}
            style={[styles.tier, isActive && styles.tierActive]}
          >
            <AppText style={[styles.tierPercent, isActive && styles.tierInk]}>
              {tier.discountPercent}% OFF
            </AppText>
            <AppText style={[styles.tierLabel, isActive && styles.tierInk]}>
              Buy {label}
            </AppText>
            {isActive && (
              <View style={styles.tierApplied}>
                <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                <AppText style={styles.tierAppliedText}>Applied</AppText>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? '';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]!.toUpperCase())
    .join('') || '?';

const AVATAR_COLORS = ['#0F766E', '#7C3AED', '#C2410C', '#1D4ED8', '#BE185D'];
const avatarColor = (name: string) =>
  AVATAR_COLORS[
    [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) %
      AVATAR_COLORS.length
  ];

const reviewDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
};

/** Shimmering placeholder matching the product page's real layout (gallery,
 * title and price, delivery, description), shown while the product first
 * loads so nothing jumps when the content arrives. */
function ProductDetailSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="Loading product"
      accessibilityState={{ busy: true }}
    >
      <View style={styles.heroBlock}>
        <View style={styles.heroSkeletonFrame}>
          <SkeletonBlock style={styles.heroSkeleton} />
          <View style={styles.heroActions}>
            <SkeletonBlock style={styles.skeletonCircle} />
            <SkeletonBlock style={styles.skeletonCircle} />
          </View>
        </View>
        <View style={[styles.thumbRow, styles.skeletonRow]}>
          {[0, 1, 2, 3, 4].map(item => (
            <SkeletonBlock key={item} style={styles.skeletonThumb} />
          ))}
        </View>
      </View>
      <View style={[styles.block, styles.infoBlock]}>
        <View style={styles.titleRow}>
          <View style={[styles.flex, styles.skeletonStack]}>
            <SkeletonBlock style={styles.skeletonLineNarrow} />
            <SkeletonBlock style={styles.skeletonLineWide} />
            <SkeletonBlock style={styles.skeletonLineMedium} />
          </View>
          <SkeletonBlock style={styles.skeletonPill} />
        </View>
        <View style={styles.divider} />
        <View style={styles.skeletonStack}>
          <SkeletonBlock style={styles.skeletonPriceLine} />
          <SkeletonBlock style={styles.skeletonLineShort} />
        </View>
        <SkeletonBlock style={styles.skeletonLineTiny} />
      </View>
      <View style={styles.block}>
        <SkeletonBlock style={styles.skeletonHeading} />
        <SkeletonBlock style={styles.skeletonInput} />
      </View>
      <View style={styles.block}>
        <SkeletonBlock style={styles.skeletonHeading} />
        <View style={styles.skeletonStack}>
          <SkeletonBlock style={styles.skeletonLineFull} />
          <SkeletonBlock style={styles.skeletonLineFull} />
          <SkeletonBlock style={styles.skeletonLineMedium} />
        </View>
      </View>
    </View>
  );
}

/** Horizontal shelf of related products (also-like / recently viewed), matching the web PDP's rail sections. Renders nothing once loaded with no items. */
function ProductRail({
  title,
  subtitle,
  pending,
  items,
}: {
  title: string;
  subtitle: string;
  pending: boolean;
  items: Product[];
}) {
  if (!pending && items.length === 0) {
    return null;
  }
  return (
    <View style={[styles.block, styles.railBlock]}>
      <View style={styles.railHead}>
        <AppText accessibilityRole="header" style={styles.blockTitle}>
          {title}
        </AppText>
        <AppText style={styles.railSubtitle}>{subtitle}</AppText>
      </View>
      {pending ? (
        <View style={[styles.railRow, styles.skeletonRow]}>
          {[0, 1, 2].map(item => (
            <View key={item} style={styles.railCard}>
              <SkeletonBlock style={styles.railSkeletonImage} />
              <SkeletonBlock style={styles.skeletonLineWide} />
              <SkeletonBlock style={styles.skeletonLineMedium} />
            </View>
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.railRow}
        >
          {items.map(item => (
            <View key={item.key} style={styles.railCard}>
              <ProductCard product={item} />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

/** Average score plus a per-star breakdown. The breakdown only shows when
 * every review is loaded, so the bars never misrepresent the total. */
function RatingSummary({
  rating,
  total,
  reviews,
}: {
  rating: number;
  total: number;
  reviews: Review[];
}) {
  const complete = reviews.length > 0 && reviews.length >= total;
  const counts = [5, 4, 3, 2, 1].map(
    star => reviews.filter(r => Math.round(r.rating) === star).length,
  );
  return (
    <View style={styles.summary}>
      <View
        style={styles.summaryScore}
        accessible
        accessibilityLabel={`Rated ${rating.toFixed(
          1,
        )} out of 5 from ${total} review${total === 1 ? '' : 's'}`}
      >
        <View style={styles.summaryScoreRow}>
          <AppText style={styles.summaryValue}>{rating.toFixed(1)}</AppText>
          <Ionicons name="star" size={20} color={STAR} />
        </View>
        <StarRating value={rating} size={13} />
        <AppText style={styles.summaryCount}>
          {total} review{total === 1 ? '' : 's'}
        </AppText>
      </View>
      {complete && (
        <View style={styles.bars}>
          {counts.map((n, i) => (
            <View key={5 - i} style={styles.barRow}>
              <AppText style={styles.barLabel}>{5 - i}</AppText>
              <Ionicons name="star" size={10} color={theme.colors.secondary} />
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(n / reviews.length) * 100}%` },
                    5 - i <= 2 && styles.barFillLow,
                  ]}
                />
              </View>
              <AppText style={styles.barCount}>{n}</AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ReviewCard({
  review,
  onOpenPhoto,
}: {
  review: Review;
  onOpenPhoto: (index: number) => void;
}) {
  const date = reviewDate(review.createdAt);
  return (
    <View style={styles.review}>
      <View style={styles.reviewHead}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: avatarColor(review.userName) },
          ]}
        >
          <AppText style={styles.avatarText}>
            {initials(review.userName)}
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText numberOfLines={1} style={styles.reviewName}>
            {review.userName}
          </AppText>
          <View style={styles.reviewMeta}>
            <View
              style={[
                styles.ratingPill,
                review.rating <= 2 && styles.ratingPillLow,
              ]}
              accessible
              accessibilityLabel={`${review.rating} out of 5 stars`}
            >
              <AppText style={styles.ratingPillText}>{review.rating}</AppText>
              <Ionicons name="star" size={10} color="#FFFFFF" />
            </View>
            {!!date && <AppText style={styles.reviewDate}>{date}</AppText>}
          </View>
        </View>
      </View>
      {!!review.description && (
        <AppText style={styles.reviewText}>{review.description}</AppText>
      )}
      {review.media.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.reviewMediaRow}
        >
          {review.media.map((uri, index) => (
            <Pressable
              key={uri + index}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Open photo ${index + 1} from ${
                review.userName
              }`}
              onPress={() => onOpenPhoto(index)}
            >
              <Image source={{ uri }} style={styles.reviewMediaThumb} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export default function ProductDetailScreen() {
  const route = useLocalSearchParams<{ slug: string; variation_id?: string }>();
  const slug = first(route.slug);
  const routeVariationId = first(route.variation_id);
  const product = useProductDetail(slug, routeVariationId || undefined);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [seeded, setSeeded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [viewer, setViewer] = useState<ViewerState | null>(null);
  const [postcode, setPostcode] = useState('');
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [allSpecs, setAllSpecs] = useState(false);
  const [allReviews, setAllReviews] = useState(false);
  const [writing, setWriting] = useState(false);
  const [reviewsY, setReviewsY] = useState(0);
  const delivery = useDeliveryCheck();
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const pageRef = useRef<ScrollView>(null);
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

  const variation = data
    ? matchVariation(data.variations, selected)
    : undefined;
  const requiresVariation = !!data && data.attributes.length > 0;
  const resolved = requiresVariation ? variation : undefined;
  const images =
    (resolved?.images.length ? resolved.images : data?.images) ?? [];
  const price = resolved ? resolved.price : data?.price ?? null;
  const regularPrice = resolved
    ? resolved.regularPrice
    : data?.regularPrice ?? null;
  const stockQuantity = resolved
    ? resolved.stockQuantity
    : data?.stockQuantity ?? null;
  const askForPrice = resolved
    ? resolved.askForPrice
    : data?.askForPrice ?? false;
  const inStock = stockQuantity === null || stockQuantity > 0;
  const lowStock =
    stockQuantity !== null && stockQuantity > 0 && stockQuantity <= LOW_STOCK;
  const canBuy = !requiresVariation || !!variation;
  const hasDiscount =
    !askForPrice &&
    regularPrice !== null &&
    price !== null &&
    regularPrice > price;
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
  const alsoLike = useAlsoLike(slug);
  const recentIds = useRecentlyViewed(s => s.ids).filter(id => id !== data?.id);
  const recentOrder = useMemo(
    () => new Map(recentIds.map((id, index) => [id, index])),
    [recentIds],
  );
  const recentProducts = useRecentProducts(recentIds);
  const recentItems = uniqueProducts(recentProducts.data?.items ?? [])
    .filter(item => recentOrder.has(item.id))
    .sort(
      (a, b) => (recentOrder.get(a.id) ?? 0) - (recentOrder.get(b.id) ?? 0),
    );
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
    return (
      currentQty >= tier.minQuantity && (!next || currentQty < next.minQuantity)
    );
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
    const result = addToCompare({
      productId: data.id,
      categoryId: data.categories[0]?.id,
    });
    setCompareError(
      result.ok ? '' : result.message ?? 'Unable to add to comparison.',
    );
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

  const buyNowMutation = useCartMutation(true);
  const onBuyNow = () => {
    if (!data) {
      return;
    }
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    buyNowMutation.mutate(
      { productId: data.id, variationId: resolved?.id, quantity: currentQty },
      {
        onSuccess: () =>
          router.push({
            pathname: '/checkout',
            params: { buyNow: '1' },
          }),
      },
    );
  };

  const onShare = async () => {
    if (!buyUrl || !data) {
      return;
    }
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { title: data.name, url: buyUrl }
          : { title: data.name, message: `${data.name}\n${buyUrl}` },
      );
    } catch {
      // User dismissed the share sheet — nothing to surface.
    }
  };

  const onHeroScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / winWidth);
    setActiveImage(index);
  };

  const goToImage = (index: number, animated = true) => {
    setActiveImage(index);
    heroScrollRef.current?.scrollTo({ x: index * winWidth, animated });
  };

  const closeViewer = (index: number) => {
    if (viewer?.fromGallery && index !== activeImage) {
      goToImage(index, false);
    }
    setViewer(null);
  };

  const scrollToReviews = () =>
    pageRef.current?.scrollTo({ y: Math.max(0, reviewsY - 8), animated: true });

  const onWriteReview = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    submitRating.reset();
    setWriting(w => !w);
  };

  const submitReview = () =>
    submitRating.mutate(
      { rating: myRating, description: myReview.trim(), images: myImages },
      {
        onSuccess: () => {
          setMyRating(0);
          setMyReview('');
          setMyImages([]);
          setWriting(false);
        },
      },
    );

  const reviewList = reviews.data ?? [];
  const visibleReviews = allReviews
    ? reviewList
    : reviewList.slice(0, REVIEW_PREVIEW);
  const specList = specs.data ?? [];
  const visibleSpecs = allSpecs ? specList : specList.slice(0, SPEC_PREVIEW);
  const description = data?.description ? plainText(data.description) : '';
  const longDescription =
    description.length > 280 || description.split('\n').length > 6;
  const galleryImages = images.filter((uri): uri is string => !!uri);

  return (
    <View style={[shop.page, styles.page]}>
      <ShopHeader title={data?.name || 'Product'} back />
      <ScrollView
        ref={pageRef}
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
          skeleton={<ProductDetailSkeleton />}
        />
        {data && (
          <>
            <View style={styles.heroBlock}>
              <View>
                <ScrollView
                  ref={heroScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={onHeroScrollEnd}
                >
                  {(images.length ? images : [undefined]).map((uri, index) => (
                    <Pressable
                      key={(uri ?? 'placeholder') + index}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={`${data.name} photo ${
                        index + 1
                      }. Open full screen`}
                      disabled={!uri}
                      onPress={() =>
                        setViewer({
                          images: galleryImages,
                          index: Math.max(0, galleryImages.indexOf(uri!)),
                          title: data.name,
                          fromGallery: true,
                        })
                      }
                    >
                      <StoreImage
                        uri={uri}
                        label=""
                        style={[styles.hero, { width: winWidth }]}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
                {hasDiscount && (
                  <View style={styles.heroDiscountBadge} pointerEvents="none">
                    <AppText style={styles.heroDiscountText}>
                      {discountPercent}% OFF
                    </AppText>
                  </View>
                )}
                <View style={styles.heroActions}>
                  <View style={styles.heroAction}>
                    <WishlistHeart
                      overlay={false}
                      product={{
                        id: data.id,
                        variationId: resolved?.id,
                        inWishlist: data.inWishlist,
                        name: data.name,
                      }}
                      size={21}
                    />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Share ${data.name}`}
                    onPress={onShare}
                    style={({ pressed }) => [
                      styles.heroAction,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={19}
                      color={theme.colors.text}
                    />
                  </Pressable>
                </View>
                {images.length > 1 && (
                  <View style={styles.dotsRow} pointerEvents="none">
                    {images.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.dot,
                          index === activeImage && styles.dotActive,
                        ]}
                      />
                    ))}
                  </View>
                )}
                {galleryImages.length > 0 && (
                  <View style={styles.expandHint} pointerEvents="none">
                    <Ionicons name="expand-outline" size={13} color="#FFFFFF" />
                    {images.length > 1 && (
                      <AppText style={styles.expandHintText}>
                        {activeImage + 1}/{images.length}
                      </AppText>
                    )}
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
                      style={[
                        styles.thumb,
                        index === activeImage && styles.thumbActive,
                      ]}
                    >
                      <StoreImage
                        uri={uri}
                        label=""
                        style={styles.thumbImage}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={[styles.block, styles.infoBlock]}>
              <View style={styles.titleRow}>
                <View style={styles.flex}>
                  {!!data.categories[0] && (
                    <AppText style={styles.category}>
                      {data.categories[0].name}
                    </AppText>
                  )}
                  <AppText accessibilityRole="header" style={styles.title}>
                    {data.name}
                  </AppText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    compared
                      ? `Remove ${data.name} from comparison`
                      : `Compare ${data.name}`
                  }
                  accessibilityState={{ selected: compared }}
                  onPress={toggleCompare}
                  style={({ pressed }) => [
                    styles.compareButton,
                    compared && styles.compareButtonOn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name={compared ? 'checkmark' : 'git-compare-outline'}
                    size={15}
                    color={compared ? '#FFFFFF' : theme.colors.primary}
                  />
                  <AppText
                    style={[
                      styles.compareText,
                      compared && styles.compareTextOn,
                    ]}
                  >
                    {compared ? 'Added' : 'Compare'}
                  </AppText>
                </Pressable>
              </View>
              {!!compareError && (
                <AppText style={styles.errorText}>{compareError}</AppText>
              )}

              {data.rating !== null && data.rating > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Rated ${data.rating.toFixed(
                    1,
                  )} out of 5, ${data.totalReviews} reviews. Go to reviews`}
                  onPress={scrollToReviews}
                  style={styles.ratingRow}
                >
                  <View style={styles.ratingPill}>
                    <AppText style={styles.ratingPillText}>
                      {data.rating.toFixed(1)}
                    </AppText>
                    <Ionicons name="star" size={11} color="#FFFFFF" />
                  </View>
                  <AppText style={styles.ratingLink}>
                    {data.totalReviews} review
                    {data.totalReviews === 1 ? '' : 's'}
                  </AppText>
                </Pressable>
              )}

              <View style={styles.divider} />

              {askForPrice ? (
                <AppText style={styles.askPrice}>
                  Contact us for pricing
                </AppText>
              ) : (
                <View>
                  <View style={styles.priceRow}>
                    {hasDiscount && (
                      <AppText style={styles.discountPercent}>
                        ↓{discountPercent}%
                      </AppText>
                    )}
                    <AppText style={styles.price}>
                      {price === null ? 'Price unavailable' : money(price)}
                    </AppText>
                  </View>
                  {hasDiscount && (
                    <View style={styles.mrpRow}>
                      <AppText style={styles.mrpLabel}>M.R.P.</AppText>
                      <AppText style={styles.mrp}>
                        {money(regularPrice!)}
                      </AppText>
                      <View style={styles.savePill}>
                        <AppText style={styles.saveText}>
                          Save {money(regularPrice! - price!)}
                        </AppText>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {!canBuy ? (
                <View style={styles.stockRow}>
                  <Ionicons
                    name="options-outline"
                    size={15}
                    color={theme.colors.secondary}
                  />
                  <AppText style={styles.stockMuted}>
                    Select all options to check availability
                  </AppText>
                </View>
              ) : (
                <View style={styles.stockRow}>
                  <View
                    style={[
                      styles.stockDot,
                      !inStock
                        ? styles.stockDotOut
                        : lowStock
                        ? styles.stockDotLow
                        : styles.stockDotIn,
                    ]}
                  />
                  <AppText
                    style={
                      !inStock
                        ? styles.stockOut
                        : lowStock
                        ? styles.stockLow
                        : styles.stockIn
                    }
                  >
                    {!inStock
                      ? 'Out of stock'
                      : lowStock
                      ? `Only ${stockQuantity} left — order soon`
                      : 'In stock'}
                  </AppText>
                  {!!data.sku && (
                    <AppText style={styles.sku}>SKU {data.sku}</AppText>
                  )}
                </View>
              )}
            </View>

            {!askForPrice && quantityDiscounts.length > 0 && (
              <Block title="Buy more, save more">
                <AppText style={styles.blockHint}>
                  Discount applies to every item in the order
                </AppText>
                <QuantityDiscountList
                  tiers={quantityDiscounts}
                  activeIndex={activeDiscountTierIndex}
                />
              </Block>
            )}

            {data.attributes.length > 0 && (
              <View style={styles.block}>
                {data.attributes.map(attribute => {
                  const picked = attribute.values.find(
                    v => v.id === selected[attribute.id],
                  );
                  return (
                    <View key={attribute.id} style={styles.attribute}>
                      <AppText style={styles.attributeTitle}>
                        {attribute.name}
                        {picked ? (
                          <AppText style={styles.attributeValue}>
                            {'  '}
                            {picked.name}
                          </AppText>
                        ) : (
                          <AppText style={styles.attributeMissing}>
                            {'  '}Select one
                          </AppText>
                        )}
                      </AppText>
                      <View style={styles.wrap}>
                        {attribute.values.map(value => (
                          <Chip
                            key={value.id}
                            label={value.name}
                            selected={selected[attribute.id] === value.id}
                            onPress={() =>
                              setSelected(current => ({
                                ...current,
                                [attribute.id]: value.id,
                              }))
                            }
                          />
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <Block title="Delivery">
              <View style={styles.pincodeBox}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <TextInput
                  accessibilityLabel="Delivery pincode"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={postcode}
                  onChangeText={text => {
                    setPostcode(text.replace(/\D/g, ''));
                    if (delivery.data || delivery.isError) {
                      delivery.reset();
                    }
                  }}
                  placeholder="Enter delivery pincode"
                  placeholderTextColor="#9CA3AF"
                  autoComplete="postal-code"
                  textContentType="postalCode"
                  returnKeyType="done"
                  style={styles.pincodeInput}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: postcode.length < 6 || delivery.isPending,
                  }}
                  disabled={postcode.length < 6 || delivery.isPending}
                  onPress={() => {
                    delivery.mutate({
                      postcode,
                      productId: data.id,
                      variationId: resolved?.id,
                    });
                  }}
                  hitSlop={8}
                  style={styles.pincodeAction}
                >
                  {delivery.isPending ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.primary}
                    />
                  ) : (
                    <AppText
                      style={[
                        styles.pincodeActionText,
                        postcode.length < 6 && styles.pincodeActionDisabled,
                      ]}
                    >
                      Check
                    </AppText>
                  )}
                </Pressable>
              </View>
              {delivery.data &&
                (delivery.data.isAvailable ? (
                  <View style={styles.deliveryResult}>
                    <View style={[styles.deliveryIcon, styles.deliveryIconOk]}>
                      <Ionicons name="car-outline" size={16} color={GREEN} />
                    </View>
                    <View style={styles.flex}>
                      <AppText style={styles.deliveryTitle}>
                        Delivery by {delivery.data.deliveryDisplay || 'soon'}
                      </AppText>
                      <AppText style={styles.deliverySub}>
                        {delivery.data.shippingAmount === 0 ||
                        delivery.data.shippingAmount === null
                          ? 'Free delivery'
                          : `Shipping ${money(delivery.data.shippingAmount)}`}
                        {' · '}to {postcode}
                      </AppText>
                    </View>
                  </View>
                ) : (
                  <View style={styles.deliveryResult}>
                    <View style={[styles.deliveryIcon, styles.deliveryIconBad]}>
                      <Ionicons
                        name="close"
                        size={16}
                        color={theme.colors.danger}
                      />
                    </View>
                    <View style={styles.flex}>
                      <AppText style={styles.deliveryTitle}>
                        Not deliverable to {postcode}
                      </AppText>
                      <AppText style={styles.deliverySub}>
                        Try a different pincode.
                      </AppText>
                    </View>
                  </View>
                ))}
              {delivery.isError && (
                <AppText style={styles.errorText}>
                  {delivery.error.message}
                </AppText>
              )}
            </Block>

            {!!description && (
              <Block title="Description">
                <AppText
                  style={styles.description}
                  numberOfLines={
                    descriptionOpen || !longDescription
                      ? undefined
                      : DESCRIPTION_PREVIEW_LINES
                  }
                >
                  {description}
                </AppText>
                {longDescription && (
                  <TextToggle
                    expanded={descriptionOpen}
                    onPress={() => setDescriptionOpen(o => !o)}
                    more="Read more"
                  />
                )}
              </Block>
            )}

            {specList.length > 0 && (
              <Block title="Specifications">
                <View style={styles.specTable}>
                  {visibleSpecs.map((spec, index) => (
                    <View
                      key={spec.id}
                      style={[
                        styles.specRow,
                        index > 0 && styles.specRowDivider,
                      ]}
                    >
                      <AppText style={styles.specLabel}>{spec.label}</AppText>
                      <AppText style={styles.specValue}>{spec.value}</AppText>
                    </View>
                  ))}
                </View>
                {specList.length > SPEC_PREVIEW && (
                  <TextToggle
                    expanded={allSpecs}
                    onPress={() => setAllSpecs(o => !o)}
                    more={`View all ${specList.length} specifications`}
                  />
                )}
              </Block>
            )}

            <Block
              title="Ratings & reviews"
              onLayout={setReviewsY}
              action={
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: writing }}
                  onPress={onWriteReview}
                  style={({ pressed }) => [
                    styles.writeButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name={writing ? 'close' : 'create-outline'}
                    size={15}
                    color={theme.colors.primary}
                  />
                  <AppText style={styles.writeText}>
                    {writing ? 'Cancel' : 'Write a review'}
                  </AppText>
                </Pressable>
              }
            >
              {submitRating.isSuccess && !writing && (
                <View style={styles.thanks} accessibilityRole="alert">
                  <Ionicons name="checkmark-circle" size={18} color={GREEN} />
                  <AppText style={styles.thanksText}>
                    Thanks! Your review has been submitted.
                  </AppText>
                </View>
              )}

              {writing && isAuthenticated && (
                <View style={styles.reviewForm}>
                  <AppText style={styles.formLabel}>
                    How would you rate this product?
                  </AppText>
                  <View style={styles.starPickerRow}>
                    <StarPicker value={myRating} onChange={setMyRating} />
                    {myRating > 0 && (
                      <AppText style={styles.ratingWord}>
                        {RATING_WORDS[myRating]}
                      </AppText>
                    )}
                  </View>
                  <TextInput
                    accessibilityLabel="Your review"
                    value={myReview}
                    onChangeText={setMyReview}
                    placeholder="What did you like or dislike? How did you use it? (optional)"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    style={styles.reviewInput}
                  />
                  <View style={styles.reviewImages}>
                    {myImages.map((image, index) => (
                      <View key={image.uri} style={styles.reviewImageThumbWrap}>
                        <Image
                          source={{ uri: image.uri }}
                          style={styles.reviewImageThumb}
                        />
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Remove photo"
                          onPress={() =>
                            setMyImages(current =>
                              current.filter((_, i) => i !== index),
                            )
                          }
                          hitSlop={6}
                          style={styles.reviewImageRemove}
                        >
                          <Ionicons name="close" size={12} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    ))}
                    {myImages.length < MAX_REVIEW_IMAGES && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Add photos"
                        onPress={pickReviewImages}
                        style={({ pressed }) => [
                          styles.reviewImageAdd,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Ionicons
                          name="camera-outline"
                          size={20}
                          color={theme.colors.primary}
                        />
                        <AppText style={styles.reviewImageAddText}>
                          {myImages.length
                            ? `${myImages.length}/${MAX_REVIEW_IMAGES}`
                            : 'Add photos'}
                        </AppText>
                      </Pressable>
                    )}
                  </View>
                  {submitRating.isError && (
                    <AppText style={styles.errorText}>
                      {submitRating.error.message}
                    </AppText>
                  )}
                  <Button
                    label={
                      submitRating.isPending ? 'Submitting…' : 'Submit review'
                    }
                    disabled={myRating < 1 || submitRating.isPending}
                    onPress={submitReview}
                  />
                </View>
              )}

              {data.rating !== null && data.rating > 0 && (
                <RatingSummary
                  rating={data.rating}
                  total={data.totalReviews}
                  reviews={reviewList}
                />
              )}

              {reviews.isPending && reviews.fetchStatus !== 'idle' && (
                <View style={styles.reviewLoading}>
                  <ActivityIndicator color={theme.colors.primary} />
                </View>
              )}
              {reviews.data && reviewList.length === 0 && !writing && (
                <View style={styles.noReviews}>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={28}
                    color={theme.colors.secondary}
                  />
                  <AppText style={styles.noReviewsTitle}>
                    No reviews yet
                  </AppText>
                  <AppText style={styles.noReviewsText}>
                    Bought this? Be the first to share your experience.
                  </AppText>
                </View>
              )}
              {visibleReviews.map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onOpenPhoto={index =>
                    setViewer({
                      images: review.media,
                      index,
                      title: `Photo by ${review.userName}`,
                      fromGallery: false,
                    })
                  }
                />
              ))}
              {reviewList.length > REVIEW_PREVIEW && (
                <TextToggle
                  expanded={allReviews}
                  onPress={() => setAllReviews(o => !o)}
                  more={`See all ${reviewList.length} reviews`}
                  less="Show fewer reviews"
                />
              )}
            </Block>

            <ProductRail
              title="You may also like"
              subtitle="Frequently bought together with this product"
              pending={alsoLike.isPending}
              items={alsoLike.data ?? []}
            />
            <ProductRail
              title="Recently viewed"
              subtitle="Pick up where you left off"
              pending={recentIds.length > 0 && recentProducts.isPending}
              items={recentItems}
            />
          </>
        )}
        {!product.isPending && !product.isError && !data && (
          <Feedback
            title="Product unavailable"
            message="This product could not be found."
          />
        )}
      </ScrollView>
      {!data && product.isPending && (
        <View
          style={[
            styles.stickyBar,
            { paddingBottom: Math.max(12, insets.bottom) },
          ]}
        >
          <SkeletonBlock style={styles.skeletonButton} />
          <SkeletonBlock style={styles.skeletonButton} />
        </View>
      )}
      {data && (
        <View
          style={[
            styles.stickyBar,
            { paddingBottom: Math.max(12, insets.bottom) },
          ]}
        >
          {askForPrice ? (
            <View style={styles.flex}>
              <Button
                label="Contact us for pricing"
                onPress={() => buyUrl && openWebsite(buyUrl)}
              />
            </View>
          ) : !canBuy ? (
            <View style={styles.flex}>
              <Button
                label="Select options above"
                disabled
                onPress={() => undefined}
              />
            </View>
          ) : !inStock ? (
            <View style={styles.flex}>
              <Button label="Out of stock" disabled onPress={() => undefined} />
            </View>
          ) : (
            <>
              <AddToCartControl
                product={{
                  id: data.id,
                  variationId: resolved?.id,
                  name: data.name,
                  inStock,
                }}
                variant="full"
                outline
              />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled: buyNowMutation.isPending,
                  busy: buyNowMutation.isPending,
                }}
                disabled={buyNowMutation.isPending}
                onPress={onBuyNow}
                style={({ pressed }) => [
                  styles.buyNow,
                  pressed && styles.pressed,
                ]}
              >
                {buyNowMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="flash" size={18} color="#FFFFFF" />
                )}
                <AppText style={styles.buyNowText}>
                  {buyNowMutation.isPending ? 'Preparing…' : 'Buy now'}
                </AppText>
              </Pressable>
            </>
          )}
        </View>
      )}
      {viewer && (
        <ImageViewer
          images={viewer.images}
          initialIndex={viewer.index}
          title={viewer.title}
          onClose={closeViewer}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  page: { backgroundColor: '#F1F3F6' },
  body: { paddingBottom: 110 },
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.7 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  errorText: { color: theme.colors.danger, fontSize: 13, lineHeight: 18 },

  // Skeleton
  heroSkeletonFrame: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSkeleton: {
    width: '68%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: '#E8EBEF',
  },
  skeletonCircle: { width: 42, height: 42, borderRadius: 21 },
  skeletonThumb: { width: 58, height: 58, borderRadius: 10 },
  skeletonStack: { gap: 10 },
  skeletonPill: { width: 92, height: 32, borderRadius: 16, marginTop: 2 },
  skeletonLineNarrow: { height: 12, width: '35%' },
  skeletonLineWide: { height: 18, width: '92%' },
  skeletonLineMedium: { height: 18, width: '60%' },
  skeletonLineFull: { height: 13, width: '100%' },
  skeletonLineShort: { height: 13, width: '40%' },
  skeletonLineTiny: { height: 12, width: '22%' },
  skeletonPriceLine: { height: 30, width: '42%', borderRadius: 8 },
  skeletonHeading: { height: 18, width: '32%' },
  skeletonInput: { height: 50, width: '100%', borderRadius: 12 },
  skeletonButton: { flex: 1, height: 48, borderRadius: theme.radius.button },
  skeletonRow: { flexDirection: 'row' },

  // Blocks
  block: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  blockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  blockTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 17,
    lineHeight: 24,
    color: theme.colors.text,
  },
  blockHint: {
    marginTop: -8,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.secondary,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 2,
  },
  toggleText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
  },

  // Gallery
  heroBlock: { backgroundColor: '#FFFFFF' },
  hero: { aspectRatio: 1, backgroundColor: '#FFFFFF' },
  heroDiscountBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.colors.danger,
  },
  heroDiscountText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
    lineHeight: 15,
  },
  heroActions: { position: 'absolute', top: 12, right: 12, gap: 10 },
  heroAction: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  dotActive: { backgroundColor: theme.colors.primary, width: 18 },
  expandHint: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 26,
    paddingHorizontal: 9,
    borderRadius: 13,
    backgroundColor: 'rgba(17,24,39,0.55)',
  },
  expandHintText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    fontVariant: ['tabular-nums'],
  },
  thumbRow: { paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    padding: 3,
    backgroundColor: '#FFFFFF',
  },
  thumbActive: { borderColor: theme.colors.primary, borderWidth: 2 },
  thumbImage: { width: '100%', height: '100%', borderRadius: 6 },

  // Title, rating, price
  infoBlock: { marginTop: 0, paddingTop: 4, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  category: {
    color: '#A65C00',
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 2,
  },
  title: {
    fontFamily: theme.fonts.semibold,
    fontSize: 19,
    lineHeight: 27,
    color: theme.colors.text,
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B2DFDB',
    backgroundColor: '#FFFFFF',
  },
  compareButtonOn: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  compareText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  compareTextOn: { color: '#FFFFFF' },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 6,
    backgroundColor: GREEN,
  },
  ratingPillLow: { backgroundColor: '#EA580C' },
  ratingPillText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
  },
  ratingLink: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginVertical: 2,
  },
  askPrice: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 20,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  discountPercent: {
    color: GREEN,
    fontFamily: theme.fonts.semibold,
    fontSize: 22,
    lineHeight: 32,
  },
  price: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    fontSize: 28,
    lineHeight: 36,
  },
  mrpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  mrpLabel: { color: theme.colors.secondary, fontSize: 13 },
  mrp: {
    color: theme.colors.secondary,
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  savePill: {
    marginLeft: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
  },
  saveText: {
    color: GREEN,
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
    lineHeight: 17,
  },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockDotIn: { backgroundColor: GREEN },
  stockDotLow: { backgroundColor: '#D97706' },
  stockDotOut: { backgroundColor: theme.colors.danger },
  stockIn: { color: GREEN, fontFamily: theme.fonts.medium, fontSize: 13 },
  stockLow: { color: '#B45309', fontFamily: theme.fonts.medium, fontSize: 13 },
  stockOut: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
  },
  stockMuted: { color: theme.colors.secondary, fontSize: 13 },
  sku: {
    marginLeft: 'auto',
    color: theme.colors.secondary,
    fontSize: 11,
    lineHeight: 16,
  },

  // Quantity discounts
  tierRow: { gap: 10, paddingRight: 4 },
  tier: {
    minWidth: 118,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFB',
    gap: 2,
  },
  tierActive: {
    borderStyle: 'solid',
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  tierPercent: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
  },
  tierLabel: { fontSize: 12, lineHeight: 17, color: theme.colors.secondary },
  tierInk: { color: theme.colors.primaryDark },
  tierApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
    marginTop: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  tierAppliedText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
  },

  // Variants
  attribute: { gap: 10 },
  attributeTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
    color: theme.colors.text,
  },
  attributeValue: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.secondary,
  },
  attributeMissing: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: '#B45309',
  },

  // Delivery
  pincodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 50,
    paddingLeft: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FAFAFB',
  },
  pincodeInput: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    letterSpacing: 0.5,
    color: theme.colors.text,
  },
  pincodeAction: {
    minWidth: 72,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  pincodeActionText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
  },
  pincodeActionDisabled: { color: '#9CA3AF' },
  deliveryResult: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deliveryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryIconOk: { backgroundColor: '#DCFCE7' },
  deliveryIconBad: { backgroundColor: '#FEE2E2' },
  deliveryTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  deliverySub: { fontSize: 12, lineHeight: 17, color: theme.colors.secondary },

  // Description & specs
  description: { fontSize: 14, lineHeight: 22, color: '#374151' },
  specTable: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  specRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  specLabel: {
    flex: 2,
    color: theme.colors.secondary,
    fontSize: 13,
    lineHeight: 19,
  },
  specValue: {
    flex: 3,
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    lineHeight: 19,
  },

  // Reviews
  writeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  writeText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  thanks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
  },
  thanksText: { flex: 1, color: GREEN, fontSize: 13, lineHeight: 18 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFB',
  },
  summaryScore: { alignItems: 'center', gap: 3, minWidth: 92 },
  summaryScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 32,
    lineHeight: 40,
    color: theme.colors.text,
  },
  summaryCount: { fontSize: 12, color: theme.colors.secondary, marginTop: 2 },
  bars: { flex: 1, gap: 5 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  barLabel: {
    width: 10,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.secondary,
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 6,
    marginHorizontal: 4,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  barFill: { height: 6, borderRadius: 3, backgroundColor: GREEN },
  barFillLow: { backgroundColor: '#EA580C' },
  barCount: {
    minWidth: 16,
    fontSize: 11,
    color: theme.colors.secondary,
    fontVariant: ['tabular-nums'],
  },
  reviewLoading: { paddingVertical: 12, alignItems: 'center' },
  noReviews: { alignItems: 'center', gap: 4, paddingVertical: 16 },
  noReviewsTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
    color: theme.colors.text,
    marginTop: 4,
  },
  noReviewsText: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  review: {
    gap: 8,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  reviewName: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    lineHeight: 19,
    color: theme.colors.text,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  reviewDate: { fontSize: 12, color: theme.colors.secondary },
  reviewText: { fontSize: 14, lineHeight: 21, color: '#374151' },
  reviewMediaRow: { gap: 8 },
  reviewMediaThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#F0F1F3',
  },
  reviewForm: {
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#B2DFDB',
    backgroundColor: '#F4FBFA',
  },
  formLabel: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    color: theme.colors.text,
  },
  starPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  starPicker: { flexDirection: 'row', gap: 6 },
  ratingWord: {
    color: theme.colors.primaryDark,
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
  },
  reviewInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    padding: 12,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    color: theme.colors.text,
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
  },
  reviewImages: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reviewImageThumbWrap: { width: 64, height: 64 },
  reviewImageThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#F0F1F3',
  },
  reviewImageRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  reviewImageAdd: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#80CBC4',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: '#FFFFFF',
  },
  reviewImageAddText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    fontSize: 10,
    lineHeight: 13,
  },

  // Rails
  railBlock: { paddingHorizontal: 0, gap: 14 },
  railHead: { paddingHorizontal: 16, gap: 2 },
  railSubtitle: { fontSize: 12, lineHeight: 17, color: theme.colors.secondary },
  railRow: { paddingHorizontal: 16, gap: 12 },
  railCard: { width: 158, gap: 6 },
  railSkeletonImage: { width: '100%', aspectRatio: 1.15, borderRadius: 12 },

  // Bottom bar
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
  },
  buyNow: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 48,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.primary,
  },
  buyNowText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
});
