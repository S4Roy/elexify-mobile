import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { AppText, Button, Feedback } from '../../components/ui';
import { Chip, ShopHeader, StoreImage, money, shop } from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { CANCELLATION_REASONS, type LegacyTracking, type OrderPackage } from '../../api/order';
import { openWebsite } from '../catalog/links';
import {
  PACKAGE_STATUS_LABELS,
  PACKAGE_STEPS,
  canDownloadInvoice,
  packageStepDate,
  packageStepReached,
  showsPackageProgress,
} from './tracking';
import { useCancelOrder, useDownloadInvoice, useMaybePromptReview, useOrderDetail } from './hooks';
import { ReturnRequestSheet } from './ReturnRequestSheet';

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? '';
const statusLabel = (status: string) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ') : 'Pending';
const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : null;

function PackageCard({ pkg }: { pkg: OrderPackage }) {
  const [showLog, setShowLog] = useState(false);
  const progress = showsPackageProgress(pkg);
  return (
    <View style={styles.packageCard}>
      <View style={shop.between}>
        <AppText style={styles.packageTitle}>
          Package {pkg.packageNumber}
          {pkg.itemCount ? ` · ${pkg.itemCount} item${pkg.itemCount === 1 ? '' : 's'}` : ''}
        </AppText>
        <AppText style={styles.packageStatus}>{PACKAGE_STATUS_LABELS[pkg.status] ?? pkg.status}</AppText>
      </View>

      {(pkg.courierName || pkg.awb) && (
        <AppText style={shop.muted}>
          {[pkg.courierName, pkg.awb ? `AWB: ${pkg.awb}` : null].filter(Boolean).join(' · ')}
        </AppText>
      )}

      {pkg.status === 'delivered' && pkg.deliveredAt ? (
        <AppText style={styles.deliveredBanner}>Delivered on {formatDate(pkg.deliveredAt)}</AppText>
      ) : pkg.etd && !['cancelled', 'returned'].includes(pkg.status) ? (
        <AppText style={styles.etdBanner}>Estimated delivery: {pkg.etd}</AppText>
      ) : null}

      {progress && (
        <View style={styles.steps}>
          {PACKAGE_STEPS.map(step => {
            const reached = packageStepReached(pkg, step);
            const date = formatDate(packageStepDate(pkg, step));
            return (
              <View key={step} style={styles.stepRow}>
                <View style={[styles.stepDot, reached && styles.stepDotActive]} />
                <AppText style={[styles.stepLabel, reached && styles.stepLabelActive]}>
                  {PACKAGE_STATUS_LABELS[step]}
                </AppText>
                <AppText style={styles.stepDate}>{date ?? (reached ? '' : 'Pending')}</AppText>
              </View>
            );
          })}
        </View>
      )}

      {!!pkg.trackingEvents.length && (
        <Pressable accessibilityRole="button" onPress={() => setShowLog(v => !v)} style={styles.logToggle}>
          <AppText style={shop.link}>
            {showLog ? 'Hide' : 'View'} tracking updates
          </AppText>
          <Ionicons name={showLog ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.primary} />
        </Pressable>
      )}
      {showLog && (
        <View style={styles.log}>
          {[...pkg.trackingEvents].reverse().map((event, index) => (
            <AppText key={`${event.status}-${index}`} style={styles.logRow}>
              <AppText style={styles.logStatus}>{PACKAGE_STATUS_LABELS[event.status] || 'Tracking update'}</AppText>
              {event.occurredAt ? `  ${formatDate(event.occurredAt)}` : ''}
            </AppText>
          ))}
        </View>
      )}

      {pkg.trackingUrl?.startsWith('https://') ? (
        <Pressable accessibilityRole="button" onPress={() => openWebsite(pkg.trackingUrl!)} style={styles.trackButton}>
          <Ionicons name="navigate-outline" size={15} color={theme.colors.primary} />
          <AppText style={shop.link}>Track package {pkg.packageNumber}</AppText>
        </Pressable>
      ) : !['cancelled', 'returned', 'delivered'].includes(pkg.status) ? (
        <AppText style={styles.trackingUnavailable}>
          {pkg.awb ? 'Live tracking link will appear when the courier provides it.' : 'Tracking will be available after dispatch.'}
        </AppText>
      ) : null}
    </View>
  );
}

function LegacyTrackingCard({ tracking }: { tracking: LegacyTracking }) {
  return (
    <View style={styles.packageCard}>
      {tracking.shiprocketStatus && <AppText style={styles.packageTitle}>{tracking.shiprocketStatus}</AppText>}
      {(tracking.courierName || tracking.awb) && (
        <AppText style={shop.muted}>
          {[tracking.courierName, tracking.awb ? `AWB: ${tracking.awb}` : null].filter(Boolean).join(' · ')}
        </AppText>
      )}
      {tracking.etd && <AppText style={styles.etdBanner}>Estimated delivery: {tracking.etd}</AppText>}
    </View>
  );
}

