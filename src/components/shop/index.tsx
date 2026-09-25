import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { AppText } from '../ui';
import { theme } from '../../theme';
import type { Category, Product } from '../../api/discovery';
import { useToggleWishlist } from '../../features/wishlist/hooks';
import { useCart, useCartMutation } from '../../features/cart/hooks';

export const shop = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  searchLabel: { flex: 1, color: theme.colors.secondary },
  header: { backgroundColor: '#FFFFFF' },
  // Keeps the header's shadow drawn above the feed that follows it. iOS only:
  // on Android, zIndex on a child whose parent later gains/loses a child
  // (e.g. a BottomSheet Modal mounting next to it) crashes with
  // "getChildDrawingOrder() returned invalid index"; the hairline divider
  // still marks the sticky edge there.
  headerRaised: Platform.OS === 'ios' ? { zIndex: 2 } : {},
  headerShadow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 0.12,
    elevation: 6,
  },
  headerInnerHome: { paddingBottom: 8, gap: 0 },
  homeSearchPanel: {
    backgroundColor: '#EEFFFD',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  homeSearch: {
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    shadowOpacity: 0.06,
    elevation: 1,
  },
  homeSearchPressed: { opacity: 0.85 },
  headerInner: {
    backgroundColor: '#EEFFFD',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  logo: { width: 130, height: 38, resizeMode: 'contain' },
  title: {
    fontFamily: theme.fonts.regular,
    fontSize: 17,
    color: theme.colors.primary,
    flex: 1,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconPressed: { opacity: 0.55 },
  iconBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.danger,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  iconBadgeText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 10,
    lineHeight: 12,
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
  deliveryRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  deliveryText: {
    flex: 1,
    color: theme.colors.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 12,
  },
  padded: { padding: 16, gap: 16 },
  heading: { fontFamily: theme.fonts.semibold, fontSize: 18, lineHeight: 26 },
  muted: { color: theme.colors.secondary, fontSize: 13, lineHeight: 20 },
  link: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  chipLabel: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
  },
  selected: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  chipDisabled: {
    opacity: 0.5,
    backgroundColor: '#F5F6F8',
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
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 6,
  },
  priceRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingChipText: {
    color: theme.colors.secondary,
    fontFamily: theme.fonts.medium,
    fontSize: 11,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1.15,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F1F3',
  },
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
  cartAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 30,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  cartAddButtonText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
  },
  cartStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 30,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  cartStepperButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  cartStepperQty: {
    minWidth: 14,
    textAlign: 'center',
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
  },
  cartAddButtonFull: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 48,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.primary,
  },
  cartAddButtonFullText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.medium,
    fontSize: 15,
  },
  cartStepperFull: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.primary,
  },
  cartStepperFullButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  cartStepperFullQty: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 16,
    lineHeight: 20,
  },
  cartStepperFullCenter: { alignItems: 'center' },
  cartStepperFullHint: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
    opacity: 0.8,
  },
  cartFullOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  cartFullOutlineText: { color: theme.colors.primary },
  cartStepperOutlineButton: { backgroundColor: theme.colors.primaryLight },
  cartQuantityControl: {
    width: 97,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#006F65',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  cartQuantityButton: {
    width: 25,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartQuantityValue: {
    minWidth: 25,
    height: 25,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#00796A',
    fontFamily: theme.fonts.medium,
    fontSize: 12,
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
  productPressed: { opacity: 0.93, transform: [{ scale: 0.985 }] },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: theme.colors.danger,
  },
  discountText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 11,
    lineHeight: 13,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  // zIndex on iOS only — see headerRaised. Android stacks it via the
  // elevation ScrollShadow animates.
  stickyBar: {
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'ios' ? { zIndex: 1 } : {}),
  },
  skeletonBlock: { borderRadius: 6, backgroundColor: '#D6DAE0' },
  skeletonImage: { backgroundColor: '#D6DAE0' },
  skeletonLineNarrow: { height: 11, width: '35%', marginTop: 2 },
  skeletonCategoryLine: {
    height: 13,
    width: '60%',
    marginTop: 2,
    alignSelf: 'center',
  },
  skeletonLineWide: { height: 13, width: '92%' },
  skeletonLineMedium: { height: 13, width: '55%' },
  // No side padding: every grid that shows this already pads its content.
  skeletonGrid: { gap: 12, paddingBottom: 24 },
  skeletonCount: { height: 13, width: 96, marginBottom: 4 },
  skeletonCardImage: { backgroundColor: '#E8EBEF' },
  skeletonCardCategory: { height: 10, width: '45%', marginTop: 4 },
  skeletonCardName: { gap: 7, minHeight: 40, paddingTop: 2 },
  skeletonCardPrice: { height: 16, width: '50%' },
  skeletonCardRating: { height: 14, width: 30 },
  skeletonCardButton: { height: 30, borderRadius: 8, marginTop: 2 },
  skeletonRow: { flexDirection: 'row', gap: 10 },
  skeletonTile: { flex: 1, maxWidth: '50%' },
  skeletonSummaryCard: {
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  skeletonSummaryLabel: { height: 12, width: '38%' },
  skeletonSummaryValue: { height: 12, width: '20%' },
  skeletonCart: { paddingHorizontal: 16, paddingTop: 38, gap: 15 },
  skeletonCartCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 8,
    minHeight: 144,
    borderWidth: 1,
    borderColor: '#DCE2EC',
    borderRadius: 8,
  },
  skeletonCartImage: { width: 124, height: 124, borderRadius: 11 },
  skeletonCartInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  skeletonCheckout: { padding: 16, gap: 12 },
  skeletonCheckoutSection: {
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
  },
  skeletonCheckoutItemRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  skeletonCheckoutItemImage: { width: 52, height: 52, borderRadius: 8 },
  // Order skeletons: no outer padding — the list / screen body already pads.
  skeletonOrderList: { gap: 12 },
  skeletonOrderCard: {
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  skeletonOrderHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  skeletonOrderIcon: { width: 38, height: 38, borderRadius: 12 },
  skeletonOrderHeadText: { flex: 1, gap: 8, paddingTop: 2 },
  skeletonOrderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skeletonOrderNumber: { height: 14, width: '42%' },
  skeletonOrderPill: { height: 18, width: 72, borderRadius: 9 },
  skeletonOrderDate: { height: 11, width: '55%' },
  skeletonOrderFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  skeletonOrderFooterLeft: { gap: 6 },
  skeletonOrderFooterRight: { gap: 6, alignItems: 'flex-end' },
  skeletonOrderLabel: { height: 9, width: 64 },
  skeletonOrderTotal: { height: 16, width: 84 },
  skeletonOrderMetaShort: { height: 10, width: 44 },
  skeletonOrderMeta: { height: 10, width: 88 },
  skeletonOrderDetail: { gap: 16 },
  skeletonOrderDetailCard: {
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    backgroundColor: '#FFFFFF',
  },
  skeletonPillRow: { flexDirection: 'row', gap: 8 },
  skeletonStatusPill: { height: 22, width: 92, borderRadius: 11 },
  skeletonPaymentPill: { height: 22, width: 64, borderRadius: 11 },
  skeletonDetailMeta: { height: 12, width: '72%' },
  skeletonDetailLink: { height: 14, width: '40%' },
  skeletonDetailEyebrow: { height: 11, width: '32%' },
  skeletonDetailHeadline: { height: 18, width: '68%' },
  skeletonDetailHeading: { height: 16, width: '30%' },
  skeletonDetailCta: { height: 44, borderRadius: 10 },
  skeletonStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  skeletonStepDot: { width: 18, height: 18, borderRadius: 9 },
  skeletonStepLine: {
    flex: 1,
    height: 3,
    marginHorizontal: 4,
    borderRadius: 2,
  },
  skeletonItemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  skeletonItemImage: { width: 56, height: 56, borderRadius: 8 },
  skeletonItemText: { flex: 1, gap: 7 },
  skeletonItemQty: { height: 11, width: '28%' },
  skeletonItemPrice: { height: 12, width: '45%' },
  skeletonItemTotal: { height: 14, width: 52 },
  skeletonSummaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  skeletonSummaryTotalLabel: { height: 15, width: '30%' },
  skeletonSummaryTotalValue: { height: 15, width: '24%' },
  skeletonDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
  },
  skeletonTimelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  skeletonTimelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 2 },
  sheetContainer: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  sheetBackdropTouchable: { flex: 1 },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
    marginTop: 10,
    marginBottom: 2,
  },
  sheetHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 },
  sheetFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
