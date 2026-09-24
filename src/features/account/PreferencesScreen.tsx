import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { AppText, Button, Feedback } from '../../components/ui';
import { ShopHeader, shop } from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import type { NotificationPreferences } from '../../api/account';
import { useNotificationPreferences, useUpdateNotificationPreferences } from './hooks';

type Group = keyof NotificationPreferences;
type Row = { group: Group; key: string; label: string; channel: 'email' | 'sms' | 'whatsapp' };

const SECTIONS: { title: string; rows: Row[] }[] = [
  {
    title: 'Order & Payment',
    rows: [
      { group: 'transactional', key: 'order_email', label: 'Order updates — Email', channel: 'email' },
      { group: 'transactional', key: 'order_sms', label: 'Order updates — SMS', channel: 'sms' },
      { group: 'transactional', key: 'order_whatsapp', label: 'Order updates — WhatsApp', channel: 'whatsapp' },
      { group: 'transactional', key: 'payment_email', label: 'Payment receipts — Email', channel: 'email' },
      { group: 'transactional', key: 'payment_sms', label: 'Payment receipts — SMS', channel: 'sms' },
      { group: 'transactional', key: 'refund_email', label: 'Refunds — Email', channel: 'email' },
      { group: 'transactional', key: 'refund_sms', label: 'Refunds — SMS', channel: 'sms' },
    ],
  },
  {
    title: 'Account Security',
    rows: [
      { group: 'security', key: 'email', label: 'Security alerts — Email', channel: 'email' },
      { group: 'security', key: 'sms', label: 'Security alerts — SMS', channel: 'sms' },
    ],
  },
  {
    title: 'Offers & Marketing',
    rows: [
      { group: 'marketing', key: 'email', label: 'Offers & discounts — Email', channel: 'email' },
      { group: 'marketing', key: 'sms', label: 'Offers & discounts — SMS', channel: 'sms' },
      { group: 'marketing', key: 'whatsapp', label: 'Offers & discounts — WhatsApp', channel: 'whatsapp' },
    ],
  },
  {
    title: 'Reminders',
    rows: [
      { group: 'reminders', key: 'abandoned_cart_email', label: 'Abandoned cart — Email', channel: 'email' },
      { group: 'reminders', key: 'abandoned_cart_whatsapp', label: 'Abandoned cart — WhatsApp', channel: 'whatsapp' },
      { group: 'reminders', key: 'wishlist_email', label: 'Wishlist reminders — Email', channel: 'email' },
    ],
  },
];

export default function PreferencesScreen() {
  const query = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (query.data) {
      setPreferences(query.data.preferences);
    }
  }, [query.data]);

  const lockedPaths = new Set(query.data?.lockedPaths ?? []);
  const isChannelUnverified = (channel: Row['channel']) =>
    channel === 'email' ? !query.data?.emailVerified : !query.data?.mobileVerified;

  const toggle = (group: Group, key: string, value: boolean) => {
    setSaved(false);
    setPreferences(current =>
      current ? { ...current, [group]: { ...current[group], [key]: value } } : current,
    );
  };

  const onSave = () => {
    if (!preferences) {
      return;
    }
    update.mutate(preferences, { onSuccess: () => setSaved(true) });
  };

  return (
    <View style={shop.page}>
      <ShopHeader title="Notification Preferences" back />
      <ScrollView contentContainerStyle={styles.body}>
        <QueryState
          pending={query.isPending}
          error={query.error}
          paused={query.fetchStatus === 'paused'}
          retry={() => {
            query.refetch().catch(() => undefined);
          }}
        />
        {!query.isPending && !query.isError && !preferences && (
          <Feedback title="Unable to load your preferences" message="Please try again." />
        )}
        {preferences && (
          <>
            <AppText style={shop.muted}>
              Choose how you&apos;d like to hear from us. Required service notifications can&apos;t be turned off.
            </AppText>
            {SECTIONS.map(section => (
              <View key={section.title} style={styles.card}>
                <AppText style={styles.sectionTitle}>{section.title}</AppText>
                {section.rows.map(row => {
                  const path = `${row.group}.${row.key}`;
                  const locked = lockedPaths.has(path);
                  const unverified = isChannelUnverified(row.channel);
                  const checked = !!(preferences[row.group] as Record<string, boolean>)[row.key];
                  return (
                    <View key={path} style={styles.row}>
                      <View style={shop.flex}>
                        <AppText style={styles.rowLabel}>{row.label}</AppText>
                        {locked && <AppText style={styles.lockedNote}>Required service notification</AppText>}
                        {!locked && unverified && (
                          <AppText style={styles.unverifiedNote}>
                            {row.channel === 'email'
                              ? 'Verify your email to enable this channel.'
                              : 'Verify your mobile number to enable this channel.'}
                          </AppText>
                        )}
                      </View>
                      <Switch
                        value={locked ? true : unverified ? false : checked}
                        disabled={locked || unverified}
                        onValueChange={v => toggle(row.group, row.key, v)}
                        trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
                      />
                    </View>
                  );
                })}
              </View>
            ))}
            {saved && <AppText style={styles.success}>Preferences saved.</AppText>}
            <Button
              label={update.isPending ? 'Saving…' : 'Save preferences'}
              disabled={update.isPending}
              onPress={onSave}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 14 },
  card: {
    gap: 10,
    padding: 14,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: { fontFamily: theme.fonts.semibold, fontSize: 13, color: theme.colors.secondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { fontSize: 14 },
  lockedNote: { color: theme.colors.primary, fontSize: 11 },
  unverifiedNote: { color: '#A65C00', fontSize: 11 },
  success: { color: theme.colors.primary, fontSize: 13 },
});
