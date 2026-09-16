import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Feedback } from '../../components/ui';
import { IconButton, ShopHeader, StoreImage, money, shop } from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { useSession } from '../../stores/session';
import { CartItem } from '../../api/cart';
import { useApplyCoupon, useCart, useCartMutation } from './hooks';

function Row({
  item,
  busy,
  onChangeQuantity,
}: {
  item: CartItem;
  busy: boolean;
  onChangeQuantity: (quantity: number) => void;
}) {
  const overStock = item.stockQuantity !== null && item.quantity > item.stockQuantity;
  return (
    <View style={styles.row}>
      <StoreImage uri={item.image} label={item.name} style={styles.image} />
      <View style={styles.flex}>
        <AppText numberOfLines={2} style={shop.productName}>
          {item.name}
        </AppText>
        <View style={shop.priceRow}>
          {item.regularPrice !== null &&
            item.price !== null &&
            item.regularPrice > item.price && (
              <AppText style={shop.was}>{money(item.regularPrice)}</AppText>
            )}
          <AppText style={shop.price}>
            {item.price === null ? 'Price unavailable' : money(item.price)}
          </AppText>
        </View>
        {overStock && (
          <AppText style={styles.warning}>
            Only {item.stockQuantity} left in stock
          </AppText>
        )}
        <View style={shop.row}>
          <IconButton
            name="remove-circle-outline"
            label="Decrease quantity"
            onPress={() => !busy && onChangeQuantity(item.quantity - 1)}
          />
          <AppText style={styles.qty}>{item.quantity}</AppText>
          <IconButton
            name="add-circle-outline"
            label="Increase quantity"
            onPress={() => !busy && onChangeQuantity(item.quantity + 1)}
          />
          <View style={shop.flex} />
          <AppText
            accessibilityRole="button"
            onPress={() => !busy && onChangeQuantity(0)}
            style={styles.remove}
          >
            Remove
          </AppText>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const cart = useCart();
  const mutation = useCartMutation();
  const coupon = useApplyCoupon();
  const isAuthenticated = useSession(s => s.status === 'authenticated');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const data = cart.data;

  const changeQuantity = (item: CartItem, quantity: number) => {
    setBusyId(item.id);
    mutation.mutate(
      { productId: item.productId, variationId: item.variationId, quantity: Math.max(0, quantity) },
      { onSettled: () => setBusyId(null) },
    );
  };

  return (
    <View style={shop.page}>
      <ShopHeader title="Your cart" />
      <View style={styles.body}>
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
            <Feedback title="Your cart is empty" message="Add products to see them here." />
            <Button label="Explore the store" onPress={() => router.push('/')} />
          </>
        )}
        {data && data.items.length > 0 && (
          <>
            {data.items.map(item => (
              <Row
                key={item.id}
                item={item}
                busy={mutation.isPending && busyId === item.id}
                onChangeQuantity={q => changeQuantity(item, q)}
              />
            ))}

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

            <View style={styles.summary}>
              {data.totalDiscount > 0 && (
                <View style={shop.between}>
                  <AppText style={shop.muted}>MRP total</AppText>
                  <AppText style={shop.muted}>{money(data.mrpSubtotal)}</AppText>
                </View>
              )}
              {data.totalDiscount > 0 && (
                <View style={shop.between}>
                  <AppText style={shop.muted}>Discount</AppText>
                  <AppText style={shop.muted}>−{money(data.totalDiscount)}</AppText>
                </View>
              )}
              <View style={shop.between}>
                <AppText style={styles.total}>Total</AppText>
                <AppText style={styles.total}>{money(data.subtotal)}</AppText>
              </View>
            </View>
            <Button
              label="Proceed to checkout"
              onPress={() =>
                router.push(isAuthenticated ? '/checkout' : '/login')
              }
            />
          </>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  body: { padding: 16, gap: 16, flexGrow: 1 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 12 },
  image: { width: 84, height: 84, borderRadius: 9, backgroundColor: '#F0F1F3' },
  qty: { fontFamily: theme.fonts.medium, minWidth: 24, textAlign: 'center' },
  remove: { color: theme.colors.danger, fontFamily: theme.fonts.medium },
  warning: { color: theme.colors.danger, fontSize: 13 },
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
  summary: { gap: 8, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 },
  total: { fontFamily: theme.fonts.bold, fontSize: 18 },
});
