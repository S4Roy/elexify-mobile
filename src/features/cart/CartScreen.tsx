import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/ui';
import {
  AddToCartControl,
  CartSkeleton,
  ProductCard,
  ShopHeader,
  StoreImage,
  money,
  shop,
} from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { useSession } from '../../stores/session';
import { CartItem } from '../../api/cart';
import { useCart, useCartMutation, useSaveForLater } from './hooks';
import { useAddresses } from '../address/hooks';
import { useAlsoLike } from '../product/hooks';

const PAGE_BG = '#F4F6F8';
const MUTED = '#6B7280';
const SOFT = '#E8F5F3';
const UNDO_MS = 5000;

const percentOff = (item: CartItem) =>
  item.price !== null &&
  item.regularPrice !== null &&
  item.regularPrice > item.price
    ? Math.round(((item.regularPrice - item.price) / item.regularPrice) * 100)
    : 0;

function ItemCard({
  item,
  busy,
  onRemove,
  onSaveForLater,
}: {
  item: CartItem;
  busy: boolean;
  onRemove: () => void;
  onSaveForLater: () => void;
}) {
  const inStock = item.stockQuantity === null || item.stockQuantity > 0;
  const overStock =
    item.stockQuantity !== null &&
    item.stockQuantity > 0 &&
    item.quantity > item.stockQuantity;
  const lowStock =
    !overStock &&
    item.stockQuantity !== null &&
    item.stockQuantity > 0 &&
    item.stockQuantity <= 5;
  const off = percentOff(item);
  const lineTotal = item.totalPrice ?? (item.price ?? 0) * item.quantity;
  const goToProduct = () =>
    router.push({
      pathname: '/products/[slug]',
      params: {
        slug: item.slug,
        ...(item.variationId ? { variation_id: item.variationId } : {}),
      },
    });

  return (
    <View style={[styles.card, !inStock && styles.cardDimmed]}>
      <View style={styles.itemTop}>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`View ${item.name}`}
          onPress={goToProduct}
        >
          <StoreImage uri={item.image} label={item.name} style={styles.image} />
          {!inStock && (
            <View style={styles.soldOut}>
              <AppText style={styles.soldOutText}>Sold out</AppText>
            </View>
          )}
        </Pressable>
        <View style={styles.itemInfo}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`View ${item.name}`}
            onPress={goToProduct}
          >
            <AppText style={styles.itemName}>{item.name}</AppText>
          </Pressable>
          <View style={styles.priceRow}>
            <AppText style={styles.price}>
              {item.price === null ? 'Price unavailable' : money(item.price)}
            </AppText>
            {off > 0 && item.regularPrice !== null && (
              <>
                <AppText style={styles.mrp}>{money(item.regularPrice)}</AppText>
                <AppText style={styles.off}>{off}% off</AppText>
              </>
            )}
          </View>
          {!!item.discountPercent && (
            <View style={styles.tag}>
              <Ionicons
                name="pricetag"
                size={11}
                color={theme.colors.primary}
              />
              <AppText style={styles.tagText}>
                Extra {item.discountPercent}% off for this quantity
              </AppText>
            </View>
          )}
          {!inStock ? (
            <AppText style={styles.stockDanger}>
              Currently out of stock — remove it or save it for later
            </AppText>
          ) : overStock ? (
            <AppText style={styles.stockDanger}>
              Only {item.stockQuantity} available — reduce the quantity
            </AppText>
          ) : lowStock ? (
            <AppText style={styles.stockWarn}>
              Hurry, only {item.stockQuantity} left
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={styles.itemBottom}>
        {inStock ? (
          <AddToCartControl
            product={{
              id: item.productId,
              variationId: item.variationId,
              name: item.name,
              inStock,
            }}
            variant="cart"
          />
        ) : (
          <View />
        )}
        <AppText style={styles.lineTotal}>{money(lineTotal)}</AppText>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Save ${item.name} for later`}
          disabled={busy}
          onPress={onSaveForLater}
          style={({ pressed }) => [
            styles.action,
            pressed && styles.actionPressed,
          ]}
        >
          <Ionicons name="bookmark-outline" size={16} color={MUTED} />
          <AppText style={styles.actionText}>Save for later</AppText>
        </Pressable>
        <View style={styles.actionDivider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.name} from cart`}
          disabled={busy}
          onPress={onRemove}
          style={({ pressed }) => [
            styles.action,
            pressed && styles.actionPressed,
          ]}
        >
          <Ionicons name="trash-outline" size={16} color={MUTED} />
          <AppText style={styles.actionText}>Remove</AppText>
        </Pressable>
      </View>
    </View>
  );
}

