import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button } from '../../components/ui';
import {
  AddToCartControl,
  CartSkeleton,
  ShopHeader,
  StoreImage,
  money,
  shop,
} from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { useSession } from '../../stores/session';
import { CartItem } from '../../api/cart';
import { useToggleWishlist } from '../wishlist/hooks';
import { useApplyCoupon, useCart, useCartMutation } from './hooks';

function WishlistButton({ item }: { item: CartItem }) {
  const [added, setAdded] = useState(false);
  const toggle = useToggleWishlist();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        added
          ? `${item.name} added to wishlist`
          : `Add ${item.name} to wishlist`
      }
      disabled={toggle.isPending || added}
      onPress={() =>
        toggle.mutate(
          { productId: item.productId, variationId: item.variationId },
          { onSuccess: () => setAdded(true) },
        )
      }
      style={styles.wishlistButton}
    >
      <Ionicons
        name={added ? 'heart' : 'heart-outline'}
        size={17}
        color={added ? '#FF9A29' : theme.colors.secondary}
      />
    </Pressable>
  );
}

function Row({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  const overStock =
    item.stockQuantity !== null && item.quantity > item.stockQuantity;
  const inStock = item.stockQuantity === null || item.stockQuantity > 0;
  const hasQuantityDiscount = !!item.discountPercent && item.price !== null;
  const goToProduct = () =>
    router.push({
      pathname: '/products/[slug]',
      params: {
        slug: item.slug,
        ...(item.variationId ? { variation_id: item.variationId } : {}),
      },
    });
  return (
    <View style={styles.card}>
      <WishlistButton item={item} />
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`View ${item.name}`}
          onPress={goToProduct}
          style={styles.imageLink}
        >
          <StoreImage uri={item.image} label={item.name} style={styles.image} />
        </Pressable>
        <View style={styles.infoCol}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`View ${item.name}`}
            onPress={goToProduct}
          >
            <AppText style={styles.productName}>{item.name}</AppText>
          </Pressable>
          <View style={styles.priceRow}>
            <AppText style={shop.price}>
              {item.price === null ? 'Price unavailable' : money(item.price)}
            </AppText>
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
              <AppText style={styles.warning}>Out of stock</AppText>
            )}
          </View>
          {hasQuantityDiscount && (
            <AppText style={styles.discountLabel}>
              {item.discountPercent}% quantity discount applied
            </AppText>
          )}
          {overStock && (
            <AppText style={styles.warning}>
              Only {item.stockQuantity} left in stock
            </AppText>
          )}
        </View>
      </View>
      <View style={styles.bottomRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.name} from cart`}
          onPress={onRemove}
          style={styles.removeAction}
        >
          <Ionicons name="trash-outline" size={18} color="#FF5272" />
          <AppText style={styles.removeText}>Remove from cart</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Buy ${item.name}`}
          onPress={goToProduct}
          style={styles.buyAction}
        >
          <Ionicons
            name="cart-outline"
            size={20}
            color={theme.colors.primary}
          />
          <AppText style={styles.buyText}>Buy this product</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const cart = useCart();
  const mutation = useCartMutation();
  const coupon = useApplyCoupon();
  const isAuthenticated = useSession(s => s.status === 'authenticated');
  const [code, setCode] = useState('');
  const insets = useSafeAreaInsets();
  const data = cart.data;
  const itemCount =
    data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const removeItem = (item: CartItem) => {
    mutation.mutate({
      productId: item.productId,
      variationId: item.variationId,
      quantity: 0,
    });
  };

  return (
    <View style={[shop.page, styles.page]}>
      <ShopHeader title="Cart" back />
      <ScrollView
        contentContainerStyle={[
          styles.body,
          data && data.items.length > 0 && styles.bodyWithStickyBar,
        ]}
        keyboardShouldPersistTaps="handled"
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
        {mutation.isError && (
          <AppText accessibilityRole="alert" style={styles.warning}>
            {mutation.error.message}
          </AppText>
        )}
        {data && data.items.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="cart-outline"
                size={42}
                color={theme.colors.primary}
              />
            </View>
            <AppText style={styles.emptyTitle}>Your cart is empty</AppText>
            <AppText style={[shop.muted, styles.emptyMessage]}>
              Looks like you haven't added anything yet. Explore the store and
              find something you'll love.
            </AppText>
            <View style={styles.emptyActions}>
              <Button
                label="Continue shopping"
                onPress={() => router.push('/')}
              />
            </View>
          </View>
        )}
        {data && data.items.length > 0 && (
          <>
            <View style={styles.hero}>
              <AppText style={styles.eyebrow}>Shopping Bag</AppText>
              <AppText style={styles.heroTitle}>Your Cart</AppText>
              <AppText style={styles.lead}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'} ready for
                checkout.
              </AppText>
            </View>

            {data.items.map(item => (
              <Row
                key={item.id}
                item={item}
                onRemove={() => removeItem(item)}
              />
            ))}

            <View style={styles.summaryCard}>
              {isAuthenticated ? (
                <View style={styles.couponRow}>
                  <TextInput
                    accessibilityLabel="Coupon code"
                    value={code}
                    onChangeText={setCode}
                    placeholder="Coupon code"
                    autoCapitalize="characters"
                    placeholderTextColor={theme.colors.secondary}
                    style={styles.couponInput}
                  />
                  <Button
                    label={coupon.isPending ? 'Applying…' : 'Apply'}
                    disabled={!code.trim() || coupon.isPending}
                    onPress={() => coupon.mutate(code.trim())}
                  />
                </View>
              ) : (
                <AppText style={shop.muted}>Sign in to apply a coupon.</AppText>
              )}
              {coupon.isError && (
                <AppText accessibilityRole="alert" style={styles.warning}>
                  {coupon.error.message}
                </AppText>
              )}
              {coupon.data && (
                <AppText style={shop.muted}>
                  Coupon applied: −{money(coupon.data.discount)}. New total{' '}
                  {money(coupon.data.total)}.
                </AppText>
              )}
            </View>

            <View style={styles.summaryCard}>
              <View style={shop.between}>
                <AppText style={shop.muted}>MRP / Subtotal</AppText>
                <AppText style={styles.summaryValue}>
                  {money(data.mrpSubtotal)}
                </AppText>
              </View>
              {data.productDiscount > 0 && (
                <View style={shop.between}>
                  <AppText style={styles.discountLabel}>
                    Product Discount
                  </AppText>
                  <AppText style={styles.discountLabel}>
                    −{money(data.productDiscount)}
                  </AppText>
                </View>
              )}
              {data.quantityDiscount > 0 && (
                <View style={shop.between}>
                  <AppText style={styles.discountLabel}>
                    Buy More Save More
                  </AppText>
                  <AppText style={styles.discountLabel}>
                    −{money(data.quantityDiscount)}
                  </AppText>
                </View>
              )}
              <View style={shop.between}>
                <AppText style={styles.shippingLabel}>
                  Shipping &amp; delivery
                </AppText>
                <AppText style={styles.shippingValue}>
                  Calculated at checkout
                </AppText>
              </View>
              <View style={[shop.between, styles.payableRow]}>
                <AppText style={styles.payableLabel}>Amount Payable</AppText>
                <AppText style={styles.payableLabel}>
                  {money(data.subtotal)}
                </AppText>
              </View>
              {data.productDiscount + data.quantityDiscount > 0 && (
                <View style={styles.savingsBanner}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={theme.colors.primary}
                  />
                  <AppText style={styles.savingsText}>
                    You saved{' '}
                    {money(data.productDiscount + data.quantityDiscount)} on
                    this order!
                  </AppText>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
      {data && data.items.length > 0 && (
        <View
          style={[
            styles.stickyBar,
            { paddingBottom: Math.max(8, insets.bottom) },
          ]}
        >
          <View style={styles.flex}>
            <AppText style={styles.itemCount}>
              {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
            </AppText>
            <AppText style={styles.total}>{money(data.subtotal)}</AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Checkout"
            onPress={() =>
              router.push(isAuthenticated ? '/checkout' : '/login')
            }
            style={styles.checkoutButton}
          >
            <AppText style={styles.checkoutText}>Checkout</AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  page: { backgroundColor: '#FFFFFF' },
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 15,
    flexGrow: 1,
  },
  bodyWithStickyBar: { paddingBottom: 110 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.text,
  },
  emptyMessage: { textAlign: 'center', maxWidth: 300 },
  emptyActions: { alignSelf: 'stretch', paddingHorizontal: 24, marginTop: 8 },
  flex: { flex: 1, paddingLeft: 32 },
  card: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#DCE2EC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  topRow: { flexDirection: 'row', gap: 14, padding: 8, minHeight: 144 },
  imageLink: { borderRadius: 11, overflow: 'hidden' },
  image: {
    width: 124,
    height: 124,
    borderRadius: 11,
    backgroundColor: '#ECEFF4',
  },
  infoCol: { flex: 1, justifyContent: 'space-between', paddingTop: 2 },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  productName: {
    color: '#30343A',
    fontFamily: theme.fonts.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  discountLabel: {
    color: '#16A34A',
    fontFamily: theme.fonts.semibold,
    fontSize: 11,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 49,
    borderTopWidth: 1,
    borderTopColor: '#DCE2EC',
  },
  removeAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 49,
  },
  removeText: {
    color: '#64686E',
    fontSize: 13,
  },
  buyAction: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: '#DCE2EC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buyText: { color: theme.colors.primary, fontSize: 13 },
  hero: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    color: theme.colors.text,
  },
  lead: {
    color: theme.colors.secondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 2,
  },
  summaryCard: {
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 8,
    padding: 8,
  },
  savingsText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontFamily: theme.fonts.medium,
  },
  warning: { color: theme.colors.danger, fontSize: 13, marginTop: 2 },
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  couponInput: {
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
  summaryValue: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.text,
  },
  shippingLabel: { color: theme.colors.secondary, fontSize: 12 },
  shippingValue: {
    color: theme.colors.secondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  payableRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    marginTop: 2,
  },
  payableLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.text,
  },
  itemCount: { color: '#526384', fontSize: 14 },
  total: {
    fontFamily: theme.fonts.semibold,
    fontSize: 21,
    color: theme.colors.primary,
  },
  stickyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 74,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 8,
  },
  checkoutButton: {
    width: '50%',
    alignSelf: 'stretch',
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 17,
  },
});
