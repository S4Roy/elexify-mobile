import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppText, Button, Feedback } from '../../components/ui';
import { Chip, ShopHeader, StoreImage, money, shop } from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { CANCELLATION_REASONS } from '../../api/order';
import { useCancelOrder, useOrderDetail } from './hooks';

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? '';
const statusLabel = (status: string) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ') : 'Pending';

export default function OrderDetailScreen() {
  const route = useLocalSearchParams<{ id: string }>();
  const id = first(route.id);
  const order = useOrderDetail(id);
  const data = order.data;
  const cancelOrder = useCancelOrder(id);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
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
            </View>

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
});