/** Amazon/Flipkart-style "Deliver to" strip so the destination is confirmed
 * before checkout. */
function DeliverTo() {
  const addresses = useAddresses();
  const items = addresses.data?.items ?? [];
  const address = items.find(a => a.isDefault) ?? items[0];
  if (addresses.isPending) {
    return null;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        address
          ? `Deliver to ${address.firstName}, ${address.postcode}. Change address`
          : 'Add a delivery address'
      }
      onPress={() => router.push(address ? '/addresses' : '/addresses/form')}
      style={({ pressed }) => [styles.deliver, pressed && styles.pressed]}
    >
      <View style={styles.deliverIcon}>
        <Ionicons
          name="location-outline"
          size={17}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.flex}>
        {address ? (
          <>
            <AppText numberOfLines={1} style={styles.deliverTitle}>
              Deliver to{' '}
              <AppText style={styles.deliverStrong}>
                {address.firstName}, {address.postcode}
              </AppText>
            </AppText>
            <AppText numberOfLines={1} style={styles.deliverLine}>
              {[address.addressLine1, address.city.name]
                .filter(Boolean)
                .join(', ')}
            </AppText>
          </>
        ) : (
          <>
            <AppText style={styles.deliverStrong}>
              Add a delivery address
            </AppText>
            <AppText style={styles.deliverLine}>
              See delivery options at checkout
            </AppText>
          </>
        )}
      </View>
      <View style={styles.deliverChange}>
        <AppText style={styles.deliverChangeText}>
          {address ? 'Change' : 'Add'}
        </AppText>
      </View>
    </Pressable>
  );
}

/** Cross-sell rail from the first cart item's "also like" products, minus
 * anything already in the cart. */
