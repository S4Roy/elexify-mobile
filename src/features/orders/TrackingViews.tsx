import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../components/ui';
import { StoreImage } from '../../components/shop';
import { theme } from '../../theme';
import type {
  OrderTracking,
  TrackingEvent,
  TrackingMilestone,
  TrackingShipment,
} from '../../api/tracking';
import { openWebsite } from '../catalog/links';
import {
  fmtDate,
  fmtDay,
  fmtEta,
  fmtTime,
  groupEventsByDay,
  latestTrackingEvent,
  relativeDay,
  trackingHeadline,
} from './trackingFormat';

// React Native ports of elexify.online src/components/tracking/*
// (MilestoneBar, ActivityLog, OrderTrackingView's ShipmentCard), so the app
// and the website tell the customer the same story in the same shape.

const C = {
  primary: theme.colors.primary,
  primarySoft: theme.colors.primaryLight,
  text: theme.colors.text,
  muted: theme.colors.secondary,
  faint: '#9CA3AF',
  line: '#E5E7EB',
  danger: '#EF4444',
  dangerSoft: '#FEF2F2',
  dangerText: '#B91C1C',
  warning: '#F59E0B',
  warningSoft: '#FFFBEB',
  warningText: '#92400E',
  success: '#15803D',
  successSoft: '#F0FDF4',
};

const STATUS_TONES: Record<string, { bg: string; text: string }> = {
  delivered: { bg: C.successSoft, text: C.success },
  cancelled: { bg: C.dangerSoft, text: C.dangerText },
  failed: { bg: C.dangerSoft, text: C.dangerText },
  returned: { bg: C.warningSoft, text: C.warningText },
  return_requested: { bg: C.warningSoft, text: C.warningText },
};
const toneFor = (status: string) =>
  STATUS_TONES[status] ?? { bg: C.primarySoft, text: C.primary };

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  const tone = toneFor(status);
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <AppText style={[styles.badgeText, { color: tone.text }]}>
        {label}
      </AppText>
    </View>
  );
}

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduce)
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduce,
    );
    return () => sub.remove();
  }, []);
  return reduce;
}

/** Breathing ring behind the current step — the "live" cue users expect. */
function PulseDot() {
  const reduce = useReduceMotion();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduce]);
  return (
    <View style={styles.pulseWrap}>
      {!reduce && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.45, 0],
              }),
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2.2],
                  }),
                },
              ],
            },
          ]}
        />
      )}
      <View style={styles.pulseCore} />
    </View>
  );
}

function MilestoneDot({ m }: { m: TrackingMilestone }) {
  const reached = m.state !== 'upcoming';
  if (m.tone === 'danger' && reached) {
    return (
      <View style={[styles.dot, styles.dotDanger]}>
        <Ionicons name="close" size={14} color="#FFFFFF" />
      </View>
    );
  }
  if (m.tone === 'warning' && reached) {
    return (
      <View style={[styles.dot, styles.dotWarning]}>
        <Ionicons name="return-down-back" size={13} color="#FFFFFF" />
      </View>
    );
  }
  if (m.state === 'done') {
    return (
      <View style={[styles.dot, styles.dotDone]}>
        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
      </View>
    );
  }
  if (m.state === 'current') {
    return (
      <View style={[styles.dot, styles.dotCurrent]}>
        <PulseDot />
      </View>
    );
  }
  return <View style={[styles.dot, styles.dotUpcoming]} />;
}

/**
 * Vertical order progress (Placed → Confirmed → Packed → Shipped → Out for
 * delivery → Delivered, or the cancelled/failed/return branch). `compact`
 * hides upcoming dates and tightens spacing for the order-detail summary.
 */
