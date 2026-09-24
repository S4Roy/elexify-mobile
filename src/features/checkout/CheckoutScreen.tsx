import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import RazorpayCheckout, { RazorpayError } from 'react-native-razorpay';
import { AppText, Button, Feedback } from '../../components/ui';
import { Chip, ShopHeader, money, shop } from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { useAddresses } from '../address/hooks';
import { useCart } from '../cart/hooks';
import { clearIdempotencyKey, getIdempotencyKey, usePlaceOrder, useVerifyPayment } from './hooks';
import { isRazorpayCancelled } from './friendlyReason';

export default function CheckoutScreen() {
  const addresses = useAddresses();
  const [addressId, setAddressId] = useState<string | undefined>(undefined);
  const selectedAddress = addresses.data?.items.find(a => a.id === addressId);
  const defaultApplied = React.useRef(false);
  if (!defaultApplied.current && addresses.data && !addressId) {
    defaultApplied.current = true;
    const preferred = addresses.data.items.find(a => a.isDefault) ?? addresses.data.items[0];
    if (preferred) {
      setAddressId(preferred.id);
    }
  }

  const cart = useCart(addressId);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('razorpay');
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const placeOrder = usePlaceOrder();
  const verifyPayment = useVerifyPayment();

  const data = cart.data;
  const codBlocked = paymentMethod === 'cod' && data?.cod && !data.cod.eligible;

  const submit = async () => {
    if (!addressId || !data) {
      return;
    }
    setError(null);
    setPlacing(true);
    try {
      const idempotencyKey = await getIdempotencyKey('cart');
      const result = await placeOrder.mutateAsync({
        addressId,
        paymentMethod,
        idempotencyKey,
      });
      if (result.razorpay) {
        let payment;
        try {
          payment = await RazorpayCheckout.open({
            key: result.razorpay.keyId,
            order_id: result.razorpay.orderId,
            amount: result.razorpay.amount,
            currency: result.razorpay.currency,
            name: 'Elexify',
            description: 'Order payment',
            prefill: {
              name: selectedAddress?.fullName,
              contact: selectedAddress?.phone,
            },
            theme: { color: theme.colors.primary },
          });
        } catch (razorpayError) {
          // The order already exists (pending payment), so route to the
          // shared result screen rather than an inline error, matching the
          // web storefront's cancelled/failure split.
          const err = razorpayError as Partial<RazorpayError> | undefined;
          const cancelled = isRazorpayCancelled(err);
          await clearIdempotencyKey('cart');
          router.replace({
            pathname: '/checkout/[status]',
            params: {
              status: cancelled ? 'cancelled' : 'failure',
              orderId: result.order.id,
              orderNumber: result.order.orderNumber,
              reason: err?.description || '',
            },
          });
          return;
        }
        try {
          await verifyPayment.mutateAsync({
            orderNumber: result.order.orderNumber,
            razorpayPaymentId: payment.razorpay_payment_id,
            razorpayOrderId: payment.razorpay_order_id,
            razorpaySignature: payment.razorpay_signature,
          });
          await clearIdempotencyKey('cart');
          router.replace({
            pathname: '/checkout/[status]',
            params: { status: 'success', orderId: result.order.id, orderNumber: result.order.orderNumber },
          });
        } catch (verifyError) {
          await clearIdempotencyKey('cart');
          router.replace({
            pathname: '/checkout/[status]',
            params: {
              status: 'failure',
              orderId: result.order.id,
              orderNumber: result.order.orderNumber,
              reason: verifyError instanceof Error ? verifyError.message : '',
            },
          });
        }
      } else {
        await clearIdempotencyKey('cart');
        router.replace({
          pathname: '/checkout/[status]',
          params: {
            status: 'success',
            orderId: result.order.id,
            orderNumber: result.order.orderNumber,
            paymentMethod: 'cod',
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to place your order.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <View style={shop.page}>
      <ShopHeader title="Checkout" back />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <AppText style={shop.heading}>Deliver to</AppText>
        <QueryState
          pending={addresses.isPending}
          error={addresses.error}
          retry={() => {
            addresses.refetch().catch(() => undefined);
          }}
        />
        {addresses.data && addresses.data.items.length === 0 && (
          <>
            <Feedback
              title="No saved address"
              message="Add a delivery address to continue."
            />
            <Button label="Add address" onPress={() => router.push('/addresses/form')} />
          </>
        )}
        {addresses.data?.items.map(address => (
          <Chip
            key={address.id}
            label={`${address.fullName} · ${address.city.name || address.postcode}`}
            selected={address.id === addressId}
            onPress={() => setAddressId(address.id)}
          />
        ))}
        {!!addresses.data?.items.length && (
          <AppText
            accessibilityRole="button"
            onPress={() => router.push('/addresses/form')}
            style={shop.link}
          >
            + Add a new address
          </AppText>
        )}

        <AppText style={shop.heading}>Payment method</AppText>
        <View style={styles.paymentChoices}>
          <Chip
            label="Pay online (Razorpay)"
            selected={paymentMethod === 'razorpay'}
            onPress={() => setPaymentMethod('razorpay')}
          />
          <Chip
            label="Cash on delivery"
            selected={paymentMethod === 'cod'}
            onPress={() => setPaymentMethod('cod')}
          />
        </View>
        {codBlocked && (
          <AppText style={styles.error}>
            {data?.cod?.reason || 'Cash on delivery is unavailable for this order.'}
          </AppText>
        )}

        {data && (
          <View style={styles.summary}>
            <View style={shop.between}>
              <AppText style={shop.muted}>Items subtotal</AppText>
              <AppText style={shop.muted}>{money(data.subtotal)}</AppText>
            </View>
            {data.shippingAmount !== null && (
              <View style={shop.between}>
                <AppText style={shop.muted}>Shipping</AppText>
                <AppText style={shop.muted}>
                  {data.shippingAmount === 0 ? 'Free' : money(data.shippingAmount)}
                </AppText>
              </View>
            )}
            {paymentMethod === 'cod' && !!data.cod?.fee && (
              <View style={shop.between}>
                <AppText style={shop.muted}>COD fee</AppText>
                <AppText style={shop.muted}>{money(data.cod.fee)}</AppText>
              </View>
            )}
          </View>
        )}

        {!!error && (
          <AppText accessibilityRole="alert" style={styles.error}>
            {error}
          </AppText>
        )}
        <Button
          label={placing ? 'Placing order…' : 'Place order'}
          disabled={!addressId || !data || data.items.length === 0 || !!codBlocked || placing}
          onPress={submit}
        />
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, paddingBottom: 32 },
  paymentChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summary: { gap: 8, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 },
  error: { color: theme.colors.danger },
});