export function IconButton({
  name,
  label,
  onPress,
  badge,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  /** Item count shown as a small overlay badge (e.g. cart/wishlist size); omitted when 0 or unset. */
  badge?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label} (${badge})` : label}
      onPress={onPress}
      hitSlop={4}
      android_ripple={{
        color: theme.colors.primaryLight,
        radius: 24,
        borderless: true,
      }}
      style={({ pressed }) => [shop.icon, pressed && shop.iconPressed]}
    >
      <Ionicons name={name} size={24} color={theme.colors.primary} />
      {!!badge && badge > 0 && (
        <View style={shop.iconBadge}>
          <AppText style={shop.iconBadgeText}>
            {badge > 99 ? '99+' : badge}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
/** Scroll offset (px) over which the home top bar fades its compact search
 * icon and shadow in — roughly the point the in-feed search bar scrolls away. */
const HEADER_SEARCH_REVEAL = [28, 72];

export function ShopHeader({
  title,
  search = false,
  back = false,
  deliveryLabel,
  scrollY,
}: {
  title?: string;
  /** Home variant: large logo; pair with <HomeSearchPanel> as the first item
   * of the scrolling feed, and pass `scrollY` so the compact search icon and
   * shadow appear once that panel scrolls away. */
  search?: boolean;
  back?: boolean;
  deliveryLabel?: string;
  /** Scroll offset driven by a native-driver Animated.event. Only opacity and
   * transform are animated from it, never layout — resizing the header while
   * the list scrolls made the list resize too and the two fed back into each
   * other (visible shaking at the sticky point). */
  scrollY?: Animated.Value;
}) {
  const { width } = useWindowDimensions();
  const scale = Math.min(width / 440, 1.2);
  const cart = useCart();
  const cartCount =
    cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  // Without a scroll source the home icon is always visible and the shadow
  // stays off, matching the old resting state of non-scrolling screens.
  const reveal = scrollY
    ? scrollY.interpolate({
        inputRange: HEADER_SEARCH_REVEAL.map(v => v * scale),
        outputRange: [0, 1],
        extrapolate: 'clamp',
      })
    : null;
  return (
    <SafeAreaView edges={['top']} style={[shop.header, shop.headerRaised]}>
      {reveal && (
        <Animated.View
          pointerEvents="none"
          style={[shop.headerShadow, { opacity: reveal }]}
        />
      )}
      <View
        style={[
          shop.headerInner,
          search && [shop.headerInnerHome, { paddingTop: 12 * scale }],
        ]}
      >
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
            <AppText
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[shop.title, shop.flex]}
            >
              {title}
            </AppText>
          ) : (
            <View style={shop.flex}>
              <Image
                source={
                  search
                    ? require('../../assets/images/HomeLogo.png')
                    : require('../../assets/images/Logo.png')
                }
                accessibilityLabel="Elexify"
                style={
                  search
                    ? {
                        width: 136 * scale,
                        height: 38 * scale,
                        resizeMode: 'contain',
                      }
                    : shop.logo
                }
              />
            </View>
          )}
          {search && reveal ? (
            <Animated.View
              style={{
                opacity: reveal,
                transform: [
                  {
                    scale: reveal.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.75, 1],
                    }),
                  },
                ],
              }}
            >
              <IconButton
                name="search-outline"
                label="Search products"
                onPress={() => router.push('/search')}
              />
            </Animated.View>
          ) : (
            <IconButton
              name="search-outline"
              label="Search products"
              onPress={() => router.push('/search')}
            />
          )}
          <IconButton
            name={search ? 'cart-outline' : 'bag-outline'}
            label="Open cart"
            badge={cartCount}
            onPress={() => router.push('/cart')}
          />
        </View>
        {!search && !!deliveryLabel && (
          <DeliveryRow label={deliveryLabel} scale={scale} />
        )}
      </View>
    </SafeAreaView>
  );
}

function DeliveryRow({
  label,
  scale,
  style,
}: {
  label: string;
  scale: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Delivery address: ${label}. Manage addresses`}
      onPress={() => router.push('/addresses')}
      hitSlop={7}
      style={[shop.deliveryRow, { minHeight: 30 * scale }, style]}
    >
      <Ionicons
        name="location-outline"
        size={19}
        color={theme.colors.secondary}
      />
      <AppText numberOfLines={1} style={shop.deliveryText}>
        {label}
      </AppText>
      <Ionicons name="chevron-down" size={16} color={theme.colors.secondary} />
    </Pressable>
  );
}