export default function OrderDetailScreen() {
  const route = useLocalSearchParams<{ id: string }>();
  const id = first(route.id);
  const order = useOrderDetail(id);
  const data = order.data;
  useMaybePromptReview(data?.orderStatus);
  const cancelOrder = useCancelOrder(id);
  const downloadInvoice = useDownloadInvoice(data?.orderNumber ?? '');
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [returning, setReturning] = useState(false);
  const needsComment = reason === 'Other';
  const canConfirmCancel = !!reason && (!needsComment || comment.trim().length > 0);

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
        />
        {!order.isPending && !order.isError && !data && (
          <Feedback title="Order not found" message="We couldn't load this order." />
        )}
        {data && (
          <>
            <View style={styles.section}>
              <View style={shop.between}>
                <AppText style={shop.heading}>Status</AppText>
                <AppText style={shop.link}>{statusLabel(data.orderStatus)}</AppText>
              </View>
              <AppText style={shop.muted}>
                {data.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid online'} ·{' '}
                {statusLabel(data.paymentStatus)}
              </AppText>
              {canDownloadInvoice(data) && (
                <Pressable
                  accessibilityRole="button"
                  disabled={downloadInvoice.isPending}
                  onPress={() => downloadInvoice.mutate(data.id)}
                  style={styles.receiptButton}
                >
                  <Ionicons name="download-outline" size={16} color={theme.colors.primary} />
                  <AppText style={shop.link}>{downloadInvoice.isPending ? 'Preparing receipt…' : 'Download receipt'}</AppText>
                </Pressable>
              )}
              {downloadInvoice.isError && <AppText style={styles.error}>{downloadInvoice.error.message}</AppText>}
            </View>

            {(!!data.packages.length || data.legacyTracking) && (
              <View style={styles.section}>
                <AppText style={shop.heading}>Packages & Tracking</AppText>
                {data.packages.map(pkg => (
                  <PackageCard key={pkg.packageNumber} pkg={pkg} />
                ))}
                {!data.packages.length && data.legacyTracking && (
                  <LegacyTrackingCard tracking={data.legacyTracking} />
                )}
              </View>
            )}

            <View style={styles.section}>
              <AppText style={shop.heading}>Items</AppText>
              {data.items.map(item => (
                <View key={item.id} style={styles.itemRow}>
                  <StoreImage uri={item.image} label={item.name} style={styles.itemImage} />
                  <View style={shop.flex}>
                    <AppText numberOfLines={2}>{item.name}</AppText>
                    <AppText style={shop.muted}>
                      Qty {item.quantity} {item.price !== null ? `· ${money(item.price)}` : ''}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.summary}>
              {data.discount !== null && data.discount > 0 && (
                <View style={shop.between}>
                  <AppText style={shop.muted}>Discount</AppText>
                  <AppText style={shop.muted}>−{money(data.discount)}</AppText>
                </View>
              )}
              {data.shipping !== null && (
                <View style={shop.between}>
                  <AppText style={shop.muted}>Shipping</AppText>
                  <AppText style={shop.muted}>
                    {data.shipping === 0 ? 'Free' : money(data.shipping)}
                  </AppText>
                </View>
              )}
              {!!data.codFee && (
                <View style={shop.between}>
                  <AppText style={shop.muted}>COD fee</AppText>
                  <AppText style={shop.muted}>{money(data.codFee)}</AppText>
                </View>
              )}
              <View style={shop.between}>
                <AppText style={styles.total}>Total</AppText>
                <AppText style={styles.total}>{money(data.grandTotal)}</AppText>
              </View>
            </View>

            {data.returns.allowed && (
              <Button label="Request return" onPress={() => setReturning(true)} />
            )}
            {data.cancellation.allowed && !cancelling && (
              <Button label="Cancel order" onPress={() => setCancelling(true)} />
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
                  <AppText style={styles.error}>{cancelOrder.error.message}</AppText>
                )}
                <Button
                  label={cancelOrder.isPending ? 'Cancelling…' : 'Confirm cancellation'}
                  disabled={!canConfirmCancel || cancelOrder.isPending}
                  onPress={() => {
                    cancelOrder.mutate(
                      { reason, comment: needsComment ? comment.trim() : undefined },
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
      {returning && data && <ReturnRequestSheet order={data} onClose={() => setReturning(false)} />}
    </View>
  );
}
const styles = StyleSheet.create({
  body: { padding: 16, gap: 16 },
  section: { gap: 8 },
  itemRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  itemImage: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#F0F1F3' },
  summary: { gap: 8, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 },
  total: { fontFamily: theme.fonts.bold, fontSize: 18 },
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
  receiptButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  packageCard: {
    gap: 6,
    padding: 14,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  packageTitle: { fontFamily: theme.fonts.medium, fontSize: 14 },
  packageStatus: { fontFamily: theme.fonts.semibold, fontSize: 12, color: theme.colors.primary },
  deliveredBanner: { color: theme.colors.primary, fontFamily: theme.fonts.medium, fontSize: 13 },
  etdBanner: { color: theme.colors.primary, fontSize: 13 },
  steps: { marginTop: 8, gap: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.border },
  stepDotActive: { backgroundColor: theme.colors.primary },
  stepLabel: { flex: 1, fontSize: 12, color: theme.colors.secondary },
  stepLabelActive: { color: theme.colors.text, fontFamily: theme.fonts.medium },
  stepDate: { fontSize: 11, color: theme.colors.secondary },
  logToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  log: { gap: 6, marginTop: 4, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: theme.colors.primaryLight },
  logRow: { fontSize: 12, color: theme.colors.secondary },
  logStatus: { fontFamily: theme.fonts.medium, color: theme.colors.text },
  trackButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  trackingUnavailable: { fontSize: 12, color: theme.colors.secondary, marginTop: 4 },
});
