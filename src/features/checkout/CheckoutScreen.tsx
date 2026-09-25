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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useCheckoutAddress } from '../../stores/checkoutAddress';

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

function StepHeading({
  step,
  title,
  done = false,
  aside,
}: {
  step: number;
  title: string;
  /** Step completed — the number turns into a tick. */
  done?: boolean;
  aside?: string;
}) {
  return (
    <View style={styles.stepHeading}>
      <View style={[styles.stepBadge, done && styles.stepBadgeDone]}>
        {done ? (
          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
        ) : (
          <AppText style={styles.stepBadgeText}>{step}</AppText>
        )}
      </View>
      <AppText style={styles.stepTitle}>{title}</AppText>
      {!!aside && <AppText style={styles.stepAside}>{aside}</AppText>}
    </View>
  );
}

/** Dashed "add" tile — a secondary action that never competes visually with
 * the solid Pay / Place order button. */
function AddAddressTile({
  prominent,
  onPress,
}: {
  /** No saved address yet: larger, explanatory version. */
  prominent: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add a delivery address"
      onPress={onPress}
      style={({ pressed }) => [
        styles.addTile,
        prominent && styles.addTileProminent,
        pressed && styles.addTilePressed,
      ]}
    >
      <View style={[styles.addTileIcon, prominent && styles.addTileIconLarge]}>
        <Ionicons
          name={prominent ? 'location-outline' : 'add'}
          size={prominent ? 22 : 18}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.flex}>
        <AppText style={styles.addTileTitle}>
          {prominent ? 'Add a delivery address' : 'Add a new address'}
        </AppText>
        {prominent && (
          <AppText style={styles.addTileText}>
            We'll use it to check delivery time and shipping charges.
          </AppText>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
    </Pressable>
  );
}

const PREVIEW_ITEMS = 3;

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
  const pendingAddressId = useCheckoutAddress(s => s.pendingId);
  const consumePendingAddress = useCheckoutAddress(s => s.consume);
  useEffect(() => {
    const items = addresses.data?.items;
    if (!items?.length) {
      return;
    }
    // Just added/edited from this checkout: select it once it's in the list.
    if (pendingAddressId && items.some(a => a.id === pendingAddressId)) {
      setAddressId(pendingAddressId);
      consumePendingAddress();
      return;
    }
    // Nothing (valid) selected — e.g. first visit, the first address was just
    // added, or the selected one was deleted: fall back to the default.
    if (!addressId || !items.some(a => a.id === addressId)) {
      setAddressId((items.find(a => a.isDefault) ?? items[0]).id);
    }
  }, [addresses.data, addressId, pendingAddressId, consumePendingAddress]);
  const openAddressForm = (id?: string) =>
    router.push({
      pathname: '/addresses/form',
      params: { ...(id ? { id } : {}), from: 'checkout' },
    });

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

  // "setup" = a step is still missing (verify mobile / add address): shown as
  // an outlined button so it's never mistaken for the pay action. Only
  // "commit" — actually placing the order — gets the solid primary button.
  const ctaKind: 'setup' | 'commit' =
    !mobileVerified || !selectedAddress ? 'setup' : 'commit';
  const ctaLabel = !mobileVerified
    ? 'Verify mobile number'
    : !selectedAddress
    ? 'Add delivery address'
    : placing
    ? 'Placing order…'
    : recalculating
    ? 'Updating total…'
    : paymentMethod === 'razorpay'
    ? 'Pay now'
    : isPartialCod
    ? 'Pay advance'
    : 'Place order';
  const ctaIcon: React.ComponentProps<typeof Ionicons>['name'] | null =
    !mobileVerified
      ? 'shield-checkmark-outline'
      : !selectedAddress
      ? 'location-outline'
      : paymentMethod === 'razorpay' || isPartialCod
      ? 'lock-closed'
      : null;
  const onCta = !mobileVerified
    ? () => router.push('/account/security')
    : !selectedAddress
    ? () => openAddressForm()
    : submit;
  const payNow = isPartialCod ? advanceAmount : total;

  const insets = useSafeAreaInsets();
  const [showAllItems, setShowAllItems] = useState(false);

  if (addresses.isPending) {
    return (
      <View style={[shop.page, styles.page]}>
        <ShopHeader title="Checkout" back />
        <ScrollView contentContainerStyle={styles.skeletonScroll}>
          <CheckoutSkeleton />
        </ScrollView>
      </View>
    );
  }

  const hasItems = !!data?.items.length;
  const visibleItems =
    data && !showAllItems ? data.items.slice(0, PREVIEW_ITEMS) : data?.items;
  const noAddresses = !!addresses.data && addresses.data.items.length === 0;

  return (
    <View style={[shop.page, styles.page]}>
      <ShopHeader title="Checkout" back />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.secureStrip}>
            <Ionicons
              name="lock-closed"
              size={12}
              color={theme.colors.primary}
            />
            <AppText style={styles.secureStripText}>
              Secure checkout · Your details are encrypted
            </AppText>
          </View>

          {!mobileVerified && (
            <View style={styles.warningBanner}>
              <Ionicons name="shield-outline" size={18} color="#A65C00" />
              <View style={styles.flex}>
                <AppText style={styles.warningTitle}>
                  Verify your mobile number
                </AppText>
                <AppText style={styles.warningText}>
                  We need a verified number to send order and delivery updates.
                </AppText>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <StepHeading
              step={1}
              title="Delivery address"
              done={!!selectedAddress}
            />
            <QueryState
              pending={addresses.isPending}
              error={addresses.error}
              retry={() => {
                addresses.refetch().catch(() => undefined);
              }}
            />
            {noAddresses ? (
              <AddAddressTile
                prominent
                onPress={() => openAddressForm()}
              />
            ) : (
              <>
                <View style={styles.addressList}>
                  {addresses.data?.items.map(address => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      selected={address.id === addressId}
                      onSelect={() => setAddressId(address.id)}
                      onEdit={() => openAddressForm(address.id)}
                    />
                  ))}
                </View>
                {!!addresses.data?.items.length && (
                  <AddAddressTile
                    prominent={false}
                    onPress={() => openAddressForm()}
                  />
                )}
              </>
            )}
            {selectedAddress && (
              <View style={styles.estimate}>
                <Ionicons
                  name="car-outline"
                  size={16}
                  color={theme.colors.primary}
                />
                <AppText style={styles.estimateText}>
                  {cart.isFetching && !data
                    ? 'Checking delivery estimate…'
                    : data?.estimatedDelivery
                    ? `Estimated delivery ${data.estimatedDelivery.display}`
                    : 'Delivery estimate unavailable for this address'}
                </AppText>
              </View>
            )}
          </View>

          {data && data.items.length === 0 && (
            <View style={styles.card}>
              <Feedback
                title="Your checkout is empty"
                message="Add products to your cart before proceeding to checkout."
              />
              <Button
                label="Browse products"
                onPress={() => router.push('/')}
              />
            </View>
          )}

          {hasItems && data && (
            <>
              <View style={styles.card}>
                <StepHeading
                  step={2}
                  title="Payment method"
                  done={!codSelectedButIneligible}
                />
                <View style={styles.paymentChoices}>
                  <PaymentOption
                    icon="card-outline"
                    title="Pay online"
                    subtitle="UPI, cards, net banking & wallets"
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
                        : effectiveCod.fee
                        ? `Pay on delivery · ${money(effectiveCod.fee)} COD fee`
                        : 'Pay the full amount on delivery'
                    }
                    selected={paymentMethod === 'cod'}
                    disabled={!effectiveCod?.eligible}
                    onPress={() => setPaymentMethod('cod')}
                  />
                </View>
              </View>

              <View style={styles.card}>
                <StepHeading
                  step={3}
                  title="Review items"
                  done
                  aside={`${itemCount} item${itemCount !== 1 ? 's' : ''}`}
                />
                {visibleItems?.map(item => (
                  <OrderItemRow key={item.id} item={item} />
                ))}
                {data.items.length > PREVIEW_ITEMS && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: showAllItems }}
                    onPress={() => setShowAllItems(v => !v)}
                    style={styles.showMore}
                  >
                    <AppText style={styles.showMoreText}>
                      {showAllItems
                        ? 'Show fewer items'
                        : `Show all ${data.items.length} items`}
                    </AppText>
                    <Ionicons
                      name={showAllItems ? 'chevron-up' : 'chevron-down'}
                      size={15}
                      color={theme.colors.primary}
                    />
                  </Pressable>
                )}
              </View>

              <View style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <Ionicons
                    name="pricetag-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <AppText style={styles.cardTitle}>Coupons & offers</AppText>
                </View>
                {couponResult ? (
                  <View style={styles.couponApplied}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <View style={styles.flex}>
                      <AppText style={styles.couponAppliedCode}>
                        {couponResult.code} applied
                      </AppText>
                      <AppText style={styles.couponAppliedSave}>
                        You save {money(couponResult.discount)}
                      </AppText>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove coupon ${couponResult.code}`}
                      onPress={removeCoupon}
                      hitSlop={8}
                    >
                      <AppText style={styles.removeCoupon}>Remove</AppText>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.couponRow}>
                    <TextInput
                      accessibilityLabel="Coupon code"
                      value={couponCode}
                      onChangeText={value => {
                        setCouponCode(value);
                        applyCoupon.reset();
                      }}
                      onSubmitEditing={applyCouponCode}
                      placeholder="Enter coupon code"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      returnKeyType="done"
                      placeholderTextColor="#9CA3AF"
                      style={[
                        styles.couponInput,
                        applyCoupon.isError && styles.couponInputError,
                      ]}
                    />
                    <Pressable
                      accessibilityRole="button"
                      disabled={applyCoupon.isPending || !couponCode.trim()}
                      onPress={applyCouponCode}
                      style={({ pressed }) => [
                        styles.couponApply,
                        (applyCoupon.isPending || !couponCode.trim()) &&
                          styles.couponApplyDisabled,
                        pressed && styles.pressed,
                      ]}
                    >
                      {applyCoupon.isPending ? (
                        <ActivityIndicator
                          size="small"
                          color={theme.colors.primary}
                        />
                      ) : (
                        <AppText style={styles.couponApplyText}>Apply</AppText>
                      )}
                    </Pressable>
                  </View>
                )}
                {applyCoupon.isError && (
                  <AppText style={styles.fieldError}>
                    {applyCoupon.error.message}
                  </AppText>
                )}
              </View>

              <View style={styles.card}>
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
                {couponResult && (
                  <View style={shop.between}>
                    <AppText style={styles.summaryLabel}>
                      Coupon ({couponResult.code})
                    </AppText>
                    <AppText style={styles.discountValue}>
                      −{money(couponResult.discount)}
                    </AppText>
                  </View>
                )}
                <View style={shop.between}>
                  <AppText style={styles.summaryLabel}>Delivery</AppText>
                  {cart.isFetching ? (
                    <AppText style={styles.summaryLabel}>…</AppText>
                  ) : data.shippingAmount === null ? (
                    <AppText style={styles.summaryLabel}>
                      Add an address
                    </AppText>
                  ) : data.shippingAmount === 0 ? (
                    <AppText style={styles.discountValue}>FREE</AppText>
                  ) : (
                    <AppText style={styles.summaryValue}>
                      {money(data.shippingAmount)}
                    </AppText>
                  )}
                </View>
                {codFee > 0 && (
                  <View style={shop.between}>
                    <AppText style={styles.summaryLabel}>COD fee</AppText>
                    <AppText style={styles.summaryValue}>
                      {money(codFee)}
                    </AppText>
                  </View>
                )}
                <View style={styles.payableRow}>
                  <AppText style={styles.payableLabel}>Total amount</AppText>
                  <AppText style={styles.payableLabel}>
                    {recalculating ? 'Calculating…' : money(total)}
                  </AppText>
                </View>
                {isPartialCod && !recalculating && (
                  <View style={styles.advanceBox}>
                    <View style={shop.between}>
                      <AppText style={styles.advanceHighlight}>
                        Pay now ({advancePercent}% advance)
                      </AppText>
                      <AppText style={styles.advanceHighlight}>
                        {money(advanceAmount)}
                      </AppText>
                    </View>
                    <View style={shop.between}>
                      <AppText style={styles.advanceMuted}>
                        Pay on delivery ({100 - advancePercent}%)
                      </AppText>
                      <AppText style={styles.advanceValue}>
                        {money(codBalance)}
                      </AppText>
                    </View>
                  </View>
                )}
                {totalSavings > 0 && (
                  <View style={styles.savingsBanner}>
                    <Ionicons
                      name="sparkles-outline"
                      size={15}
                      color={theme.colors.primary}
                    />
                    <AppText style={styles.savingsText}>
                      You're saving {money(totalSavings)} on this order
                    </AppText>
                  </View>
                )}
              </View>

              <View style={styles.trustRow}>
                <View style={styles.trustItem}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <AppText style={styles.trustLabel}>Secure payments</AppText>
                </View>
                <View style={styles.trustItem}>
                  <Ionicons
                    name="refresh-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <AppText style={styles.trustLabel}>Easy returns</AppText>
                </View>
                <View style={styles.trustItem}>
                  <Ionicons
                    name="ribbon-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <AppText style={styles.trustLabel}>Genuine products</AppText>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {hasItems && (
          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(12, insets.bottom) },
            ]}
          >
            {!!error && (
              <View accessibilityRole="alert" style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={theme.colors.danger}
                />
                <AppText style={styles.errorText}>{error}</AppText>
              </View>
            )}
            <View style={styles.bottomRow}>
              <View style={styles.bottomTotal}>
                <AppText style={styles.bottomAmount}>
                  {recalculating ? '…' : money(payNow)}
                </AppText>
                <AppText numberOfLines={2} style={styles.bottomCaption}>
                  {isPartialCod
                    ? `+ ${money(codBalance)} on delivery`
                    : totalSavings > 0
                    ? `Saving ${money(totalSavings)}`
                    : 'Total payable'}
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  ctaKind === 'commit' && !placing && !recalculating
                    ? `${ctaLabel}, ${money(payNow)}`
                    : ctaLabel
                }
                accessibilityState={{
                  disabled: ctaKind === 'commit' && ctaDisabled,
                  busy: placing,
                }}
                disabled={ctaKind === 'commit' && ctaDisabled}
                onPress={onCta}
                style={({ pressed }) => [
                  styles.cta,
                  ctaKind === 'setup' ? styles.ctaSetup : styles.ctaCommit,
                  ctaKind === 'commit' && ctaDisabled && styles.ctaDisabled,
                  pressed && styles.pressed,
                ]}
              >
                {placing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : ctaIcon ? (
                  <Ionicons
                    name={ctaIcon}
                    size={16}
                    color={
                      ctaKind === 'setup' ? theme.colors.primary : '#FFFFFF'
                    }
                  />
                ) : null}
                <AppText
                  numberOfLines={1}
                  style={[
                    styles.ctaText,
                    ctaKind === 'setup' && styles.ctaTextSetup,
                  ]}
                >
                  {ctaLabel}
                </AppText>
              </Pressable>
            </View>
          </View>
        )}
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
const PAGE_BG = '#F4F6F8';
const MUTED = '#6B7280';
const SOFT = '#E8F5F3';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { backgroundColor: PAGE_BG },
  body: { padding: 16, gap: 14, paddingBottom: 24 },
  skeletonScroll: { flexGrow: 1 },
  pressed: { opacity: 0.85 },
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 16,
    color: theme.colors.text,
  },
  secureStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secureStripText: { fontSize: 12, color: MUTED },

  // Steps
  stepHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9CA3AF',
  },
  stepBadgeDone: { backgroundColor: theme.colors.primary },
  stepBadgeText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
  },
  stepTitle: {
    flex: 1,
    fontFamily: theme.fonts.semibold,
    fontSize: 16,
    color: theme.colors.text,
  },
  stepAside: { fontSize: 13, color: MUTED },

  // Addresses
  addressList: { gap: 10 },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  addressCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F3FBF9',
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  addressName: { fontFamily: theme.fonts.semibold, fontSize: 14 },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: SOFT,
  },
  defaultBadgeText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontFamily: theme.fonts.semibold,
  },
  addressCardActions: { alignItems: 'center', gap: 10 },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  addressDetail: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  addressPhone: { color: MUTED, fontSize: 12, marginTop: 4 },
  addTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#9FD3CB',
    backgroundColor: '#FAFEFD',
  },
  addTileProminent: { paddingVertical: 18, backgroundColor: '#F3FBF9' },
  addTilePressed: { backgroundColor: SOFT },
  addTileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOFT,
  },
  addTileIconLarge: { width: 44, height: 44, borderRadius: 22 },
  addTileTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    color: theme.colors.primary,
  },
  addTileText: { fontSize: 12, lineHeight: 17, color: MUTED, marginTop: 2 },
  estimate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },
  estimateText: {
    flex: 1,
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
  },

  // Items
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontFamily: theme.fonts.medium, fontSize: 14, lineHeight: 19 },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  itemStrike: {
    color: MUTED,
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
  showMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },
  showMoreText: {
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
    color: theme.colors.primary,
  },

  // Payment
  paymentChoices: { gap: 10 },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  paymentOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F3FBF9',
  },
  paymentOptionDisabled: { opacity: 0.55 },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  paymentIconSelected: { backgroundColor: SOFT },
  paymentTitle: { fontFamily: theme.fonts.semibold, fontSize: 14 },
  paymentSubtitle: { color: MUTED, fontSize: 12, marginTop: 1 },
  paymentSubtitleError: { color: theme.colors.danger },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C4C9D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: theme.colors.primary },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },

  // Coupon
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  couponInput: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    letterSpacing: 0.5,
    color: theme.colors.text,
    backgroundColor: '#F9FAFB',
  },
  couponInputError: { borderColor: '#FCA5A5' },
  couponApply: {
    minWidth: 84,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  couponApplyDisabled: { borderColor: theme.colors.border },
  couponApplyText: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    color: theme.colors.primary,
  },
  couponApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9FD3CB',
    backgroundColor: '#F3FBF9',
  },
  couponAppliedCode: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    color: theme.colors.text,
  },
  couponAppliedSave: { fontSize: 12, color: theme.colors.primary },
  removeCoupon: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
  },
  fieldError: { color: theme.colors.danger, fontSize: 12, marginTop: -4 },

  // Price details
  summaryLabel: { fontSize: 14, color: '#4B5563' },
  summaryValue: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.text,
  },
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
  advanceBox: {
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
  },
  advanceMuted: { color: MUTED, fontSize: 13 },
  advanceValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
  },
  advanceHighlight: {
    color: '#1D4ED8',
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: SOFT,
    borderRadius: 10,
    padding: 10,
  },
  savingsText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontFamily: theme.fonts.semibold,
  },

  // Banners
  warningBanner: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCD9A0',
    backgroundColor: '#FEF7EC',
  },
  warningTitle: {
    color: '#92400E',
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
  },
  warningText: { color: '#A65C00', fontSize: 12, lineHeight: 17, marginTop: 2 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    flex: 1,
    color: theme.colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  trustItem: { flex: 1, alignItems: 'center', gap: 4 },
  trustLabel: { color: MUTED, fontSize: 11, textAlign: 'center' },

  // Sticky bottom bar
  bottomBar: {
    gap: 10,
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
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  // Amount block takes the spare width; the button sizes to its short label.
  bottomTotal: { flex: 1, minWidth: 0 },
  bottomAmount: {
    fontFamily: theme.fonts.bold,
    fontSize: 19,
    color: theme.colors.text,
  },
  bottomCaption: { fontSize: 11, color: theme.colors.primary },
  cta: {
    minWidth: 148,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 14,
  },
  ctaCommit: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  ctaSetup: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: '#FFFFFF', fontFamily: theme.fonts.semibold, fontSize: 15 },
  ctaTextSetup: { color: theme.colors.primary },

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