/** Home search bar + delivery address. Render it as the first item of the
 * home feed so it scrolls away natively — no animated layout, no jitter. */
export function HomeSearchPanel({ deliveryLabel }: { deliveryLabel?: string }) {
  const { width } = useWindowDimensions();
  const scale = Math.min(width / 440, 1.2);
  return (
    <View style={[shop.homeSearchPanel, { paddingBottom: 12 * scale }]}>
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search products"
        onPress={() => router.push('/search')}
        android_ripple={{ color: theme.colors.primaryLight }}
        style={({ pressed }) => [
          shop.search,
          shop.homeSearch,
          { minHeight: 55 * scale, borderRadius: 14 * scale },
          pressed && shop.homeSearchPressed,
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={theme.colors.primary}
        />
        <AppText style={shop.searchLabel}>Search products, brands…</AppText>
      </Pressable>
      {!!deliveryLabel && (
        <DeliveryRow
          label={deliveryLabel}
          scale={scale}
          style={{ marginTop: 10 * scale }}
        />
      )}
    </View>
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
/** "₹1,150" for whole rupees, "₹354.60" otherwise — never a lone decimal
 * digit like "₹354.6". */
export const money = (value: number) => {
  const fraction = Number.isInteger(Math.round(value * 100) / 100) ? 0 : 2;
  return (
    '₹' +
    value.toLocaleString('en-IN', {
      minimumFractionDigits: fraction,
      maximumFractionDigits: fraction,
    })
  );
};
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
        (active ? 'Remove ' : 'Add ') +
        product.name +
        (active ? ' from wishlist' : ' to wishlist')
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
export function AddToCartControl({
  product,
  variant = 'compact',
  outline = false,
}: {
  product: Pick<Product, 'id' | 'variationId' | 'name' | 'inStock'>;
  /** 'compact' overlays a product image; 'full' is for details; 'cart' fits beside the cart price. */
  variant?: 'compact' | 'full' | 'cart';
  /** 'full' only: outlined, as the secondary action beside a solid "Buy now". */
  outline?: boolean;
}) {
  const cart = useCart();
  const cartItem = cart.data?.items.find(
    item =>
      item.productId === product.id && item.variationId === product.variationId,
  );
  const [qty, setQty] = useState(cartItem?.quantity ?? 0);
  useEffect(() => setQty(cartItem?.quantity ?? 0), [cartItem?.quantity]);
  const mutation = useCartMutation();
  const commit = (next: number) => {
    const previous = qty;
    setQty(next);
    mutation.mutate(
      {
        productId: product.id,
        variationId: product.variationId,
        quantity: next,
      },
      { onError: () => setQty(previous) },
    );
  };
  if (!product.inStock) {
    return null;
  }
  if (variant === 'cart') {
    return (
      <View style={shop.cartQuantityControl}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove one ${product.name} from cart`}
          disabled={mutation.isPending || qty <= 0}
          onPress={() => commit(qty - 1)}
          style={shop.cartQuantityButton}
        >
          <Ionicons name="remove" size={16} color="#FFFFFF" />
        </Pressable>
        <AppText style={shop.cartQuantityValue}>{qty}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add one more ${product.name} to cart`}
          disabled={mutation.isPending}
          onPress={() => commit(qty + 1)}
          style={shop.cartQuantityButton}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  }
  if (variant === 'full') {
    const ink = outline ? theme.colors.primary : '#FFFFFF';
    if (qty <= 0) {
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${product.name} to cart`}
          disabled={mutation.isPending}
          onPress={() => commit(1)}
          style={({ pressed }) => [
            shop.cartAddButtonFull,
            outline && shop.cartFullOutline,
            pressed && shop.iconPressed,
          ]}
        >
          <Ionicons name="cart-outline" size={20} color={ink} />
          <AppText
            style={[
              shop.cartAddButtonFullText,
              outline && shop.cartFullOutlineText,
            ]}
          >
            {mutation.isPending ? 'Adding…' : 'Add to cart'}
          </AppText>
        </Pressable>
      );
    }
    return (
      <View style={[shop.cartStepperFull, outline && shop.cartFullOutline]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove one ${product.name} from cart`}
          disabled={mutation.isPending}
          onPress={() => commit(qty - 1)}
          style={[
            shop.cartStepperFullButton,
            outline && shop.cartStepperOutlineButton,
          ]}
        >
          <Ionicons
            name={qty === 1 ? 'trash-outline' : 'remove'}
            size={18}
            color={ink}
          />
        </Pressable>
        <View style={shop.cartStepperFullCenter}>
          <AppText
            style={[
              shop.cartStepperFullQty,
              outline && shop.cartFullOutlineText,
            ]}
          >
            {qty}
          </AppText>
          <AppText
            style={[
              shop.cartStepperFullHint,
              outline && shop.cartFullOutlineText,
            ]}
          >
            in cart
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add one more ${product.name} to cart`}
          disabled={mutation.isPending}
          onPress={() => commit(qty + 1)}
          style={[
            shop.cartStepperFullButton,
            outline && shop.cartStepperOutlineButton,
          ]}
        >
          <Ionicons name="add" size={18} color={ink} />
        </Pressable>
      </View>
    );
  }
  if (qty <= 0) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${product.name} to cart`}
        disabled={mutation.isPending}
        onPress={() => commit(1)}
        style={({ pressed }) => [
          shop.cartAddButton,
          pressed && shop.iconPressed,
        ]}
      >
        <Ionicons name="cart-outline" size={14} color="#FFFFFF" />
        <AppText style={shop.cartAddButtonText}>Add</AppText>
      </Pressable>
    );
  }
  return (
    <View style={shop.cartStepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove one ${product.name} from cart`}
        disabled={mutation.isPending}
        onPress={() => commit(qty - 1)}
        style={shop.cartStepperButton}
      >
        <Ionicons name="remove" size={14} color="#FFFFFF" />
      </Pressable>
      <AppText style={shop.cartStepperQty}>{qty}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add one more ${product.name} to cart`}
        disabled={mutation.isPending}
        onPress={() => commit(qty + 1)}
        style={shop.cartStepperButton}
      >
        <Ionicons name="add" size={14} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
export function StarRating({
  value,
  size = 14,
}: {
  value: number;
  size?: number;
}) {
  return (
    <View style={shop.row}>
      {[1, 2, 3, 4, 5].map(star => (
        <Ionicons
          key={star}
          name={
            value >= star
              ? 'star'
              : value >= star - 0.5
              ? 'star-half'
              : 'star-outline'
          }
          size={size}
          color="#F5A623"
        />
      ))}
    </View>
  );
}
export const ProductCard = React.memo(function ProductCard({
  product,
}: {
  product: Product;
}) {
  const hasDiscount =
    product.regularPrice !== null &&
    product.price !== null &&
    product.regularPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.regularPrice! - product.price!) / product.regularPrice!) *
          100,
      )
    : 0;
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
            ...(product.variationId
              ? { variation_id: product.variationId }
              : {}),
          },
        })
      }
      style={({ pressed }) => [shop.product, pressed && shop.productPressed]}
    >
      <View style={shop.imageWrap}>
        <StoreImage
          uri={product.image}
          label={product.name}
          style={shop.productImage}
        />
        {!product.inStock && (
          <View style={shop.outOfStockOverlay} pointerEvents="none" />
        )}
        {discountPercent > 0 && (
          <View style={shop.discountBadge}>
            <AppText style={shop.discountText}>-{discountPercent}%</AppText>
          </View>
        )}
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
      <View style={shop.priceRatingRow}>
        <View style={shop.priceRow}>
          {hasDiscount && (
            <AppText style={shop.was}>{money(product.regularPrice!)}</AppText>
          )}
          <AppText style={shop.price}>
            {product.price === null
              ? 'Price unavailable'
              : money(product.price)}
          </AppText>
        </View>
        {product.rating !== null && product.rating > 0 && (
          <View style={shop.ratingChip}>
            <Ionicons name="star" size={11} color="#F5A623" />
            <AppText style={shop.ratingChipText}>
              {product.rating.toFixed(1)}
            </AppText>
          </View>
        )}
      </View>
      {!product.inStock ? (
        <AppText style={shop.muted}>Out of stock</AppText>
      ) : (
        <AddToCartControl product={product} />
      )}
    </Pressable>
  );
});
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
  disabled = false,
  icon,
  onPress,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        shop.chip,
        selected && shop.selected,
        disabled && shop.chipDisabled,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={selected ? theme.colors.primary : theme.colors.secondary}
        />
      )}
      <AppText
        style={[shop.chipLabel, selected && shop.link, disabled && shop.muted]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
/** Wraps sticky controls (search/filter bars) with a shadow that fades in as `scrollY` grows, signalling they're pinned above scrolling content. */
export function ScrollShadow({
  scrollY,
  style,
  children,
}: React.PropsWithChildren<{
  scrollY: Animated.Value;
  style?: StyleProp<ViewStyle>;
}>) {
  const shadowOpacity = scrollY.interpolate({
    inputRange: [0, 16],
    outputRange: [0, 0.12],
    extrapolate: 'clamp',
  });
  const elevation = scrollY.interpolate({
    inputRange: [0, 16],
    outputRange: [0, 4],
    extrapolate: 'clamp',
  });
  return (
    <Animated.View
      style={[
        shop.stickyBar,
        style,
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
          shadowOpacity,
          elevation,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
/** Pressable that looks like a search field but opens the dedicated search screen, matching the app's search UX elsewhere. */
export function SearchLink({
  value,
  placeholder = 'Search products…',
  onPress,
}: {
  value?: string;
  placeholder?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Search products"
      onPress={onPress ?? (() => router.push('/search'))}
      android_ripple={{ color: theme.colors.primaryLight }}
      style={({ pressed }) => [shop.search, pressed && shop.iconPressed]}
    >
      <Ionicons
        name="search-outline"
        size={20}
        color={theme.colors.secondary}
      />
      <AppText numberOfLines={1} style={shop.searchLabel}>
        {value?.trim() || placeholder}
      </AppText>
    </Pressable>
  );
}
export function SkeletonBlock({ style }: { style?: StyleProp<ViewStyle> }) {
  const pulse = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.6,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);
  return (
    <Animated.View style={[shop.skeletonBlock, style, { opacity: pulse }]} />
  );
}
/** Mirrors ProductCard row for row (image, category, two-line name, price,
 * Add button) so the grid doesn't jump when products arrive. */
function ProductCardSkeleton() {
  return (
    <View
      style={shop.product}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <SkeletonBlock style={[shop.productImage, shop.skeletonCardImage]} />
      <SkeletonBlock style={shop.skeletonCardCategory} />
      <View style={shop.skeletonCardName}>
        <SkeletonBlock style={shop.skeletonLineWide} />
        <SkeletonBlock style={shop.skeletonLineMedium} />
      </View>
      <View style={shop.priceRatingRow}>
        <SkeletonBlock style={shop.skeletonCardPrice} />
        <SkeletonBlock style={shop.skeletonCardRating} />
      </View>
      <SkeletonBlock style={shop.skeletonCardButton} />
    </View>
  );
}
function CategoryTileSkeleton() {
  return (
    <View
      style={shop.categoryTile}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <SkeletonBlock style={[shop.categoryImage, shop.skeletonImage]} />
      <SkeletonBlock style={shop.skeletonCategoryLine} />
    </View>
  );
}
/** Two-column shimmering placeholder grid shown while a category list is first loading. */
export function CategoryGridSkeleton() {
  return (
    <View style={shop.skeletonGrid} accessibilityLabel="Loading categories">
      {[0, 1, 2].map(row => (
        <View key={row} style={shop.skeletonRow}>
          <View style={shop.skeletonTile}>
            <CategoryTileSkeleton />
          </View>
          <View style={shop.skeletonTile}>
            <CategoryTileSkeleton />
          </View>
        </View>
      ))}
    </View>
  );
}
/** Two-column shimmering placeholder grid shown while a product list is first loading. */
export function ProductGridSkeleton({
  gap = 10,
  rowGap = 12,
  withCount = false,
}: {
  /** Match the real list's columnWrapperStyle / contentContainerStyle gaps. */
  gap?: number;
  rowGap?: number;
  /** Placeholder for the "N products" line some lists show above the grid. */
  withCount?: boolean;
} = {}) {
  return (
    <View
      style={[shop.skeletonGrid, { gap: rowGap }]}
      accessible
      accessibilityLabel="Loading products"
      accessibilityState={{ busy: true }}
    >
      {withCount && <SkeletonBlock style={shop.skeletonCount} />}
      {[0, 1, 2].map(row => (
        <View key={row} style={[shop.skeletonRow, { gap }]}>
          <View style={shop.skeletonTile}>
            <ProductCardSkeleton />
          </View>
          <View style={shop.skeletonTile}>
            <ProductCardSkeleton />
          </View>
        </View>
      ))}
    </View>
  );
}
function SkeletonSummaryCard() {
  return (
    <View style={shop.skeletonSummaryCard}>
      {[0, 1, 2, 3].map(line => (
        <View key={line} style={shop.between}>
          <SkeletonBlock style={shop.skeletonSummaryLabel} />
          <SkeletonBlock style={shop.skeletonSummaryValue} />
        </View>
      ))}
    </View>
  );
}
/** Shimmering placeholder shown while the cart is first loading — mirrors the real item-card + summary layout so the page doesn't jump when data arrives. */
export function CartSkeleton() {
  return (
    <View style={shop.skeletonCart} accessibilityLabel="Loading cart">
      {[0, 1].map(row => (
        <View key={row} style={shop.skeletonCartCard}>
          <SkeletonBlock style={shop.skeletonCartImage} />
          <View style={shop.skeletonCartInfo}>
            <SkeletonBlock style={shop.skeletonLineWide} />
            <SkeletonBlock style={shop.skeletonLineMedium} />
            <SkeletonBlock style={shop.skeletonLineNarrow} />
          </View>
        </View>
      ))}
      <SkeletonSummaryCard />
    </View>
  );
}
/** Shimmering placeholder shown while checkout (address book / cart totals) is first loading — mirrors the delivery, order-items and summary sections. */
export function CheckoutSkeleton() {
  return (
    <View style={shop.skeletonCheckout} accessibilityLabel="Loading checkout">
      <View style={shop.skeletonCheckoutSection}>
        <SkeletonBlock style={shop.skeletonLineNarrow} />
        <SkeletonBlock style={shop.skeletonLineWide} />
        <SkeletonBlock style={shop.skeletonLineMedium} />
      </View>
      <View style={shop.skeletonCheckoutSection}>
        <SkeletonBlock style={shop.skeletonLineNarrow} />
        {[0, 1].map(row => (
          <View key={row} style={shop.skeletonCheckoutItemRow}>
            <SkeletonBlock style={shop.skeletonCheckoutItemImage} />
            <View style={shop.flex}>
              <SkeletonBlock style={shop.skeletonLineWide} />
              <SkeletonBlock style={shop.skeletonLineMedium} />
            </View>
          </View>
        ))}
      </View>
      <SkeletonSummaryCard />
    </View>
  );
}
/** Stepper placeholder: dots joined by lines, like MilestoneStepper. */
function SkeletonStepper() {
  return (
    <View style={shop.skeletonStepper}>
      {[0, 1, 2, 3].map(i => (
        <React.Fragment key={i}>
          {i > 0 && <SkeletonBlock style={shop.skeletonStepLine} />}
          <SkeletonBlock style={shop.skeletonStepDot} />
        </React.Fragment>
      ))}
    </View>
  );
}
/** Shimmering placeholder shown while the orders list is first loading — mirrors the order card row for row (icon, number + status pill, placed date, total / items / payment footer). No outer padding: the list already pads. */
export function OrdersListSkeleton() {
  return (
    <View
      style={shop.skeletonOrderList}
      accessible
      accessibilityLabel="Loading orders"
      accessibilityState={{ busy: true }}
    >
      {[0, 1, 2, 3].map(row => (
        <View key={row} style={shop.skeletonOrderCard}>
          <View style={shop.skeletonOrderHead}>
            <SkeletonBlock style={shop.skeletonOrderIcon} />
            <View style={shop.skeletonOrderHeadText}>
              <View style={shop.skeletonOrderTitleRow}>
                <SkeletonBlock style={shop.skeletonOrderNumber} />
                <SkeletonBlock style={shop.skeletonOrderPill} />
              </View>
              <SkeletonBlock style={shop.skeletonOrderDate} />
            </View>
          </View>
          <View style={shop.skeletonOrderFooter}>
            <View style={shop.skeletonOrderFooterLeft}>
              <SkeletonBlock style={shop.skeletonOrderLabel} />
              <SkeletonBlock style={shop.skeletonOrderTotal} />
            </View>
            <View style={shop.skeletonOrderFooterRight}>
              <SkeletonBlock style={shop.skeletonOrderMetaShort} />
              <SkeletonBlock style={shop.skeletonOrderMeta} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
/** Shimmering placeholder shown while an order's detail is first loading — mirrors the status card, tracking summary, items and order summary. No outer padding: the screen body already pads. */
export function OrderDetailSkeleton() {
  return (
    <View
      style={shop.skeletonOrderDetail}
      accessible
      accessibilityLabel="Loading order"
      accessibilityState={{ busy: true }}
    >
      <View style={shop.skeletonOrderDetailCard}>
        <View style={shop.skeletonPillRow}>
          <SkeletonBlock style={shop.skeletonStatusPill} />
          <SkeletonBlock style={shop.skeletonPaymentPill} />
        </View>
        <SkeletonBlock style={shop.skeletonDetailMeta} />
        <SkeletonBlock style={shop.skeletonDetailLink} />
      </View>
      <View style={shop.skeletonOrderDetailCard}>
        <SkeletonBlock style={shop.skeletonDetailEyebrow} />
        <SkeletonBlock style={shop.skeletonDetailHeadline} />
        <SkeletonStepper />
        <SkeletonBlock style={shop.skeletonDetailCta} />
      </View>
      <View style={shop.skeletonOrderDetailCard}>
        <SkeletonBlock style={shop.skeletonDetailHeading} />
        {[0, 1].map(row => (
          <View key={row} style={shop.skeletonItemRow}>
            <SkeletonBlock style={shop.skeletonItemImage} />
            <View style={shop.skeletonItemText}>
              <SkeletonBlock style={shop.skeletonLineWide} />
              <SkeletonBlock style={shop.skeletonItemQty} />
              <SkeletonBlock style={shop.skeletonItemPrice} />
            </View>
            <SkeletonBlock style={shop.skeletonItemTotal} />
          </View>
        ))}
      </View>
      <View style={shop.skeletonOrderDetailCard}>
        <SkeletonBlock style={shop.skeletonDetailHeading} />
        {[0, 1, 2, 3].map(line => (
          <View key={line} style={shop.between}>
            <SkeletonBlock style={shop.skeletonSummaryLabel} />
            <SkeletonBlock style={shop.skeletonSummaryValue} />
          </View>
        ))}
        <View style={shop.skeletonSummaryTotal}>
          <SkeletonBlock style={shop.skeletonSummaryTotalLabel} />
          <SkeletonBlock style={shop.skeletonSummaryTotalValue} />
        </View>
      </View>
    </View>
  );
}
/** Shimmering placeholder for the full tracking screen — order header with milestone stepper, a shipment card and the activity timeline. */
export function OrderTrackingSkeleton() {
  return (
    <View
      style={shop.skeletonOrderDetail}
      accessible
      accessibilityLabel="Loading tracking"
      accessibilityState={{ busy: true }}
    >
      <View style={shop.skeletonOrderDetailCard}>
        <View style={shop.between}>
          <SkeletonBlock style={shop.skeletonOrderNumber} />
          <SkeletonBlock style={shop.skeletonOrderPill} />
        </View>
        <SkeletonBlock style={shop.skeletonDetailHeadline} />
        <SkeletonBlock style={shop.skeletonDetailMeta} />
        <View style={shop.skeletonDivider} />
        <SkeletonStepper />
      </View>
      <View style={shop.skeletonOrderDetailCard}>
        <SkeletonBlock style={shop.skeletonDetailEyebrow} />
        <SkeletonBlock style={shop.skeletonLineWide} />
        <SkeletonBlock style={shop.skeletonLineMedium} />
      </View>
      <View style={shop.skeletonOrderDetailCard}>
        <SkeletonBlock style={shop.skeletonDetailHeading} />
        {[0, 1, 2].map(row => (
          <View key={row} style={shop.skeletonTimelineRow}>
            <SkeletonBlock style={shop.skeletonTimelineDot} />
            <View style={shop.skeletonItemText}>
              <SkeletonBlock style={shop.skeletonLineMedium} />
              <SkeletonBlock style={shop.skeletonItemQty} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
type SheetContent = React.ReactNode | ((close: () => void) => React.ReactNode);
function renderSheetContent(
  content: SheetContent | undefined,
  close: () => void,
) {
  return typeof content === 'function' ? content(close) : content ?? null;
}
/** Animated modal bottom sheet (backdrop + slide-up panel) shared by filter and sort pickers. */
export function BottomSheet({
  title,
  onClose,
  footer,
  children,
}: {
  title: string;
  onClose: () => void;
  footer?: SheetContent;
  children: SheetContent;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  useEffect(() => {
    const animation = Animated.timing(translateY, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [translateY]);
  const close = () => {
    Animated.timing(translateY, {
      toValue: height,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onClose());
  };
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, height],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={shop.sheetContainer}>
        <Animated.View
          style={[shop.sheetBackdrop, { opacity: backdropOpacity }]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Close ${title}`}
            style={shop.sheetBackdropTouchable}
            onPress={close}
          />
        </Animated.View>
        <Animated.View
          style={[
            shop.sheet,
            {
              maxHeight: height * 0.88,
              paddingBottom: Math.max(16, insets.bottom),
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={shop.grabber} />
          <View style={[shop.between, shop.sheetHeader]}>
            <AppText accessibilityRole="header" style={shop.heading}>
              {title}
            </AppText>
            <IconButton
              name="close"
              label={`Close ${title.toLowerCase()}`}
              onPress={close}
            />
          </View>
          {renderSheetContent(children, close)}
          {footer && (
            <View style={[shop.row, shop.sheetFooter]}>
              {renderSheetContent(footer, close)}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
