import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import RazorpayCheckout, { RazorpayError } from 'react-native-razorpay';
import { AppText, Button, Feedback } from '../../components/ui';
import {
  CheckoutSkeleton,
  ShopHeader,
  StoreImage,
  money,
  shop,
} from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import type { Address } from '../../api/address';
import type { CartItem } from '../../api/cart';
import { useAccount } from '../auth/hooks';
import { useAddresses } from '../address/hooks';
import { useApplyCoupon, useCart } from '../cart/hooks';
import {
  clearIdempotencyKey,
  getIdempotencyKey,
  usePlaceOrder,
  useVerifyPayment,
} from './hooks';
import { isRazorpayCancelled } from './friendlyReason';

const formatAddress = (address: Address) =>
  [
    address.addressLine1,
    address.addressLine2,
    address.city.name,
    address.state.name,
    address.postcode,
  ]
    .filter(part => part && String(part).trim())
    .join(', ');

function OrderItemRow({ item }: { item: CartItem }) {
  const lineTotal = item.totalPrice ?? (item.price ?? 0) * item.quantity;
  return (
    <View style={styles.itemRow}>
      <StoreImage uri={item.image} label={item.name} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <AppText style={styles.itemName}>{item.name}</AppText>
        <AppText style={shop.muted}>Qty: {item.quantity}</AppText>
        <View style={styles.itemPriceRow}>
          {!!item.discountPercent && item.regularPrice !== null ? (
            <>
              <AppText style={styles.itemStrike}>
                {money(item.regularPrice)}
              </AppText>
              <AppText style={styles.itemPrice}>
                {item.price === null ? '—' : money(item.price)} each
              </AppText>
            </>
          ) : (
            <AppText style={styles.itemPrice}>
              {item.price === null ? '—' : `${money(item.price)} each`}
            </AppText>
          )}
        </View>
        {!!item.discountPercent && (
          <AppText style={styles.itemDiscount}>
            {item.discountPercent}% quantity discount applied
          </AppText>
        )}
      </View>
      <AppText style={styles.itemTotal}>{money(lineTotal)}</AppText>
    </View>
  );
}

const ADDRESS_TYPE_ICON: Record<
  string,
  React.ComponentProps<typeof Ionicons>['name']
> = {
  home: 'home-outline',
  office: 'business-outline',
  work: 'business-outline',
};

function AddressCard({
  address,
  selected,
  onSelect,
  onEdit,
}: {
  address: Address;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={[styles.addressCard, selected && styles.addressCardSelected]}
    >
      <View
        style={[styles.paymentIcon, selected && styles.paymentIconSelected]}
      >
        <Ionicons
          name={ADDRESS_TYPE_ICON[address.addressType] ?? 'location-outline'}
          size={18}
          color={selected ? theme.colors.primary : theme.colors.secondary}
        />
      </View>
      <View style={styles.flex}>
        <View style={styles.addressCardHeader}>
          <AppText style={styles.addressName} numberOfLines={1}>
            {address.fullName}
          </AppText>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <AppText style={styles.defaultBadgeText}>Default</AppText>
            </View>
          )}
        </View>
        <AppText style={styles.addressDetail}>{formatAddress(address)}</AppText>
        {!!address.phone && (
          <AppText style={styles.addressPhone}>
            +{address.phoneCode} {address.phone}
          </AppText>
        )}
      </View>
      <View style={styles.addressCardActions}>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioDot} />}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${address.fullName}'s address`}
          onPress={onEdit}
          style={styles.editButton}
        >
          <Ionicons
            name="pencil-outline"
            size={15}
            color={theme.colors.secondary}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

function StepHeading({ step, title }: { step: number; title: string }) {
  return (
    <View style={styles.stepHeading}>
      <View style={styles.stepBadge}>
        <AppText style={styles.stepBadgeText}>{step}</AppText>
      </View>
      <AppText style={shop.heading}>{title}</AppText>
    </View>
  );
}