export function MilestoneStepper({
  milestones,
  compact = false,
}: {
  milestones: TrackingMilestone[];
  compact?: boolean;
}) {
  return (
    <View accessibilityRole="list" accessibilityLabel="Order progress">
      {milestones.map((m, i) => {
        const last = i === milestones.length - 1;
        const nextReached = !last && milestones[i + 1].state !== 'upcoming';
        const reached = m.state !== 'upcoming';
        return (
          <View
            key={m.key}
            style={styles.stepRow}
            accessible
            accessibilityLabel={`${m.label}${m.at ? `, ${fmtDay(m.at)}` : ''}${
              m.state === 'current'
                ? ', current step'
                : m.state === 'done'
                ? ', completed'
                : ''
            }`}
          >
            <View style={styles.stepRail}>
              <MilestoneDot m={m} />
              {!last && (
                <View
                  style={[
                    styles.stepLine,
                    compact && styles.stepLineCompact,
                    nextReached && styles.stepLineDone,
                  ]}
                />
              )}
            </View>
            <View style={[styles.stepBody, compact && styles.stepBodyCompact]}>
              <AppText
                style={[
                  styles.stepLabel,
                  reached ? styles.stepLabelReached : styles.stepLabelUpcoming,
                ]}
              >
                {m.label}
              </AppText>
              {!!m.at && (
                <AppText style={styles.stepDate}>{fmtDay(m.at)}</AppText>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Full shipment history, newest first, one heading per day. The latest
 * event is emphasised; long logs collapse to the most recent few.
 */
export function ActivityLog({
  events,
  initialCount = 5,
  emptyText = 'No tracking updates yet.',
}: {
  events: TrackingEvent[];
  initialCount?: number;
  emptyText?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!events.length) {
    return <AppText style={styles.empty}>{emptyText}</AppText>;
  }
  const visible = expanded ? events : events.slice(0, initialCount);
  const groups = groupEventsByDay(visible);
  let index = 0;
  return (
    <View>
      {groups.map(group => (
        <View key={group.key} style={styles.dayGroup}>
          <AppText style={styles.dayLabel}>{group.label}</AppText>
          <View style={styles.dayEvents}>
            {group.events.map((event, i) => {
              const isLatest = index++ === 0;
              const lastInGroup = i === group.events.length - 1;
              return (
                <View
                  key={`${event.at}-${event.title}-${index}`}
                  style={styles.eventRow}
                  accessible
                  accessibilityLabel={`${event.title}${
                    event.location ? `, ${event.location}` : ''
                  }, ${fmtTime(event.at)}`}
                >
                  <View style={styles.eventRail}>
                    <View
                      style={[
                        styles.eventDot,
                        isLatest && styles.eventDotLatest,
                      ]}
                    />
                    {!lastInGroup && <View style={styles.eventLine} />}
                  </View>
                  <View style={styles.eventBody}>
                    <View style={styles.eventHead}>
                      <Ionicons
                        name={
                          event.kind === 'courier'
                            ? 'car-outline'
                            : event.kind === 'order'
                            ? 'receipt-outline'
                            : 'cube-outline'
                        }
                        size={13}
                        color={isLatest ? C.primary : C.faint}
                        style={styles.eventIcon}
                      />
                      <AppText
                        style={[
                          styles.eventTitle,
                          isLatest && styles.eventTitleLatest,
                        ]}
                      >
                        {event.title}
                      </AppText>
                      <AppText style={styles.eventTime}>
                        {fmtTime(event.at)}
                      </AppText>
                    </View>
                    {!!event.location && (
                      <View style={styles.eventLocation}>
                        <Ionicons
                          name="location-outline"
                          size={11}
                          color={C.muted}
                        />
                        <AppText style={styles.eventLocationText}>
                          {event.location}
                        </AppText>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ))}
      {events.length > initialCount && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded(v => !v)}
          style={styles.showAll}
          hitSlop={8}
        >
          <AppText style={styles.showAllText}>
            {expanded
              ? 'Show fewer updates'
              : `Show all ${events.length} updates`}
          </AppText>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={C.primary}
          />
        </Pressable>
      )}
    </View>
  );
}

function InfoRow({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>) {
  return (
    <View style={styles.infoRow}>
      <AppText style={styles.infoLabel}>{label}</AppText>
      <View style={styles.infoValue}>{children}</View>
    </View>
  );
}

export function ShipmentCard({
  shipment,
  single,
}: {
  shipment: TrackingShipment;
  single: boolean;
}) {
  const inTransit = !['delivered', 'cancelled', 'returned'].includes(
    shipment.status,
  );
  const eta = fmtEta(shipment.etdAt, shipment.etd);
  const shareAwb = () => {
    if (!shipment.awb) {
      return;
    }
    Share.share({
      message: [
        `Tracking number: ${shipment.awb}`,
        shipment.courierName ? `Courier: ${shipment.courierName}` : null,
        shipment.trackingUrl,
      ]
        .filter(Boolean)
        .join('\n'),
    }).catch(() => undefined);
  };

  return (
    <View style={styles.card} accessibilityLabel={shipment.label}>
      <View style={styles.cardHead}>
        <View style={styles.cardHeadLeft}>
          <View style={styles.iconBubble}>
            <Ionicons name="cube-outline" size={16} color={C.primary} />
          </View>
          <View style={styles.flex}>
            <AppText style={styles.cardTitle}>
              {single ? 'Shipment' : shipment.label}
            </AppText>
            {!!shipment.courierName && (
              <AppText style={styles.cardSub}>{shipment.courierName}</AppText>
            )}
          </View>
        </View>
        <StatusBadge status={shipment.status} label={shipment.statusLabel} />
      </View>

      {shipment.status === 'delivered' && shipment.deliveredAt ? (
        <View style={[styles.banner, styles.bannerSuccess]}>
          <Ionicons name="checkmark-circle" size={15} color={C.success} />
          <AppText style={[styles.bannerText, { color: C.success }]}>
            Delivered on {fmtDay(shipment.deliveredAt)},{' '}
            {fmtTime(shipment.deliveredAt)}
          </AppText>
        </View>
      ) : inTransit && eta ? (
        <View style={[styles.banner, styles.bannerPrimary]}>
          <Ionicons name="time-outline" size={15} color={C.primary} />
          <AppText style={[styles.bannerText, { color: C.primary }]}>
            Expected by {eta}
          </AppText>
        </View>
      ) : null}

      {(shipment.awb || shipment.courierStatus || shipment.shippedAt) && (
        <View style={styles.infoBox}>
          {!!shipment.awb && (
            <InfoRow label="Tracking no.">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Share tracking number ${shipment.awb}`}
                onPress={shareAwb}
                hitSlop={8}
                style={styles.awb}
              >
                <AppText selectable style={styles.awbText}>
                  {shipment.awb}
                </AppText>
                <Ionicons name="share-outline" size={14} color={C.muted} />
              </Pressable>
            </InfoRow>
          )}
          {!!shipment.courierStatus && (
            <InfoRow label="Courier status">
              <AppText style={styles.infoText}>
                {shipment.courierStatus}
              </AppText>
            </InfoRow>
          )}
          {!!shipment.shippedAt && (
            <InfoRow label="Shipped">
              <AppText style={styles.infoText}>
                {fmtDate(shipment.shippedAt)}
              </AppText>
            </InfoRow>
          )}
        </View>
      )}

      {!!shipment.items.length && (
        <View style={styles.items}>
          {shipment.items.map((item, i) => (
            <View key={`${item.name}-${i}`} style={styles.itemRow}>
              <StoreImage
                uri={item.image ?? undefined}
                label={item.name}
                style={styles.itemImage}
              />
              <AppText style={styles.itemName} numberOfLines={2}>
                {item.name}
              </AppText>
              <AppText style={styles.itemQty}>×{item.quantity}</AppText>
            </View>
          ))}
        </View>
      )}

      <View style={styles.historyBlock}>
        <AppText style={styles.sectionLabel}>Tracking history</AppText>
        <ActivityLog
          events={shipment.events}
          initialCount={6}
          emptyText={
            shipment.awb
              ? "The courier hasn't shared any updates yet."
              : 'Updates will appear once this package is handed to the courier.'
          }
        />
      </View>

      {!!shipment.trackingUrl && (
        <Pressable
          accessibilityRole="link"
          onPress={() => openWebsite(shipment.trackingUrl!)}
          style={({ pressed }) => [
            styles.courierButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="open-outline" size={15} color={C.primary} />
          <AppText style={styles.courierButtonText}>
            Track on courier site
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

/** Order-detail tracking summary: headline, compact stepper, the latest
 * update, and a way into the full tracking screen. */
export function TrackingSummaryCard({
  data,
  onOpen,
}: {
  data: OrderTracking;
  onOpen: () => void;
}) {
  const latest = latestTrackingEvent(data);
  const shipments = data.shipments.length;
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <AppText style={styles.sectionLabel}>Order tracking</AppText>
        {shipments > 1 && (
          <AppText style={styles.cardSub}>{shipments} shipments</AppText>
        )}
      </View>
      <AppText style={styles.summaryHeadline}>{trackingHeadline(data)}</AppText>
      <MilestoneStepper milestones={data.milestones} compact />
      {latest && (
        <View style={styles.latest}>
          <Ionicons
            name={latest.kind === 'courier' ? 'car-outline' : 'cube-outline'}
            size={16}
            color={C.primary}
          />
          <View style={styles.flex}>
            <AppText style={styles.latestTitle} numberOfLines={2}>
              {latest.title}
            </AppText>
            <AppText style={styles.latestMeta} numberOfLines={1}>
              {[
                `${relativeDay(latest.at)}, ${fmtTime(latest.at)}`,
                latest.location,
              ]
                .filter(Boolean)
                .join(' · ')}
            </AppText>
          </View>
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens full tracking with courier updates"
        onPress={onOpen}
        style={({ pressed }) => [styles.summaryCta, pressed && styles.pressed]}
      >
        <Ionicons name="navigate-outline" size={16} color="#FFFFFF" />
        <AppText style={styles.summaryCtaText}>
          {shipments ? 'Track shipment' : 'View tracking details'}
        </AppText>
        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

export const trackingStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    gap: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: theme.fonts.semibold,
    color: C.muted,
  },
});

const DOT = 26;

const styles = StyleSheet.create({
  ...trackingStyles,
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontFamily: theme.fonts.semibold },

  // Milestones
  stepRow: { flexDirection: 'row', gap: 12 },
  stepRail: { alignItems: 'center', width: DOT },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  dotDone: { backgroundColor: C.primary, borderColor: C.primary },
  dotCurrent: { backgroundColor: '#FFFFFF', borderColor: C.primary },
  dotUpcoming: { backgroundColor: '#FFFFFF', borderColor: C.line },
  dotDanger: { backgroundColor: C.danger, borderColor: C.danger },
  dotWarning: { backgroundColor: C.warning, borderColor: C.warning },
  pulseWrap: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.primary,
  },
  pulseCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.primary,
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 22,
    marginVertical: 3,
    borderRadius: 1,
    backgroundColor: C.line,
  },
  stepLineCompact: { minHeight: 14 },
  stepLineDone: { backgroundColor: C.primary },
  stepBody: { flex: 1, paddingTop: 3, paddingBottom: 18 },
  stepBodyCompact: { paddingBottom: 10 },
  stepLabel: { fontSize: 14, lineHeight: 20 },
  stepLabelReached: { fontFamily: theme.fonts.semibold, color: C.text },
  stepLabelUpcoming: { color: C.faint },
  stepDate: { fontSize: 12, color: C.muted, marginTop: 1 },

  // Activity log
  empty: { fontSize: 13, color: C.muted, lineHeight: 19 },
  dayGroup: { marginBottom: 14 },
  dayLabel: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: theme.fonts.semibold,
    color: C.muted,
    marginBottom: 8,
  },
  dayEvents: { paddingLeft: 2 },
  eventRow: { flexDirection: 'row', gap: 12 },
  eventRail: { alignItems: 'center', width: 10 },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: '#D1D5DB',
  },
  eventDotLatest: {
    backgroundColor: C.primary,
    borderWidth: 3,
    borderColor: C.primarySoft,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 3,
  },
  eventLine: { width: 1.5, flex: 1, backgroundColor: C.line, marginTop: 3 },
  eventBody: { flex: 1, paddingBottom: 14 },
  eventHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  eventIcon: { marginTop: 3 },
  eventTitle: { flex: 1, fontSize: 13, lineHeight: 19, color: '#374151' },
  eventTitleLatest: { fontFamily: theme.fonts.semibold, color: C.text },
  eventTime: {
    fontSize: 12,
    lineHeight: 19,
    color: C.muted,
    fontVariant: ['tabular-nums'],
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
    marginLeft: 19,
  },
  eventLocationText: { fontSize: 12, color: C.muted },
  showAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    minHeight: 32,
  },
  showAllText: {
    fontSize: 13,
    fontFamily: theme.fonts.semibold,
    color: C.primary,
  },

  // Shipment card
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardHeadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primarySoft,
  },
  cardTitle: { fontSize: 15, fontFamily: theme.fonts.semibold, color: C.text },
  cardSub: { fontSize: 12, color: C.muted },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bannerSuccess: { backgroundColor: C.successSoft },
  bannerPrimary: { backgroundColor: C.primarySoft },
  bannerText: { fontSize: 13, fontFamily: theme.fonts.medium, flex: 1 },
  infoBox: {
    gap: 8,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: { fontSize: 12, color: C.muted },
  infoValue: { flexShrink: 1, alignItems: 'flex-end' },
  infoText: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: C.text,
    textAlign: 'right',
  },
  awb: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  awbText: {
    fontSize: 13,
    fontFamily: theme.fonts.semibold,
    color: C.text,
    letterSpacing: 0.4,
  },
  items: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  itemName: { flex: 1, fontSize: 13, lineHeight: 18, color: '#374151' },
  itemQty: { fontSize: 12, fontFamily: theme.fonts.medium, color: C.muted },
  historyBlock: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  courierButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  summaryHeadline: {
    fontSize: 18,
    lineHeight: 25,
    fontFamily: theme.fonts.bold,
    color: C.text,
    marginTop: -6,
  },
  latest: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  latestTitle: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: theme.fonts.medium,
    color: C.text,
  },
  latestMeta: { fontSize: 12, color: C.muted, marginTop: 1 },
  summaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  summaryCtaText: {
    fontSize: 14,
    fontFamily: theme.fonts.semibold,
    color: '#FFFFFF',
  },
  courierButtonText: {
    fontSize: 14,
    fontFamily: theme.fonts.semibold,
    color: C.primary,
  },
});
