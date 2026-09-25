import React, { useState } from 'react';
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
  type OrderItem,
  type OrderPackage,
} from '../../api/order';
import type { TrackingShipment } from '../../api/tracking';
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
  packageStatusColor,
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
import { ActivityLog, TrackingSummaryCard } from './TrackingViews';
import { fmtDateTime } from './trackingFormat';
import { CancelOrderSheet } from './CancelOrderSheet';
import { PaymentRetryCard } from './PaymentRetryCard';
import { cancellationOutcome, refundSteps } from './cancellation';
import { ReturnRequestSheet } from './ReturnRequestSheet';

const RETRY_WINDOW_MS = 60 * 60 * 1000;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? '';
function PackageCard({
  pkg,
  orderItems,
  shipment,
}: {
  pkg: OrderPackage;
  orderItems: OrderItem[];
  /** The tracking API's view of this package, with the full courier log. */
  shipment?: TrackingShipment;
}) {
  const [showLog, setShowLog] = useState(false);
  const progress = showsPackageProgress(pkg);
  const tone = packageStatusColor(pkg.status);
  const units = pkg.items.reduce((sum, line) => sum + line.quantity, 0);
  const open = !['cancelled', 'returned', 'delivered'].includes(pkg.status);
  return (
    <View style={styles.packageCard}>
      <View style={styles.packageHead}>
        <View style={styles.packageIcon}>
          <Ionicons
            name="cube-outline"
            size={16}
            color={theme.colors.primary}
          />
        </View>
        <View style={shop.flex}>
          <AppText style={styles.packageTitle}>
            Package {pkg.packageNumber}
          </AppText>
          <AppText style={styles.packageMeta}>
            {pkg.items.length
              ? `${units} unit${units === 1 ? '' : 's'} · ${
                  pkg.items.length
                } product${pkg.items.length === 1 ? '' : 's'}`
              : pkg.itemCount
              ? `${pkg.itemCount} item${pkg.itemCount === 1 ? '' : 's'}`
              : ''}
            {pkg.referenceId
              ? `${pkg.items.length || pkg.itemCount ? ' · ' : ''}Ref ${
                  pkg.referenceId
                }`
              : ''}
          </AppText>
        </View>
        <View style={[styles.packageBadge, { backgroundColor: tone.bg }]}>
          <AppText style={[styles.packageBadgeText, { color: tone.text }]}>
            {PACKAGE_STATUS_LABELS[pkg.status] ?? pkg.status}
          </AppText>
        </View>
      </View>

      {!!pkg.items.length && (
        <View style={styles.packageItems}>
          {pkg.items.map(line => {
            const item = orderItems.find(i => i.id === line.orderItemId);
            return (
              <View key={line.orderItemId} style={styles.packageItem}>
                <StoreImage
                  uri={item?.image}
                  label={item?.name ?? ''}
                  style={styles.packageItemImage}
                />
                <AppText style={styles.packageItemName} numberOfLines={2}>
                  {item?.name || 'Product unavailable'}
                </AppText>
                <View style={styles.packageQty}>
                  <AppText style={styles.packageQtyText}>
                    ×{line.quantity}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {(pkg.courierName || pkg.awb || pkg.shiprocketStatus) && (
        <View style={styles.packageInfo}>
          {!!pkg.courierName && (
            <View style={shop.between}>
              <AppText style={styles.infoLabel}>Courier</AppText>
              <AppText style={styles.infoValue}>{pkg.courierName}</AppText>
            </View>
          )}
          {!!pkg.awb && (
            <View style={shop.between}>
              <AppText style={styles.infoLabel}>AWB</AppText>
              <AppText selectable style={styles.infoValue}>
                {pkg.awb}
              </AppText>
            </View>
          )}
          {!!pkg.shiprocketStatus && (
            <View style={shop.between}>
              <AppText style={styles.infoLabel}>Courier status</AppText>
              <AppText style={styles.infoValue}>{pkg.shiprocketStatus}</AppText>
            </View>
          )}
          {!!pkg.shiprocketStatusUpdatedAt && (
            <View style={shop.between}>
              <AppText style={styles.infoLabel}>Updated</AppText>
              <AppText style={styles.infoValue}>
                {fmtDateTime(pkg.shiprocketStatusUpdatedAt)}
              </AppText>
            </View>
          )}
        </View>
      )}

      {pkg.status === 'delivered' && pkg.deliveredAt ? (
        <AppText style={[styles.banner, styles.bannerSuccess]}>
          Delivered on {fmtDateTime(pkg.deliveredAt)}
        </AppText>
      ) : pkg.etd && !['cancelled', 'returned'].includes(pkg.status) ? (
        <AppText style={[styles.banner, styles.bannerPrimary]}>
          Estimated delivery: {pkg.etd}
        </AppText>
      ) : open ? (
        <AppText style={[styles.banner, styles.bannerMuted]}>
          Estimated delivery will appear when the courier provides it.
        </AppText>
      ) : null}

      {progress && (
        <View
          style={styles.steps}
          accessibilityLabel={`Package ${pkg.packageNumber} delivery progress`}
        >
          {PACKAGE_STEPS.map((step, index) => {
            const reached = packageStepReached(pkg, step);
            const nextReached =
              index < PACKAGE_STEPS.length - 1 &&
              packageStepReached(pkg, PACKAGE_STEPS[index + 1]);
            const date = packageStepDate(pkg, step);
            return (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepRail}>
                  <View
                    style={[styles.stepDot, reached && styles.stepDotActive]}
                  />
                  {index < PACKAGE_STEPS.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        nextReached && styles.stepLineActive,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.stepText}>
                  <AppText
                    style={[
                      styles.stepLabel,
                      reached && styles.stepLabelActive,
                    ]}
                  >
                    {PACKAGE_STATUS_LABELS[step]}
                  </AppText>
                  <AppText style={styles.stepDate}>
                    {date
                      ? fmtDateTime(date)
                      : reached
                      ? 'Time unavailable'
                      : 'Pending'}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {shipment ? (
        <View style={styles.history}>
          <AppText style={styles.historyLabel}>Tracking history</AppText>
          <ActivityLog
            events={shipment.events}
            initialCount={3}
            emptyText={
              pkg.awb
                ? "The courier hasn't shared any updates yet."
                : 'Updates will appear once this package is handed to the courier.'
            }
          />
        </View>
      ) : (
        !!pkg.trackingEvents.length && (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: showLog }}
              onPress={() => setShowLog(v => !v)}
              style={styles.logToggle}
            >
              <AppText style={shop.link}>
                {showLog ? 'Hide' : 'View'} package {pkg.packageNumber} tracking
                updates
              </AppText>
              <Ionicons
                name={showLog ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.colors.primary}
              />
            </Pressable>
            {showLog && (
              <View style={styles.log}>
                {[...pkg.trackingEvents].reverse().map((event, index) => (
                  <AppText
                    key={`${event.status}-${index}`}
                    style={styles.logRow}
                  >
                    <AppText style={styles.logStatus}>
                      {PACKAGE_STATUS_LABELS[event.status] || 'Tracking update'}
                    </AppText>
                    {event.occurredAt
                      ? `  ${fmtDateTime(event.occurredAt)}`
                      : ''}
                  </AppText>
                ))}
              </View>
            )}
          </>
        )
      )}

      {pkg.trackingUrl?.startsWith('https://') ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => openWebsite(pkg.trackingUrl!)}
          style={({ pressed }) => [
            styles.trackButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="navigate-outline"
            size={15}
            color={theme.colors.primary}
          />
          <AppText style={shop.link}>Track package {pkg.packageNumber}</AppText>
        </Pressable>
      ) : open ? (
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
        <AppText style={[styles.banner, styles.bannerPrimary]}>
          Estimated delivery: {tracking.etd}
        </AppText>
      )}
    </View>
  );
}

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
  // PaymentRetryCard runs the live countdown and swaps to its closed state at
  // the deadline; this re-check only guards a tap racing that moment.
  const onRetryPayment = async () => {
    const canRetryPayment =
      hasUnpaidOnlinePayment &&
      Number.isFinite(retryExpiresAt) &&
      Date.now() < retryExpiresAt;
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
                {data.paymentMethod !== 'cod'
                  ? 'Online payment'
                  : data.isPartialCod
                  ? 'Partial Cash on Delivery'
                  : 'Cash on Delivery'}{' '}
                · Placed on {fmtDateTime(data.createdAt)}
              </AppText>
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

            {hasUnpaidOnlinePayment && (
              <PaymentRetryCard
                amount={
                  data.isPartialCod
                    ? data.advanceAmount ?? data.grandTotal
                    : data.grandTotal
                }
                isAdvance={data.isPartialCod}
                failed={data.paymentStatus === 'failed'}
                placedAt={new Date(data.createdAt).getTime()}
                windowMs={RETRY_WINDOW_MS}
                retrying={retrying}
                error={retryError}
                onPay={onRetryPayment}
              />
            )}

            {data.cancelled && <CancellationCard order={data} />}

            {!!tracking.data && (
              <TrackingSummaryCard
                data={tracking.data}
                onOpen={() =>
                  router.push({
                    pathname: '/orders/[id]/track',
                    params: { id: data.id },
                  })
                }
              />
            )}

            {/* One card per package, as on the website — shown alongside the
                tracking summary, not only while it loads. */}
            {(!!data.packages.length || data.legacyTracking) && (
              <View style={styles.section}>
                <View style={shop.between}>
                  <AppText style={shop.heading}>
                    {data.packages.length > 1
                      ? 'Packages & Tracking'
                      : 'Shipment Tracking'}
                  </AppText>
                  {data.packages.length > 1 && (
                    <AppText style={shop.muted}>
                      {data.packages.length} shipments
                    </AppText>
                  )}
                </View>
                {data.packages.map(pkg => (
                  <PackageCard
                    key={pkg.packageNumber}
                    pkg={pkg}
                    orderItems={data.items}
                    shipment={tracking.data?.shipments.find(
                      s => s.packageNumber === pkg.packageNumber,
                    )}
                  />
                ))}
                {!data.packages.length && data.legacyTracking && (
                  <LegacyTrackingCard tracking={data.legacyTracking} />
                )}
              </View>
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
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  pressed: { opacity: 0.6 },
  packageCard: {
    gap: 12,
    padding: 14,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  packageHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  packageIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  packageTitle: { fontFamily: theme.fonts.semibold, fontSize: 14 },
  packageMeta: { fontSize: 11, color: theme.colors.secondary, marginTop: 1 },
  packageBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  packageBadgeText: { fontSize: 11, fontFamily: theme.fonts.semibold },
  packageItems: {
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  packageItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  packageItemImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  packageItemName: { flex: 1, fontSize: 13, lineHeight: 18, color: '#374151' },
  packageQty: {
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  packageQtyText: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: '#374151',
  },
  packageInfo: {
    gap: 6,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    padding: 12,
  },
  infoLabel: { fontSize: 12, color: theme.colors.secondary },
  infoValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  banner: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    overflow: 'hidden',
  },
  bannerSuccess: {
    backgroundColor: '#F0FDF4',
    color: '#15803D',
    fontFamily: theme.fonts.medium,
  },
  bannerPrimary: {
    backgroundColor: theme.colors.primaryLight,
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  bannerMuted: { backgroundColor: '#F9FAFB', color: theme.colors.secondary },
  steps: { paddingTop: 2 },
  stepRow: { flexDirection: 'row', gap: 10 },
  stepRail: { alignItems: 'center', width: 10 },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    backgroundColor: theme.colors.border,
  },
  stepDotActive: { backgroundColor: theme.colors.primary },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 16,
    marginVertical: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.border,
  },
  stepLineActive: { backgroundColor: '#80BCB4' },
  stepText: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: 8,
    paddingBottom: 12,
  },
  stepLabel: { fontSize: 13, color: '#9CA3AF' },
  stepLabelActive: { color: theme.colors.text, fontFamily: theme.fonts.medium },
  stepDate: { fontSize: 12, color: theme.colors.secondary },
  history: {
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FBFCFC',
    padding: 12,
  },
  historyLabel: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: theme.fonts.semibold,
    color: theme.colors.secondary,
  },
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
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  trackingUnavailable: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 4,
  },
});
