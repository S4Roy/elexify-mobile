import React, { useEffect, useState } from 'react';
import {
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
  Chip,
  OrderDetailSkeleton,
  ShopHeader,
  StoreImage,
  money,
  shop,
} from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import {
  CANCELLATION_REASONS,
  type LegacyTracking,
  type OrderPackage,
} from '../../api/order';
import { openWebsite } from '../catalog/links';
import { isRazorpayCancelled } from '../checkout/friendlyReason';
import { useVerifyPayment } from '../checkout/hooks';
import {
  PACKAGE_STATUS_LABELS,
  PACKAGE_STEPS,
  canDownloadInvoice,
  orderStatusColor,
  orderStatusLabel,
  packageStepDate,
  packageStepReached,
  paymentStatusColor,
  showsPackageProgress,
} from './tracking';
import {
  useCancelOrder,
  useDownloadInvoice,
  useMaybePromptReview,
  useOrderDetail,
  useOrderTracking,
  useRetryPayment,
} from './hooks';
import { TrackingSummaryCard } from './TrackingViews';
import { ReturnRequestSheet } from './ReturnRequestSheet';

const RETRY_WINDOW_MS = 60 * 60 * 1000;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? '';
const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

function PackageCard({ pkg }: { pkg: OrderPackage }) {
  const [showLog, setShowLog] = useState(false);
  const progress = showsPackageProgress(pkg);
  return (
    <View style={styles.packageCard}>
      <View style={shop.between}>
        <AppText style={styles.packageTitle}>
          Package {pkg.packageNumber}
          {pkg.itemCount
            ? ` · ${pkg.itemCount} item${pkg.itemCount === 1 ? '' : 's'}`
            : ''}
        </AppText>
        <AppText style={styles.packageStatus}>
          {PACKAGE_STATUS_LABELS[pkg.status] ?? pkg.status}
        </AppText>
      </View>

      {(pkg.courierName || pkg.awb) && (
        <AppText style={shop.muted}>
          {[pkg.courierName, pkg.awb ? `AWB: ${pkg.awb}` : null]
            .filter(Boolean)
            .join(' · ')}
        </AppText>
      )}

      {pkg.status === 'delivered' && pkg.deliveredAt ? (
        <AppText style={styles.deliveredBanner}>
          Delivered on {formatDate(pkg.deliveredAt)}
        </AppText>
      ) : pkg.etd && !['cancelled', 'returned'].includes(pkg.status) ? (
        <AppText style={styles.etdBanner}>
          Estimated delivery: {pkg.etd}
        </AppText>
      ) : null}

      {progress && (
        <View style={styles.steps}>
          {PACKAGE_STEPS.map(step => {
            const reached = packageStepReached(pkg, step);
            const date = formatDate(packageStepDate(pkg, step));
            return (
              <View key={step} style={styles.stepRow}>
                <View
                  style={[styles.stepDot, reached && styles.stepDotActive]}
                />
                <AppText
                  style={[styles.stepLabel, reached && styles.stepLabelActive]}
                >
                  {PACKAGE_STATUS_LABELS[step]}
                </AppText>
                <AppText style={styles.stepDate}>
                  {date ?? (reached ? '' : 'Pending')}
                </AppText>
              </View>
            );
          })}
        </View>
      )}

      {!!pkg.trackingEvents.length && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowLog(v => !v)}
          style={styles.logToggle}
        >
          <AppText style={shop.link}>
            {showLog ? 'Hide' : 'View'} tracking updates
          </AppText>
          <Ionicons
            name={showLog ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.colors.primary}
          />
        </Pressable>
      )}
      {showLog && (
        <View style={styles.log}>
          {[...pkg.trackingEvents].reverse().map((event, index) => (
            <AppText key={`${event.status}-${index}`} style={styles.logRow}>
              <AppText style={styles.logStatus}>
                {PACKAGE_STATUS_LABELS[event.status] || 'Tracking update'}
              </AppText>
              {event.occurredAt ? `  ${formatDate(event.occurredAt)}` : ''}
            </AppText>
          ))}
        </View>
      )}

      {pkg.trackingUrl?.startsWith('https://') ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => openWebsite(pkg.trackingUrl!)}
          style={styles.trackButton}
        >
          <Ionicons
            name="navigate-outline"
            size={15}
            color={theme.colors.primary}
          />
          <AppText style={shop.link}>Track package {pkg.packageNumber}</AppText>
        </Pressable>
      ) : !['cancelled', 'returned', 'delivered'].includes(pkg.status) ? (
        <AppText style={styles.trackingUnavailable}>
          {pkg.awb
            ? 'Live tracking link will appear when the courier provides it.'
            : 'Tracking will be available after dispatch.'}
        </AppText>
      ) : null}
    </View>
  );
}

