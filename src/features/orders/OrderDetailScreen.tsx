import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import RazorpayCheckout, { RazorpayError } from 'react-native-razorpay';
import { AppText, Button, Feedback } from '../../components/ui';
import {
  OrderDetailSkeleton,
  ShopHeader,
  StoreImage,
  money,
  shop,
} from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import {
  type CancelResult,
  type LegacyTracking,
  type OrderDetail,
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
  useDownloadInvoice,
  useMaybePromptReview,
  useOrderDetail,
  useOrderTracking,
  useRetryPayment,
} from './hooks';
import { TrackingSummaryCard } from './TrackingViews';
import { CancelOrderSheet } from './CancelOrderSheet';
import { cancellationOutcome, refundSteps } from './cancellation';
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

const fmtDateTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

/** Why and when the order was cancelled, plus refund progress when a
 * captured payment is being returned. */
function CancellationCard({ order }: { order: OrderDetail }) {
  const c = order.cancelled!;
  const steps = order.refund ? refundSteps(order.refund) : [];
  return (
    <View style={[styles.section, styles.cancelCard]}>
      <View style={styles.cancelHead}>
        <View style={styles.cancelIcon}>
          <Ionicons name="close" size={16} color="#FFFFFF" />
        </View>
        <View style={shop.flex}>
          <AppText style={styles.cancelTitle}>
            {c.cancelledBy === 'admin'
              ? 'Cancelled by Elexify'
              : 'You cancelled this order'}
          </AppText>
          {!!c.cancelledAt && (
            <AppText style={shop.muted}>{fmtDateTime(c.cancelledAt)}</AppText>
          )}
        </View>
      </View>
      {!!c.reason && (
        <AppText style={styles.cancelReason}>
          Reason: {c.reason}
          {c.comment ? ` — ${c.comment}` : ''}
        </AppText>
      )}
      {!!order.refund && (
        <View style={styles.refundBox}>
          <View style={shop.between}>
            <AppText style={styles.refundTitle}>Refund</AppText>
            {order.refund.amount !== null && (
              <AppText style={styles.refundTitle}>
                {money(order.refund.amount)}
              </AppText>
            )}
          </View>
          {steps.map(step => (
            <View key={step.key} style={styles.refundStep}>
              <Ionicons
                name={
                  step.state === 'failed'
                    ? 'alert-circle'
                    : step.state === 'current'
                    ? 'time-outline'
                    : 'checkmark-circle'
                }
                size={16}
                color={
                  step.state === 'failed'
                    ? '#B45309'
                    : step.state === 'current'
                    ? theme.colors.secondary
                    : theme.colors.primary
                }
              />
              <AppText style={styles.refundLabel}>{step.label}</AppText>
              {!!step.at && (
                <AppText style={styles.refundDate}>
                  {fmtDateTime(step.at)}
                </AppText>
              )}
            </View>
          ))}
          <AppText style={styles.refundNote}>
            {order.refund.status === 'failed'
              ? "We couldn't start your refund automatically — our team will process it manually."
              : order.refund.status === 'processing'
              ? 'Refunds reach your original payment method in 5–7 working days.'
              : 'The amount has been returned to your original payment method.'}
          </AppText>
        </View>
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
  const downloadInvoice = useDownloadInvoice(data?.orderNumber ?? '');
  const [cancelling, setCancelling] = useState(false);
  const [cancelOutcome, setCancelOutcome] = useState<ReturnType<
    typeof cancellationOutcome
  > | null>(null);
  const [returning, setReturning] = useState(false);

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
            {cancelOutcome && (
              <View
                accessibilityRole="alert"
                style={[
                  styles.outcome,
                  cancelOutcome.tone === 'warning' && styles.outcomeWarning,
                ]}
              >
                <Ionicons
                  name={
                    cancelOutcome.tone === 'warning'
                      ? 'alert-circle'
                      : 'checkmark-circle'
                  }
                  size={18}
                  color={
                    cancelOutcome.tone === 'warning'
                      ? '#B45309'
                      : theme.colors.primary
                  }
                />
                <AppText style={styles.outcomeText}>
                  {cancelOutcome.message}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss"
                  hitSlop={10}
                  onPress={() => setCancelOutcome(null)}
                >
                  <Ionicons
                    name="close"
                    size={16}
                    color={theme.colors.secondary}
                  />
                </Pressable>
              </View>
            )}
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

            {data.cancelled && <CancellationCard order={data} />}

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
            {data.cancellation.allowed && !data.cancelled && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setCancelling(true)}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.cancelButtonPressed,
                ]}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.danger}
                />
                <AppText style={styles.cancelButtonText}>Cancel order</AppText>
              </Pressable>
            )}
            {!data.cancellation.allowed &&
              !data.cancelled &&
              !!data.cancellation.reason && (
                <AppText style={shop.muted}>{data.cancellation.reason}</AppText>
              )}
          </>
        )}
      </ScrollView>
      {returning && data && (
        <ReturnRequestSheet order={data} onClose={() => setReturning(false)} />
      )}
      {cancelling && data && (
        <CancelOrderSheet
          order={data}
          onClose={() => setCancelling(false)}
          onCancelled={(result: CancelResult) => {
            setCancelOutcome(cancellationOutcome(data, result));
            tracking.refetch().catch(() => undefined);
          }}
        />
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
  outcome: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.primaryLight,
  },
  outcomeWarning: { backgroundColor: '#FFFBEB' },
  outcomeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.text,
  },
  cancelCard: { borderColor: '#FECACA', backgroundColor: '#FFFBFB' },
  cancelHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cancelIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.danger,
  },
  cancelTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
    color: theme.colors.text,
  },
  cancelReason: { fontSize: 13, lineHeight: 19, color: '#4B5563' },
  refundBox: {
    gap: 8,
    marginTop: 4,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  refundTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    color: theme.colors.text,
  },
  refundStep: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  refundLabel: { flex: 1, fontSize: 13, color: theme.colors.text },
  refundDate: { fontSize: 11, color: theme.colors.secondary },
  refundNote: { fontSize: 12, lineHeight: 17, color: theme.colors.secondary },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: theme.radius.button,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  cancelButtonPressed: { backgroundColor: '#FEF2F2' },
  cancelButtonText: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
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
