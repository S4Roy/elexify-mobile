import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, Feedback } from '../../components/ui';
import { AddToCartControl, StoreImage, money, shop } from '../../components/shop';
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
      accessibilityLabel={added ? `${item.name} added to wishlist` : `Add ${item.name} to wishlist`}
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
        size={18}
        color={added ? '#FF9A29' : '#FF9A29'}
      />
    </Pressable>
  );
}

function Row({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  const overStock = item.stockQuantity !== null && item.quantity > item.stockQuantity;
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
      <View style={styles.topRow}>
        <View style={styles.checkedBox}><Ionicons name="checkmark" size={14} color="#FFFFFF" /></View>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`View ${item.name}`}
          onPress={goToProduct}
          style={styles.imageLink}
        >
          <StoreImage uri={item.image} label={item.name} style={styles.image} />
        </Pressable>
        <View style={styles.infoCol}>
          <WishlistButton item={item} />
          <Pressable accessibilityRole="link" accessibilityLabel={`View ${item.name}`} onPress={goToProduct}>
            <AppText numberOfLines={2} style={styles.productName}>
              {item.name}
            </AppText>
          </Pressable>
          <View style={styles.priceRow}>
            <AppText style={shop.price}>
              {item.price === null ? 'Price unavailable' : money(item.price)}
            </AppText>
            {inStock ? (
              <AddToCartControl
                product={{ id: item.productId, variationId: item.variationId, name: item.name, inStock }}
                variant="cart"
              />
            ) : <AppText style={styles.warning}>Out of stock</AppText>}
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
        <Pressable accessibilityRole="link" accessibilityLabel={`Buy ${item.name}`} onPress={goToProduct} style={styles.buyAction}>
          <Ionicons name="cart-outline" size={20} color={theme.colors.primary} />
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
  const itemCount = data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const removeItem = (item: CartItem) => {
    mutation.mutate({ productId: item.productId, variationId: item.variationId, quantity: 0 });
  };

  return (
    <View style={[shop.page, styles.page]}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
          </Pressable>
          <AppText style={styles.headerTitle}>Cart</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Search products" onPress={() => router.push('/search')} style={styles.headerSearch}>
            <Ionicons name="search-outline" size={23} color="#626A70" />
          </Pressable>
          <Ionicons name="cart-outline" size={27} color="#626A70" />
          <Ionicons name="notifications-outline" size={27} color="#626A70" />
        </View>
      </SafeAreaView>
      <View style={styles.shippingBanner}>
        <Ionicons name="car-outline" size={20} color="#FFFFFF" />
        <AppText style={styles.shippingText}>FREE shipping on ₹ 500.00+</AppText>
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <QueryState
          pending={cart.isPending}
          error={cart.error}
          paused={cart.fetchStatus === 'paused'}
          retry={() => {
            cart.refetch().catch(() => undefined);
          }}
        />
        {mutation.isError && (
          <AppText accessibilityRole="alert" style={styles.warning}>
            {mutation.error.message}
          </AppText>
        )}
        {data && data.items.length === 0 && (
          <>
            <Feedback title="Your cart is empty" message="Add items to get started." />
            <Button label="Continue shopping" onPress={() => router.push('/')} />
          </>
        )}
        {data && data.items.length > 0 && (
          <>
            {data.items.map(item => (
              <Row key={item.id} item={item} onRemove={() => removeItem(item)} />
            ))}

            <AppText style={styles.sectionTitle}>Previously Bought</AppText>

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
                  Coupon applied: −{money(coupon.data.discount)}. New total {money(coupon.data.total)}.
                </AppText>
              )}
            </View>

            <View style={styles.summaryCard}>
              <View style={shop.between}>
                <AppText style={shop.muted}>MRP / Subtotal</AppText>
                <AppText style={styles.summaryValue}>{money(data.mrpSubtotal)}</AppText>
              </View>
              {data.productDiscount > 0 && (
                <View style={shop.between}>
                  <AppText style={styles.discountLabel}>Product Discount</AppText>
                  <AppText style={styles.discountLabel}>−{money(data.productDiscount)}</AppText>
                </View>
              )}
              {data.quantityDiscount > 0 && (
                <View style={shop.between}>
                  <AppText style={styles.discountLabel}>Buy More Save More</AppText>
                  <AppText style={styles.discountLabel}>−{money(data.quantityDiscount)}</AppText>
                </View>
              )}
              <View style={shop.between}>
                <AppText style={styles.shippingLabel}>Shipping &amp; delivery</AppText>
                <AppText style={styles.shippingValue}>Calculated at checkout</AppText>
              </View>
              <View style={[shop.between, styles.payableRow]}>
                <AppText style={styles.payableLabel}>Amount Payable</AppText>
                <AppText style={styles.payableLabel}>{money(data.subtotal)}</AppText>
              </View>
            </View>
          </>
        )}
      </ScrollView>
      {data && data.items.length > 0 && (
        <View style={[styles.stickyBar, { paddingBottom: Math.max(8, insets.bottom) }]}>
          <View style={styles.flex}>
            <AppText style={styles.itemCount}>{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</AppText>
            <AppText style={styles.total}>{money(data.subtotal)}</AppText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Checkout" onPress={() => router.push(isAuthenticated ? '/checkout' : '/login')} style={styles.checkoutButton}>
            <AppText style={styles.checkoutText}>Checkout</AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  page: { backgroundColor: '#FFFFFF' },
  headerSafe: { backgroundColor: '#EFFFFE' },
  header: { height: 64, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 18 },
  headerTitle: { flex: 1, fontSize: 17, color: theme.colors.primary },
  headerSearch: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shippingBanner: { height: 60, backgroundColor: '#006F65', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shippingText: { color: '#FFFFFF', fontFamily: theme.fonts.medium, fontSize: 14 },
  body: { paddingHorizontal: 16, paddingTop: 38, gap: 15, flexGrow: 1, paddingBottom: 110 },
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
  checkedBox: { position: 'absolute', top: 5, left: 5, zIndex: 2, width: 17, height: 17, borderRadius: 3, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  infoCol: { flex: 1, justifyContent: 'space-between', paddingTop: 22 },
  wishlistButton: {
    position: 'absolute',
    top: -20,
    right: 0,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  productName: { color: '#30343A', fontFamily: theme.fonts.medium, fontSize: 15, lineHeight: 22 },
  priceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
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
  sectionTitle: { marginTop: 14, marginBottom: 10, color: '#30343A', fontFamily: theme.fonts.semibold, fontSize: 18 },
  summaryCard: { padding: 14, gap: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, backgroundColor: '#FFFFFF' },
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
  shippingValue: { color: theme.colors.secondary, fontSize: 12, fontStyle: 'italic' },
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
  total: { fontFamily: theme.fonts.semibold, fontSize: 21, color: theme.colors.primary },
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
  checkoutButton: { width: '50%', alignSelf: 'stretch', backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  checkoutText: { color: '#FFFFFF', fontFamily: theme.fonts.semibold, fontSize: 17 },
});