function LegacyTrackingCard({ tracking }: { tracking: LegacyTracking }) {
  return (
    <View style={styles.packageCard}>
      {tracking.shiprocketStatus && (
        <AppText style={styles.packageTitle}>
          {tracking.shiprocketStatus}
        </AppText>
      )}
      {(tracking.courierName || tracking.awb) && (
        <AppText style={shop.muted}>
          {[tracking.courierName, tracking.awb ? `AWB: ${tracking.awb}` : null]
            .filter(Boolean)
            .join(' · ')}
        </AppText>
      )}
      {tracking.etd && (
        <AppText style={styles.etdBanner}>
          Estimated delivery: {tracking.etd}
        </AppText>
      )}
    </View>
  );
}

export default function OrderDetailScreen() {
  const route = useLocalSearchParams<{ id: string }>();
  const id = first(route.id);
  const order = useOrderDetail(id);
  const data = order.data;
  const tracking = useOrderTracking(id);
  useMaybePromptReview(data?.orderStatus);
  const cancelOrder = useCancelOrder(id);
  const downloadInvoice = useDownloadInvoice(data?.orderNumber ?? '');
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [returning, setReturning] = useState(false);
  const needsComment = reason === 'Other';
  const canConfirmCancel =
    !!reason && (!needsComment || comment.trim().length > 0);

  // Ticks so the retry-window gate (canRetryPayment below) flips off live
  // once the hour elapses, instead of only re-checking on the next refetch.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const retryPayment = useRetryPayment();
  const verifyPayment = useVerifyPayment();
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const retryExpiresAt = data
    ? new Date(data.createdAt).getTime() + RETRY_WINDOW_MS
    : 0;
  const hasUnpaidOnlinePayment =
    !!data &&
    (data.paymentMethod === 'razorpay' ||
      (data.paymentMethod === 'cod' && data.isPartialCod)) &&
    ['pending', 'failed'].includes(data.paymentStatus) &&
    data.orderStatus === 'pending';
  const canRetryPayment =
    hasUnpaidOnlinePayment &&
    Number.isFinite(retryExpiresAt) &&
    now < retryExpiresAt;

  const onRetryPayment = async () => {
    if (!canRetryPayment || !data || retrying) {
      return;
    }
    setRetryError(null);
    setRetrying(true);
    try {
      const payment = await retryPayment.mutateAsync(data.id);
      let result;
      try {
        result = await RazorpayCheckout.open({
          key: payment.checkoutKeyId,
          order_id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          name: 'Elexify',
          description: `Payment for order #${data.orderNumber}`,
          theme: { color: theme.colors.primary },
        });
      } catch (razorpayError) {
        const err = razorpayError as Partial<RazorpayError> | undefined;
        if (!isRazorpayCancelled(err)) {
          setRetryError(
            'Payment failed. You can retry within one hour of placing this order.',
          );
        }
        return;
      }
      await verifyPayment.mutateAsync({
        orderNumber: payment.orderNumber,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpayOrderId: result.razorpay_order_id,
        razorpaySignature: result.razorpay_signature,
      });
      await order.refetch();
      tracking.refetch().catch(() => undefined);
    } catch (err) {
      setRetryError(
        err instanceof Error ? err.message : 'Unable to retry payment.',
      );
    } finally {
      setRetrying(false);
    }
  };

  // Mirrors elexify.online's order-detail MRP/discount breakdown, which is
  // derived client-side from the line items rather than a dedicated backend
  // field — an item's regular_price stands in for its MRP when present.
  const itemCount =
    data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const mrpSubtotal =
    data?.items.reduce((sum, item) => {
      const unit =
        item.regularPrice !== null && item.regularPrice > 0
          ? item.regularPrice
          : item.price ?? 0;
      return sum + unit * item.quantity;
    }, 0) ?? 0;
  const itemsPayable =
    data?.items.reduce(
      (sum, item) =>
        sum + (item.totalPrice ?? (item.price ?? 0) * item.quantity),
      0,
    ) ?? 0;
  const productDiscount = Math.max(0, mrpSubtotal - itemsPayable);
  const couponDiscount = data?.discount ?? 0;
  const totalSavings = productDiscount + couponDiscount;

  return (
    <View style={shop.page}>
      <ShopHeader title={data?.orderNumber || 'Order'} back />
      <ScrollView contentContainerStyle={styles.body}>
        <QueryState
          pending={order.isPending}
          error={order.error}
          paused={order.fetchStatus === 'paused'}
          retry={() => {
            order.refetch().catch(() => undefined);
          }}
          skeleton={<OrderDetailSkeleton />}
        />
        {!order.isPending && !order.isError && !data && (
          <Feedback
            title="Order not found"
            message="We couldn't load this order."
          />
        )}
        {data && (
          <>
            <View style={styles.section}>
              <View style={styles.statusPillRow}>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: orderStatusColor(data.orderStatus).bg },
                  ]}
                >
                  <AppText
                    style={[
                      styles.statusPillText,
                      { color: orderStatusColor(data.orderStatus).text },
                    ]}
                  >
                    {orderStatusLabel(data.orderStatus)}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: paymentStatusColor(data.paymentStatus)
                        .bg,
                    },
                  ]}
                >
                  <AppText
                    style={[
                      styles.statusPillText,
                      { color: paymentStatusColor(data.paymentStatus).text },
                    ]}
                  >
                    {orderStatusLabel(data.paymentStatus)}
                  </AppText>
                </View>
              </View>
              <AppText style={shop.muted}>
                {data.paymentMethod === 'cod'
                  ? 'Cash on delivery'
                  : 'Paid online'}{' '}
                · Placed on {formatDate(data.createdAt)}
              </AppText>
              {canRetryPayment && (
                <View style={styles.retryButtonWrap}>
                  <Button
                    label={retrying ? 'Opening payment…' : 'Retry payment'}
                    disabled={retrying}
                    icon={
                      <Ionicons name="card-outline" size={16} color="#FFFFFF" />
                    }
                    onPress={onRetryPayment}
                  />
                </View>
              )}
              {!!retryError && (
                <AppText style={styles.error}>{retryError}</AppText>
              )}
              {hasUnpaidOnlinePayment && (
                <AppText style={shop.muted}>
                  {canRetryPayment
                    ? `Payment can be retried until ${new Date(
                        retryExpiresAt,
                      ).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}.`
                    : 'The one-hour payment retry window has expired. Please place a new order.'}
                </AppText>
              )}
              {canDownloadInvoice(data) && (
                <Pressable
                  accessibilityRole="button"
                  disabled={downloadInvoice.isPending}
                  onPress={() => downloadInvoice.mutate(data.id)}
                  style={styles.receiptButton}
                >
                  <Ionicons
                    name="download-outline"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <AppText style={shop.link}>
                    {downloadInvoice.isPending
                      ? 'Preparing receipt…'
                      : 'Download receipt'}
                  </AppText>
                </Pressable>
              )}
              {downloadInvoice.isError && (
                <AppText style={styles.error}>
                  {downloadInvoice.error.message}
                </AppText>
              )}
            </View>

            {tracking.data ? (
              <TrackingSummaryCard
                data={tracking.data}
                onOpen={() =>
                  router.push({
                    pathname: '/orders/[id]/track',
                    params: { id: data.id },
                  })
                }
              />
            ) : (
              // Fallback while tracking is loading or unavailable: the
              // package status straight from the order payload.
              (!!data.packages.length || data.legacyTracking) && (
                <View style={styles.section}>
                  <AppText style={shop.heading}>Packages & Tracking</AppText>
                  {data.packages.map(pkg => (
                    <PackageCard key={pkg.packageNumber} pkg={pkg} />
                  ))}
                  {!data.packages.length && data.legacyTracking && (
                    <LegacyTrackingCard tracking={data.legacyTracking} />
                  )}
                </View>
              )
            )}

            <View style={styles.section}>
              <AppText style={shop.heading}>Items</AppText>
              {data.items.map(item => {
                const lineTotal =
                  item.totalPrice ?? (item.price ?? 0) * item.quantity;
                return (
                  <View key={item.id} style={styles.itemRow}>
                    <StoreImage
                      uri={item.image}
                      label={item.name}
                      style={styles.itemImage}
                    />
                    <View style={shop.flex}>
                      <AppText style={styles.itemName}>{item.name}</AppText>
                      <AppText style={shop.muted}>Qty {item.quantity}</AppText>
                      <View style={styles.itemPriceRow}>
                        {!!item.discountPercent &&
                        item.regularPrice !== null ? (
                          <>
                            <AppText style={styles.itemStrike}>
                              {money(item.regularPrice)}
                            </AppText>
                            <AppText style={styles.itemPrice}>
                              {item.price === null ? '—' : money(item.price)}{' '}
                              each
                            </AppText>
                          </>
                        ) : (
                          <AppText style={styles.itemPrice}>
                            {item.price === null
                              ? '—'
                              : `${money(item.price)} each`}
                          </AppText>
                        )}
                      </View>
                    </View>
                    <AppText style={styles.itemTotal}>
                      {money(lineTotal)}
                    </AppText>
                  </View>
                );
              })}
            </View>

            <View style={styles.section}>
              <AppText style={shop.heading}>Order Summary</AppText>
              <View style={shop.between}>
                <AppText style={shop.muted}>
                  MRP / Subtotal ({itemCount} item{itemCount === 1 ? '' : 's'})
                </AppText>
                <AppText style={styles.summaryValue}>
                  {money(mrpSubtotal)}
                </AppText>
              </View>
              {productDiscount > 0 && (
                <View style={shop.between}>
                  <AppText style={styles.discountLabel}>
                    Product Discount
                  </AppText>
                  <AppText style={styles.discountLabel}>
                    −{money(productDiscount)}
                  </AppText>
                </View>
              )}
              {couponDiscount > 0 && (
                <View style={shop.between}>
                  <AppText style={styles.discountLabel}>
                    Coupon Discount
                  </AppText>
                  <AppText style={styles.discountLabel}>
                    −{money(couponDiscount)}
                  </AppText>
                </View>
              )}
              {data.shipping !== null && (
                <View style={shop.between}>
                  <AppText style={shop.muted}>Shipping Charge</AppText>
                  {data.shipping === 0 ? (
                    <AppText style={styles.discountLabel}>Free</AppText>
                  ) : (
                    <AppText style={styles.summaryValue}>
                      {money(data.shipping)}
                    </AppText>
                  )}
                </View>
              )}
              {!!data.codFee && (
                <View style={shop.between}>
                  <AppText style={shop.muted}>COD Fee</AppText>
                  <AppText style={styles.summaryValue}>
                    {money(data.codFee)}
                  </AppText>
                </View>
              )}
              <View style={styles.payableRow}>
                <AppText style={styles.total}>Amount Payable</AppText>
                <AppText style={styles.total}>{money(data.grandTotal)}</AppText>
              </View>
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
              {data.isPartialCod && (
                <View style={styles.advanceBox}>
                  <View style={shop.between}>
                    <AppText style={styles.advanceMuted}>Amount Paid</AppText>
                    <AppText style={styles.advanceValue}>
                      {money(data.advanceAmount ?? 0)}
                    </AppText>
                  </View>
                  <View style={shop.between}>
                    <AppText style={styles.advanceMuted}>
                      Amount Due on Delivery
                    </AppText>
                    <AppText style={styles.advanceValue}>
                      {money(data.codDueAmount ?? 0)}
                    </AppText>
                  </View>
                </View>
              )}
            </View>

            {data.returns.allowed && (
              <Button
                label="Request return"
                onPress={() => setReturning(true)}
              />
            )}
            {data.cancellation.allowed && !cancelling && (
              <Button
                label="Cancel order"
                onPress={() => setCancelling(true)}
              />
            )}
            {!data.cancellation.allowed && !!data.cancellation.reason && (
              <AppText style={shop.muted}>{data.cancellation.reason}</AppText>
            )}
            {cancelling && (
              <View style={styles.section}>
                <AppText style={shop.heading}>Why are you cancelling?</AppText>
                <View style={styles.wrap}>
                  {CANCELLATION_REASONS.map(option => (
                    <Chip
                      key={option}
                      label={option}
                      selected={reason === option}
                      onPress={() => setReason(option)}
                    />
                  ))}
                </View>
                {needsComment && (
                  <TextInput
                    accessibilityLabel="Tell us more"
                    value={comment}
                    onChangeText={setComment}
                    placeholder="Tell us more"
                    placeholderTextColor={theme.colors.secondary}
                    style={styles.input}
                  />
                )}
                {cancelOrder.isError && (
                  <AppText style={styles.error}>
                    {cancelOrder.error.message}
                  </AppText>
                )}
                <Button
                  label={
                    cancelOrder.isPending
                      ? 'Cancelling…'
                      : 'Confirm cancellation'
                  }
                  disabled={!canConfirmCancel || cancelOrder.isPending}
                  onPress={() => {
                    cancelOrder.mutate(
                      {
                        reason,
                        comment: needsComment ? comment.trim() : undefined,
                      },
                      { onSuccess: () => setCancelling(false) },
                    );
                  }}
                />
                <AppText
                  accessibilityRole="button"
                  onPress={() => setCancelling(false)}
                  style={shop.link}
                >
                  Never mind
                </AppText>
              </View>
            )}
          </>
        )}
      </ScrollView>
      {returning && data && (
        <ReturnRequestSheet order={data} onClose={() => setReturning(false)} />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  body: { padding: 16, gap: 16 },
  section: {
    gap: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    backgroundColor: '#FFFFFF',
  },
  statusPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  statusPillText: { fontSize: 11, fontFamily: theme.fonts.semibold },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F0F1F3',
  },
  itemName: { fontFamily: theme.fonts.medium, fontSize: 14 },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
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
  itemTotal: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    alignSelf: 'flex-start',
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
  payableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    marginTop: 2,
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
  advanceBox: {
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
  },
  advanceMuted: { color: theme.colors.secondary, fontSize: 12 },
  advanceValue: {
    color: '#1D4ED8',
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
  },
  total: { fontFamily: theme.fonts.bold, fontSize: 15 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
  },
  error: { color: theme.colors.danger },
  retryButtonWrap: { marginTop: 6 },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  packageCard: {
    gap: 6,
    padding: 14,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  packageTitle: { fontFamily: theme.fonts.medium, fontSize: 14 },
  packageStatus: {
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
    color: theme.colors.primary,
  },
  deliveredBanner: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
  },
  etdBanner: { color: theme.colors.primary, fontSize: 13 },
  steps: { marginTop: 8, gap: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  stepDotActive: { backgroundColor: theme.colors.primary },
  stepLabel: { flex: 1, fontSize: 12, color: theme.colors.secondary },
  stepLabelActive: { color: theme.colors.text, fontFamily: theme.fonts.medium },
  stepDate: { fontSize: 11, color: theme.colors.secondary },
  logToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  log: {
    gap: 6,
    marginTop: 4,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.primaryLight,
  },
  logRow: { fontSize: 12, color: theme.colors.secondary },
  logStatus: { fontFamily: theme.fonts.medium, color: theme.colors.text },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  trackingUnavailable: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 4,
  },
});
