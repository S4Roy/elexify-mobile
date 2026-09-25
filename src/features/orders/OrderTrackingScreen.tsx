import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { AppText, Feedback } from '../../components/ui';
import { OrderTrackingSkeleton, ShopHeader, shop } from '../../components/shop';
import { theme } from '../../theme';
import { QueryState } from '../catalog/QueryState';
import { useOrderTracking } from './hooks';
import {
  destinationLabel,
  fmtDate,
  fmtDay,
  fmtTime,
  isClosedStatus,
  trackingHeadline,
} from './trackingFormat';
import {
  ActivityLog,
  MilestoneStepper,
  ShipmentCard,
  StatusBadge,
  trackingStyles,
} from './TrackingViews';

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? '';

// Full-screen tracking — the app counterpart of elexify.online's
// OrderTrackingView: headline with ETA, milestone stepper, one card per
// shipment with its courier scan history, then order-level activity.
export default function OrderTrackingScreen() {
  const route = useLocalSearchParams<{ id: string }>();
  const id = first(route.id);
  const tracking = useOrderTracking(id);
  const data = tracking.data;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await tracking.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const closed = data ? isClosedStatus(data.order.status) : false;
  const destination = data ? destinationLabel(data) : null;

  return (
    <View style={[shop.page, styles.page]}>
      <ShopHeader title="Track order" back />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <QueryState
          pending={tracking.isPending}
          error={tracking.error}
          paused={tracking.fetchStatus === 'paused'}
          retry={() => {
            tracking.refetch().catch(() => undefined);
          }}
          skeleton={<OrderTrackingSkeleton />}
        />
        {!tracking.isPending && !tracking.isError && !data && (
          <Feedback
            title="Tracking unavailable"
            message="We couldn't load tracking for this order."
          />
        )}
        {data && (
          <>
            <View style={trackingStyles.card}>
              <View style={styles.headTop}>
                <AppText style={styles.orderNo}>Order #{data.order.id}</AppText>
                <StatusBadge
                  status={data.order.status}
                  label={data.order.statusLabel}
                />
              </View>
              <AppText style={styles.headline} accessibilityRole="header">
                {trackingHeadline(data)}
              </AppText>
              <AppText style={styles.meta}>
                Placed on {fmtDate(data.order.placedAt)} ·{' '}
                {data.order.itemCount} item
                {data.order.itemCount === 1 ? '' : 's'}
                {data.shipments.length > 1
                  ? ` · ${data.shipments.length} shipments`
                  : ''}
              </AppText>
              {!!destination && (
                <View style={styles.destination}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={theme.colors.secondary}
                  />
                  <AppText style={styles.meta}>
                    Delivering to {destination}
                  </AppText>
                </View>
              )}
              <View style={styles.divider} />
              <MilestoneStepper milestones={data.milestones} />
            </View>

            {data.shipments.map(shipment => (
              <ShipmentCard
                key={shipment.key}
                shipment={shipment}
                single={data.shipments.length === 1}
              />
            ))}

            {!data.shipments.length && !closed && (
              <View style={[trackingStyles.card, styles.preparing]}>
                <View style={styles.preparingIcon}>
                  <Ionicons
                    name="construct-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>
                <AppText style={styles.preparingText}>
                  We're preparing your order. Courier tracking will appear here
                  as soon as it ships.
                </AppText>
              </View>
            )}

            {!!data.activity.length && (
              <View style={trackingStyles.card}>
                <View style={styles.sectionHead}>
                  <View style={styles.activityIcon}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.flex}>
                    <AppText style={styles.sectionTitle}>
                      Order activity
                    </AppText>
                    <AppText style={styles.activityCount}>
                      {data.activity.length} update
                      {data.activity.length === 1 ? '' : 's'}
                    </AppText>
                  </View>
                </View>
                <ActivityLog events={data.activity} initialCount={4} />
              </View>
            )}

            {!!data.generatedAt && (
              <AppText style={styles.footer}>
                Last checked {fmtDay(data.generatedAt)},{' '}
                {fmtTime(data.generatedAt)} IST · Pull down to refresh. Courier
                updates can take a few hours to appear.
              </AppText>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  activityCount: { fontSize: 12, color: theme.colors.secondary, marginTop: 1 },
  page: { backgroundColor: '#F7F8FA' },
  body: { padding: 16, gap: 14, paddingBottom: 32 },
  headTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderNo: { fontSize: 12, color: theme.colors.secondary },
  headline: {
    fontSize: 22,
    lineHeight: 30,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginTop: -6,
  },
  meta: { fontSize: 13, color: theme.colors.secondary, lineHeight: 19 },
  destination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -8,
  },
  divider: { height: 1, backgroundColor: theme.colors.border },
  preparing: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  preparingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  preparingText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#4B5563',
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: {
    fontSize: 15,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.text,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    color: '#9CA3AF',
    paddingHorizontal: 12,
  },
});