function Recommendations({
  slug,
  exclude,
}: {
  slug: string;
  exclude: Set<string>;
}) {
  const alsoLike = useAlsoLike(slug);
  const items = (alsoLike.data ?? []).filter(p => !exclude.has(p.id));
  if (!items.length) {
    return null;
  }
  return (
    <View style={styles.recs}>
      <View style={styles.recsHead}>
        <AppText accessibilityRole="header" style={styles.cardTitle}>
          Frequently bought together
        </AppText>
        <AppText style={styles.recsSub}>Complete your build</AppText>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recsRail}
      >
        {items.slice(0, 10).map(product => (
          <View key={product.key} style={styles.recsCard}>
            <ProductCard product={product} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default function CartScreen() {
  const cart = useCart();
  const mutation = useCartMutation();
  const saveForLater = useSaveForLater();
  const isAuthenticated = useSession(s => s.status === 'authenticated');
  const insets = useSafeAreaInsets();
  const data = cart.data;
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [summaryY, setSummaryY] = useState(0);
  const [toast, setToast] = useState<{
    message: string;
    undo?: CartItem;
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    },
    [],
  );

  const showToast = (message: string, undo?: CartItem) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToast({ message, undo });
    toastTimer.current = setTimeout(() => setToast(null), UNDO_MS);
  };

  const itemCount =
    data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const savings = (data?.productDiscount ?? 0) + (data?.quantityDiscount ?? 0);
  const blocked =
    data?.items.some(
      item =>
        item.stockQuantity !== null &&
        (item.stockQuantity === 0 || item.quantity > item.stockQuantity),
    ) ?? false;

  const removeItem = (item: CartItem) => {
    mutation.mutate(
      { productId: item.productId, variationId: item.variationId, quantity: 0 },
      { onSuccess: () => showToast(`${item.name} removed`, item) },
    );
  };
  const undoRemove = (item: CartItem) => {
    setToast(null);
    mutation.mutate({
      productId: item.productId,
      variationId: item.variationId,
      quantity: item.quantity,
    });
  };
  const moveToWishlist = (item: CartItem) => {
    saveForLater.mutate(
      { productId: item.productId, variationId: item.variationId },
      { onSuccess: () => showToast('Saved to your wishlist') },
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cart.refetch().catch(() => undefined);
    setRefreshing(false);
  };

  const hasItems = !!data && data.items.length > 0;
  const actionError = mutation.error ?? saveForLater.error;

  return (
    <View style={[shop.page, styles.page]}>
      <ShopHeader
        title={hasItems ? `My cart (${itemCount})` : 'My cart'}
        back
      />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.body, !hasItems && styles.bodyEmpty]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <QueryState
          pending={cart.isPending}
          error={cart.error}
          paused={cart.fetchStatus === 'paused'}
          retry={() => {
            cart.refetch().catch(() => undefined);
          }}
          skeleton={<CartSkeleton />}
        />

        {!!actionError && (
          <View accessibilityRole="alert" style={styles.errorBanner}>
            <Ionicons
              name="alert-circle"
              size={16}
              color={theme.colors.danger}
            />
            <AppText style={styles.errorText}>{actionError.message}</AppText>
          </View>
        )}

        {data && data.items.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="bag-outline"
                size={40}
                color={theme.colors.primary}
              />
            </View>
            <AppText style={styles.emptyTitle}>Your cart is empty</AppText>
            <AppText style={styles.emptyText}>
              Looks like you haven't added anything yet. Explore the store and
              find the parts for your next idea.
            </AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/')}
              style={({ pressed }) => [
                styles.primary,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={styles.primaryText}>Start shopping</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/wishlist')}
              style={({ pressed }) => [
                styles.secondary,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="heart-outline"
                size={16}
                color={theme.colors.primary}
              />
              <AppText style={styles.secondaryText}>View your wishlist</AppText>
            </Pressable>
          </View>
        )}

        {hasItems && data && (
          <>
            {isAuthenticated && <DeliverTo />}

            {data.items.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                busy={mutation.isPending || saveForLater.isPending}
                onRemove={() => removeItem(item)}
                onSaveForLater={() => moveToWishlist(item)}
              />
            ))}

            <View style={styles.hintCard}>
              <View style={styles.hintIcon}>
                <Ionicons
                  name="pricetag-outline"
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.flex}>
                <AppText style={styles.hintTitle}>Have a coupon?</AppText>
                <AppText style={styles.hintText}>
                  Apply coupons and offers at checkout.
                </AppText>
              </View>
            </View>

            <Recommendations
              slug={data.items[0].slug}
              exclude={new Set(data.items.map(i => i.productId))}
            />

            <View
              style={styles.card}
              onLayout={e => setSummaryY(e.nativeEvent.layout.y)}
            >
              <AppText style={styles.cardTitle}>Price details</AppText>
              <View style={shop.between}>
                <AppText style={styles.summaryLabel}>
                  Price ({itemCount} item{itemCount !== 1 ? 's' : ''})
                </AppText>
                <AppText style={styles.summaryValue}>
                  {money(data.mrpSubtotal)}
                </AppText>
              </View>
              {data.productDiscount > 0 && (
                <View style={shop.between}>
                  <AppText style={styles.summaryLabel}>
                    Product discount
                  </AppText>
                  <AppText style={styles.discountValue}>
                    −{money(data.productDiscount)}
                  </AppText>
                </View>
              )}
              {data.quantityDiscount > 0 && (
                <View style={shop.between}>
                  <AppText style={styles.summaryLabel}>
                    Buy more save more
                  </AppText>
                  <AppText style={styles.discountValue}>
                    −{money(data.quantityDiscount)}
                  </AppText>
                </View>
              )}
              <View style={shop.between}>
                <AppText style={styles.summaryLabel}>Delivery</AppText>
                <AppText style={styles.summaryMuted}>
                  Calculated at checkout
                </AppText>
              </View>
              <View style={styles.payableRow}>
                <AppText style={styles.payableLabel}>Subtotal</AppText>
                <AppText style={styles.payableLabel}>
                  {money(data.subtotal)}
                </AppText>
              </View>
              {savings > 0 && (
                <View style={styles.savingsRow}>
                  <Ionicons name="pricetags" size={14} color="#15803D" />
                  <AppText style={styles.savingsText}>
                    You're saving {money(savings)} on this order
                  </AppText>
                </View>
              )}
            </View>

            <View style={styles.trustRow}>
              {(
                [
                  ['shield-checkmark-outline', 'Secure payments'],
                  ['refresh-outline', 'Easy returns'],
                  ['ribbon-outline', 'Genuine products'],
                ] as const
              ).map(([icon, label]) => (
                <View key={label} style={styles.trustItem}>
                  <Ionicons
                    name={icon}
                    size={18}
                    color={theme.colors.primary}
                  />
                  <AppText style={styles.trustLabel}>{label}</AppText>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {toast && (
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[
            styles.toast,
            { bottom: (hasItems ? 96 : 16) + insets.bottom },
          ]}
        >
          <AppText numberOfLines={1} style={styles.toastText}>
            {toast.message}
          </AppText>
          {toast.undo && (
            <Pressable
              accessibilityRole="button"
              onPress={() => undoRemove(toast.undo!)}
              hitSlop={10}
            >
              <AppText style={styles.toastAction}>UNDO</AppText>
            </Pressable>
          )}
        </View>
      )}

      {hasItems && data && (
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(12, insets.bottom) },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Subtotal ${money(
              data.subtotal,
            )}. View price details`}
            onPress={() =>
              scrollRef.current?.scrollTo({
                y: Math.max(0, summaryY - 12),
                animated: true,
              })
            }
            hitSlop={6}
            style={styles.bottomTotal}
          >
            <View style={styles.bottomAmountRow}>
              {savings > 0 && (
                <AppText style={styles.bottomMrp}>
                  {money(data.mrpSubtotal)}
                </AppText>
              )}
              <AppText style={styles.bottomAmount}>
                {money(data.subtotal)}
              </AppText>
            </View>
            <View style={styles.bottomLink}>
              <AppText style={styles.bottomLinkText}>
                View price details
              </AppText>
              <Ionicons
                name="chevron-up"
                size={12}
                color={theme.colors.primary}
              />
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: blocked }}
            accessibilityHint={
              blocked ? 'Fix the stock issues in your cart first' : undefined
            }
            disabled={blocked}
            onPress={() =>
              router.push(isAuthenticated ? '/checkout' : '/login')
            }
            style={({ pressed }) => [
              styles.cta,
              blocked && styles.ctaDisabled,
              pressed && styles.pressed,
            ]}
          >
            {mutation.isPending || cart.isFetching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : null}
            <AppText style={styles.ctaText}>
              {blocked
                ? 'Fix stock issues'
                : isAuthenticated
                ? 'Proceed to checkout'
                : 'Sign in to checkout'}
            </AppText>
            {!blocked && (
              <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { backgroundColor: PAGE_BG },
  body: { padding: 16, gap: 14, paddingBottom: 24 },
  bodyEmpty: { flexGrow: 1 },
  pressed: { opacity: 0.85 },
  card: {
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardDimmed: { opacity: 0.8 },
  cardTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 16,
    color: theme.colors.text,
  },

  // Item
  itemTop: { flexDirection: 'row', gap: 12 },
  image: {
    width: 92,
    height: 92,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  soldOut: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 3,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: 'rgba(17,24,39,0.75)',
    alignItems: 'center',
  },
  soldOutText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: theme.fonts.semibold,
  },
  itemInfo: { flex: 1, gap: 6 },
  itemName: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
  },
  price: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text,
  },
  mrp: { fontSize: 12, color: MUTED, textDecorationLine: 'line-through' },
  off: { fontSize: 12, fontFamily: theme.fonts.semibold, color: '#16A34A' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: SOFT,
  },
  tagText: { fontSize: 11, color: theme.colors.primary },
  stockDanger: { fontSize: 12, color: theme.colors.danger, lineHeight: 17 },
  stockWarn: { fontSize: 12, color: '#B45309' },
  itemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lineTotal: {
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
    color: theme.colors.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -14,
    marginBottom: -14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
  },
  actionPressed: { backgroundColor: '#F9FAFB' },
  actionText: {
    fontSize: 13,
    color: '#4B5563',
    fontFamily: theme.fonts.medium,
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: '#E5E7EB',
  },

  // Strips and hints
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
  },
  savingsText: {
    flex: 1,
    color: '#15803D',
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
    lineHeight: 17,
  },
  deliver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0EFEC',
  },
  deliverIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOFT,
  },
  deliverTitle: { fontSize: 13, lineHeight: 18, color: MUTED },
  deliverStrong: {
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.text,
  },
  deliverLine: { fontSize: 12, lineHeight: 16, color: MUTED },
  deliverChange: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#B2DFDB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliverChangeText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
  },
  recs: { gap: 10, marginHorizontal: -16 },
  recsHead: { paddingHorizontal: 16 },
  recsSub: { fontSize: 12, lineHeight: 17, color: MUTED },
  recsRail: { paddingHorizontal: 16, gap: 10 },
  recsCard: { width: 150 },
  bottomAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  bottomMrp: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  bottomLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  bottomLinkText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    lineHeight: 15,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9FD3CB',
    backgroundColor: '#FAFEFD',
  },
  hintIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOFT,
  },
  hintTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    color: theme.colors.text,
  },
  hintText: { fontSize: 12, color: MUTED, marginTop: 1 },

  // Price details
  summaryLabel: { fontSize: 14, color: '#4B5563' },
  summaryValue: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.text,
  },
  summaryMuted: { fontSize: 13, color: MUTED },
  discountValue: {
    color: theme.colors.primary,
    fontSize: 14,
    fontFamily: theme.fonts.medium,
  },
  payableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderStyle: 'dashed',
    paddingTop: 12,
  },
  payableLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text,
  },
  trustRow: { flexDirection: 'row', paddingTop: 2 },
  trustItem: { flex: 1, alignItems: 'center', gap: 4 },
  trustLabel: { color: MUTED, fontSize: 11, textAlign: 'center' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    flex: 1,
    color: theme.colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },

  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOFT,
    marginBottom: 6,
  },
  emptyTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: MUTED,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 8,
  },
  primary: {
    alignSelf: 'stretch',
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  primaryText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
  secondary: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#B2DFDB',
    backgroundColor: '#FFFFFF',
  },
  secondaryText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },

  // Toast
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  toastText: { flex: 1, color: '#FFFFFF', fontSize: 13 },
  toastAction: {
    color: '#5EEAD4',
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // Sticky bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  bottomTotal: { minWidth: 96 },
  bottomAmount: {
    fontFamily: theme.fonts.bold,
    fontSize: 19,
    color: theme.colors.text,
  },
  cta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  ctaDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0, elevation: 0 },
  ctaText: { color: '#FFFFFF', fontFamily: theme.fonts.semibold, fontSize: 15 },
});