function PaymentOption({
  icon,
  title,
  subtitle,
  selected,
  disabled,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string | null;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.paymentOption,
        selected && styles.paymentOptionSelected,
        disabled && styles.paymentOptionDisabled,
      ]}
    >
      <View
        style={[styles.paymentIcon, selected && styles.paymentIconSelected]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={selected ? theme.colors.primary : theme.colors.secondary}
        />
      </View>
      <View style={styles.flex}>
        <AppText style={styles.paymentTitle}>{title}</AppText>
        {!!subtitle && (
          <AppText
            style={[
              styles.paymentSubtitle,
              disabled && styles.paymentSubtitleError,
            ]}
          >
            {subtitle}
          </AppText>
        )}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

export default function CheckoutScreen() {
  const { buyNow } = useLocalSearchParams<{ buyNow?: string }>();
  const isDirectCheckout = buyNow === '1';
  const account = useAccount();
  const addresses = useAddresses();
  const [addressId, setAddressId] = useState<string | undefined>(undefined);
  const selectedAddress = addresses.data?.items.find(a => a.id === addressId);
  const defaultApplied = React.useRef(false);
  if (!defaultApplied.current && addresses.data && !addressId) {
    defaultApplied.current = true;
    const preferred =
      addresses.data.items.find(a => a.isDefault) ?? addresses.data.items[0];
    if (preferred) {
      setAddressId(preferred.id);
    }
  }

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>(
    'razorpay',
  );
  const cart = useCart(addressId, paymentMethod, isDirectCheckout);
  const data = cart.data;

  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const applyCoupon = useApplyCoupon(isDirectCheckout);

  const [mobileVerifiedOverride, setMobileVerifiedOverride] = useState<
    boolean | null
  >(null);
  // Optimistic true until account data proves otherwise — the backend still
  // enforces this authoritatively on order placement either way.
  const mobileVerified =
    mobileVerifiedOverride ?? account.data?.mobileVerified ?? true;

  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const placeOrder = usePlaceOrder();
  const verifyPayment = useVerifyPayment();

  const delivery = data?.shippingAmount ?? 0;
  const couponDiscount = couponResult?.discount ?? 0;
  const payableBeforeCod = (data?.subtotal ?? 0) - couponDiscount + delivery;
  const effectiveCod = useMemo(() => {
    const cod = data?.cod;
    if (!cod) {
      return null;
    }
    if (
      !cod.code ||
      !['ELIGIBLE', 'BELOW_MINIMUM', 'ABOVE_MAXIMUM'].includes(cod.code)
    ) {
      return cod;
    }
    if (cod.minOrder != null && payableBeforeCod < cod.minOrder) {
      return {
        ...cod,
        eligible: false,
        code: 'BELOW_MINIMUM',
        reason: `Cash on Delivery is available for orders of at least ${money(
          cod.minOrder,
        )}`,
      };
    }
    if (cod.maxOrder != null && payableBeforeCod > cod.maxOrder) {
      return {
        ...cod,
        eligible: false,
        code: 'ABOVE_MAXIMUM',
        reason: `Cash on Delivery is available only for orders up to ${money(
          cod.maxOrder,
        )}`,
      };
    }
    return { ...cod, eligible: true, code: 'ELIGIBLE', reason: null };
  }, [data?.cod, payableBeforeCod]);
  const codFee =
    paymentMethod === 'cod' && effectiveCod?.eligible ? effectiveCod.fee : 0;
  const total = payableBeforeCod + codFee;
  const isPartialCod =
    paymentMethod === 'cod' &&
    !!effectiveCod?.eligible &&
    !!effectiveCod.advanceEnabled;
  const advancePercent = isPartialCod ? effectiveCod!.advancePercent : 0;
  const advanceAmount = isPartialCod
    ? Number((total * (advancePercent / 100)).toFixed(2))
    : 0;
  const codBalance = isPartialCod
    ? Number((total - advanceAmount).toFixed(2))
    : 0;
  const totalSavings = (data?.totalDiscount ?? 0) + couponDiscount;
  const itemCount =
    data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const recalculating = cart.isFetching || applyCoupon.isPending;

  useEffect(() => {
    if (paymentMethod === 'cod' && effectiveCod && !effectiveCod.eligible) {
      setPaymentMethod('razorpay');
    }
  }, [effectiveCod, paymentMethod]);

  const applyCouponCode = () => {
    if (!couponCode.trim()) {
      return;
    }
    setError(null);
    applyCoupon.mutate(couponCode.trim(), {
      onSuccess: result => {
        setCouponResult({ code: result.code, discount: result.discount });
        setCouponCode('');
      },
    });
  };
  const removeCoupon = () => {
    setCouponResult(null);
    setCouponCode('');
    applyCoupon.reset();
  };

  const submit = async () => {
    if (!mobileVerified) {
      router.push('/account/security');
      return;
    }
    if (!addressId || !data || data.items.length === 0) {
      return;
    }
    setError(null);
    setPlacing(true);
    const idempotencyMode = isDirectCheckout ? 'direct' : 'cart';
    try {
      const roundedTotal = Number(total.toFixed(2));
      const requestSignature = JSON.stringify({
        addressId,
        paymentMethod,
        couponCode: couponResult?.code ?? null,
        isDirectCheckout,
        total: roundedTotal,
      });
      const idempotencyKey = await getIdempotencyKey(
        idempotencyMode,
        requestSignature,
      );
      const result = await placeOrder.mutateAsync({
        addressId,
        paymentMethod,
        couponCode: couponResult?.code,
        isDirectCheckout,
        idempotencyKey,
        expectedTotal: roundedTotal,
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
          // The order already exists (pending payment) and the idempotency
          // key is deliberately kept, so retrying reuses this same order
          // instead of creating a duplicate — matches the web storefront's
          // cancelled/failure handling in src/app/(main)/checkout/page.tsx.
          const err = razorpayError as Partial<RazorpayError> | undefined;
          const cancelled = isRazorpayCancelled(err);
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
        setConfirmingPayment(true);
        try {
          await verifyPayment.mutateAsync({
            orderNumber: result.order.orderNumber,
            razorpayPaymentId: payment.razorpay_payment_id,
            razorpayOrderId: payment.razorpay_order_id,
            razorpaySignature: payment.razorpay_signature,
          });
          await clearIdempotencyKey(idempotencyMode);
          router.replace({
            pathname: '/checkout/[status]',
            params: {
              status: 'success',
              orderId: result.order.id,
              orderNumber: result.order.orderNumber,
              ...(isPartialCod ? { paymentMethod: 'cod' } : {}),
            },
          });
        } catch (verifyError) {
          setConfirmingPayment(false);
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
        await clearIdempotencyKey(idempotencyMode);
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
      const message =
        err instanceof Error ? err.message : 'Unable to place your order.';
      // The optimistic client-side check can be stale — the backend is
      // authoritative here. Surface the gate instead of a raw error string.
      if (/MOBILE_VERIFICATION_REQUIRED/.test(message)) {
        setMobileVerifiedOverride(false);
        return;
      }
      // Only a fingerprint mismatch proves this key belongs to another
      // request — clear it so the next attempt starts a fresh one.
      if (
        /idempotency key was already used for a different checkout request/i.test(
          message,
        )
      ) {
        await clearIdempotencyKey(idempotencyMode);
      }
      setError(message);
    } finally {
      setPlacing(false);
    }
  };

  const codSelectedButIneligible =
    paymentMethod === 'cod' && !!effectiveCod && !effectiveCod.eligible;
  const ctaDisabled =
    placing ||
    recalculating ||
    !data ||
    data.items.length === 0 ||
    (mobileVerified && !!selectedAddress && codSelectedButIneligible);

  const ctaLabel = !mobileVerified
    ? 'Verify mobile number to continue'
    : !selectedAddress
    ? 'Add delivery address to continue'
    : placing || recalculating
    ? 'Placing order…'
    : paymentMethod === 'razorpay'
    ? `Pay ${money(total)}`
    : isPartialCod
    ? `Pay ${money(advanceAmount)} advance`
    : 'Place order';

  if (addresses.isPending) {
    return (
      <View style={shop.page}>
        <ShopHeader title="Checkout" back />
        <ScrollView contentContainerStyle={styles.skeletonScroll}>
          <CheckoutSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={shop.page}>
      <ShopHeader title="Checkout" back />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <AppText style={styles.eyebrow}>Secure Checkout</AppText>
            <AppText style={styles.heroTitle}>Checkout</AppText>
            <AppText style={styles.lead}>
              Confirm your delivery address and payment method to place your
              order.
            </AppText>
          </View>

          {!mobileVerified && (
            <View style={styles.warningBanner}>
              <Ionicons name="shield-outline" size={16} color="#A65C00" />
              <View style={styles.flex}>
                <AppText style={styles.warningText}>
                  Verify your mobile number before placing your order.
                </AppText>
                <AppText
                  accessibilityRole="button"
                  onPress={() => router.push('/account/security')}
                  style={[shop.link, styles.warningLink]}
                >
                  Verify now
                </AppText>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <StepHeading step={1} title="Deliver to" />
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
                <Button
                  label="Add address"
                  onPress={() => router.push('/addresses/form')}
                />
              </>
            )}
            <View style={styles.addressList}>
              {addresses.data?.items.map(address => (
                <AddressCard
                  key={address.id}
                  address={address}
                  selected={address.id === addressId}
                  onSelect={() => setAddressId(address.id)}
                  onEdit={() =>
                    router.push({
                      pathname: '/addresses/form',
                      params: { id: address.id },
                    })
                  }
                />
              ))}
            </View>
            {!!addresses.data?.items.length && (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/addresses/form')}
                style={styles.addAddressButton}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={16}
                  color={theme.colors.primary}
                />
                <AppText style={shop.link}>Add a new address</AppText>
              </Pressable>
            )}
            {selectedAddress &&
              (cart.isFetching && !data ? (
                <AppText style={shop.muted}>
                  Checking delivery estimate…
                </AppText>
              ) : data?.estimatedDelivery ? (
                <View style={styles.row}>
                  <Ionicons
                    name="car-outline"
                    size={13}
                    color={theme.colors.primary}
                  />
                  <AppText style={styles.deliveryEstimate}>
                    Estimated delivery: {data.estimatedDelivery.display}
                  </AppText>
                </View>
              ) : (
                <AppText style={shop.muted}>
                  Delivery estimate currently unavailable for this address
                </AppText>
              ))}
          </View>

          {data && data.items.length === 0 && (
            <>
              <Feedback
                title="Your checkout is empty"
                message="Add products to your cart before proceeding to checkout."
              />
              <Button
                label="Browse products"
                onPress={() => router.push('/')}
              />
            </>
          )}

          {!!data?.items.length && (
            <View style={styles.section}>
              <View style={shop.between}>
                <StepHeading step={2} title="Order items" />
                <AppText style={shop.muted}>
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </AppText>
              </View>
              {data.items.map(item => (
                <OrderItemRow key={item.id} item={item} />
              ))}
            </View>
          )}

          {!!data?.items.length && (
            <>
              <View style={styles.section}>
                <StepHeading step={3} title="Payment method" />
                <View style={styles.paymentChoices}>
                  <PaymentOption
                    icon="card-outline"
                    title="Online Payment"
                    subtitle="UPI, Cards, Net Banking"
                    selected={paymentMethod === 'razorpay'}
                    onPress={() => setPaymentMethod('razorpay')}
                  />
                  <PaymentOption
                    icon="cash-outline"
                    title="Cash on Delivery"
                    subtitle={
                      !effectiveCod
                        ? null
                        : !effectiveCod.eligible
                        ? effectiveCod.reason || 'Currently unavailable'
                        : effectiveCod.advanceEnabled
                        ? `Pay ${effectiveCod.advancePercent}% now, ${
                            100 - effectiveCod.advancePercent
                          }% on delivery`
                        : 'Pay the full amount on delivery'
                    }
                    selected={paymentMethod === 'cod'}
                    disabled={!effectiveCod?.eligible}
                    onPress={() => setPaymentMethod('cod')}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <AppText style={shop.heading}>Order summary</AppText>
                {data && (
                  <>
                    <View style={shop.between}>
                      <AppText style={shop.muted}>
                        MRP / Subtotal ({itemCount} items)
                      </AppText>
                      <AppText style={styles.summaryValue}>
                        {money(data.mrpSubtotal)}
                      </AppText>
                    </View>
                    {data.productDiscount > 0 && (
                      <View style={shop.between}>
                        <AppText style={styles.discountLabel}>
                          Product discount
                        </AppText>
                        <AppText style={styles.discountLabel}>
                          −{money(data.productDiscount)}
                        </AppText>
                      </View>
                    )}
                    {data.quantityDiscount > 0 && (
                      <View style={shop.between}>
                        <AppText style={styles.discountLabel}>
                          Buy more save more
                        </AppText>
                        <AppText style={styles.discountLabel}>
                          −{money(data.quantityDiscount)}
                        </AppText>
                      </View>
                    )}
                    {couponResult && (
                      <View style={shop.between}>
                        <View style={styles.row}>
                          <AppText style={styles.discountLabel}>
                            Coupon ({couponResult.code})
                          </AppText>
                          <Pressable
                            accessibilityRole="button"
                            onPress={removeCoupon}
                          >
                            <AppText style={styles.removeCoupon}>
                              Remove
                            </AppText>
                          </Pressable>
                        </View>
                        <AppText style={styles.discountLabel}>
                          −{money(couponResult.discount)}
                        </AppText>
                      </View>
                    )}
                    <View style={shop.between}>
                      <AppText style={shop.muted}>Shipping charge</AppText>
                      {cart.isFetching ? (
                        <AppText style={shop.muted}>…</AppText>
                      ) : data.shippingAmount === null ? (
                        <AppText style={shop.muted}>Select an address</AppText>
                      ) : data.shippingAmount === 0 ? (
                        <AppText style={styles.discountLabel}>Free</AppText>
                      ) : (
                        <AppText style={styles.summaryValue}>
                          {money(data.shippingAmount)}
                        </AppText>
                      )}
                    </View>
                    {codFee > 0 && (
                      <View style={shop.between}>
                        <AppText style={shop.muted}>
                          Cash on delivery fee
                        </AppText>
                        <AppText style={styles.summaryValue}>
                          {money(codFee)}
                        </AppText>
                      </View>
                    )}
                    <View style={styles.payableRow}>
                      <AppText style={styles.payableLabel}>
                        Amount payable
                      </AppText>
                      <AppText style={styles.payableLabel}>
                        {recalculating ? 'Calculating…' : money(total)}
                      </AppText>
                    </View>
                    {isPartialCod && !recalculating && (
                      <View style={styles.advanceBox}>
                        <View style={shop.between}>
                          <AppText style={styles.advanceMuted}>
                            Order total
                          </AppText>
                          <AppText style={styles.advanceValue}>
                            {money(total)}
                          </AppText>
                        </View>
                        <View style={shop.between}>
                          <AppText style={styles.advanceHighlight}>
                            Advance payment ({advancePercent}%)
                          </AppText>
                          <AppText style={styles.advanceHighlight}>
                            {money(advanceAmount)}
                          </AppText>
                        </View>
                        <View style={shop.between}>
                          <AppText style={styles.advanceMuted}>
                            COD balance ({100 - advancePercent}%)
                          </AppText>
                          <AppText style={styles.advanceValue}>
                            {money(codBalance)}
                          </AppText>
                        </View>
                        <AppText style={styles.advanceNote}>
                          Pay {money(advanceAmount)} now to confirm your order.
                          The remaining {money(codBalance)} is due in cash on
                          delivery.
                        </AppText>
                      </View>
                    )}
                    {totalSavings > 0 && (
                      <View style={styles.savingsBanner}>
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={theme.colors.primary}
                        />
                        <AppText style={styles.savingsText}>
                          You saved {money(totalSavings)} on this order!
                        </AppText>
                      </View>
                    )}
                  </>
                )}

                <View style={styles.couponRow}>
                  <TextInput
                    accessibilityLabel="Coupon code"
                    value={couponCode}
                    editable={!couponResult}
                    onChangeText={value => {
                      setCouponCode(value);
                      applyCoupon.reset();
                    }}
                    onSubmitEditing={applyCouponCode}
                    placeholder="Promo / coupon code"
                    autoCapitalize="characters"
                    placeholderTextColor={theme.colors.secondary}
                    style={[
                      styles.couponInput,
                      couponResult && styles.couponInputDisabled,
                    ]}
                  />
                  {couponResult ? (
                    <Button
                      label="Remove"
                      variant="secondary"
                      onPress={removeCoupon}
                    />
                  ) : (
                    <Button
                      label={applyCoupon.isPending ? '…' : 'Apply'}
                      variant="secondary"
                      disabled={applyCoupon.isPending || !couponCode.trim()}
                      onPress={applyCouponCode}
                    />
                  )}
                </View>
                {applyCoupon.isError && (
                  <AppText style={styles.error}>
                    {applyCoupon.error.message}
                  </AppText>
                )}
              </View>

              {!!error && (
                <AppText accessibilityRole="alert" style={styles.error}>
                  {error}
                </AppText>
              )}
              <Button
                label={ctaLabel}
                disabled={ctaDisabled}
                icon={
                  mobileVerified &&
                  !!selectedAddress &&
                  (paymentMethod === 'razorpay' || isPartialCod) ? (
                    <Ionicons
                      name="lock-closed-outline"
                      size={16}
                      color="#FFFFFF"
                    />
                  ) : undefined
                }
                onPress={
                  mobileVerified && !selectedAddress
                    ? () => router.push('/addresses/form')
                    : submit
                }
              />

              <View style={styles.trustRow}>
                <View style={styles.trustItem}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <AppText style={styles.trustLabel}>Secure checkout</AppText>
                </View>
                <View style={styles.trustItem}>
                  <Ionicons
                    name="cube-outline"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <AppText style={styles.trustLabel}>
                    {delivery > 0 ? 'Reliable shipping' : 'Free delivery'}
                  </AppText>
                </View>
                <View style={styles.trustItem}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <AppText style={styles.trustLabel}>
                    {data?.estimatedDelivery
                      ? `Est. ${data.estimatedDelivery.display}`
                      : 'Delivery estimate pending'}
                  </AppText>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {confirmingPayment && (
        <View
          style={styles.confirmOverlay}
          accessibilityRole="alert"
          accessibilityLabel="Confirming your payment"
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText style={styles.confirmTitle}>Payment received</AppText>
          <AppText style={[shop.muted, styles.confirmMessage]}>
            We're confirming your order. Please don't close this screen.
          </AppText>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: 16, gap: 12, paddingBottom: 32 },
  skeletonScroll: { flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  stepHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
  },
  section: {
    gap: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
  },
  addressList: { gap: 10 },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  addressCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  addressName: { fontFamily: theme.fonts.semibold, fontSize: 14 },
  defaultBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: theme.fonts.semibold,
  },
  addressCardActions: { alignItems: 'center', gap: 8 },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  addressDetail: {
    color: theme.colors.secondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  addressPhone: {
    color: theme.colors.secondary,
    fontSize: 12,
    marginTop: 3,
  },
  deliveryEstimate: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    fontSize: 12,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryLight,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontFamily: theme.fonts.medium, fontSize: 14 },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  itemStrike: {
    color: theme.colors.secondary,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  itemPrice: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: theme.fonts.medium,
  },
  itemDiscount: { color: theme.colors.primary, fontSize: 11 },
  itemTotal: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    alignSelf: 'flex-start',
  },
  paymentChoices: { gap: 10 },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  paymentOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  paymentOptionDisabled: { opacity: 0.55 },
  paymentIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  paymentIconSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: theme.colors.primary,
  },
  paymentTitle: { fontFamily: theme.fonts.medium, fontSize: 14 },
  paymentSubtitle: {
    color: theme.colors.secondary,
    fontSize: 12,
    marginTop: 1,
  },
  paymentSubtitleError: { color: theme.colors.danger },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: theme.colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  summaryValue: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.text,
  },
  discountLabel: {
    color: theme.colors.primary,
    fontSize: 13,
    fontFamily: theme.fonts.medium,
  },
  removeCoupon: {
    color: theme.colors.danger,
    fontSize: 11,
    textDecorationLine: 'underline',
    marginLeft: 6,
  },
  payableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  advanceBox: {
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
  },
  advanceMuted: { color: theme.colors.secondary, fontSize: 12 },
  advanceValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 12,
  },
  advanceHighlight: {
    color: '#1D4ED8',
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
  },
  advanceNote: {
    color: '#1D4ED8',
    fontSize: 11,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
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
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  couponInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.text,
  },
  couponInputDisabled: { opacity: 0.5 },
  warningBanner: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCD9A0',
    backgroundColor: '#FEF3E7',
  },
  warningText: { color: '#A65C00', fontSize: 13, lineHeight: 18 },
  warningLink: { marginTop: 2 },
  error: { color: theme.colors.danger, fontSize: 13 },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  trustItem: { flex: 1, alignItems: 'center', gap: 4 },
  trustLabel: {
    color: theme.colors.secondary,
    fontSize: 10,
    textAlign: 'center',
  },
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  confirmTitle: { fontFamily: theme.fonts.bold, fontSize: 18, marginTop: 8 },
  confirmMessage: { textAlign: 'center', maxWidth: 280 },
});
