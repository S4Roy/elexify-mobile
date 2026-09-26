import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../components/ui';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { api } from '../../api/client';
import { useSession } from '../../stores/session';
import { theme } from '../../theme';

type Device = {
  id: string;
  deviceName?: string;
  browser?: string;
  os?: string;
  lastActivityAt: string;
  isCurrent?: boolean;
};

function usefulLabel(value?: string) {
  const label = value?.trim();
  return label && !/^(unknown|n\/a|not available)$/i.test(label) ? label : '';
}

function DeviceRow({
  device,
  disabled,
  onSignOut,
}: {
  device: Device;
  disabled: boolean;
  onSignOut: (device: Device) => void;
}) {
  const deviceName = usefulLabel(device.deviceName);
  const browser = usefulLabel(device.browser);
  const os = usefulLabel(device.os);
  const title = deviceName || (browser ? `${browser} browser` : 'Signed-in device');
  const details = [deviceName && browser && deviceName !== browser ? browser : '', os]
    .filter(Boolean)
    .join(' · ');
  const date = new Date(device.lastActivityAt);
  const lastActive = Number.isNaN(date.getTime())
    ? 'Activity time unavailable'
    : `Last active ${date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })}`;
  const isMobile = /mobile|iphone|android/i.test(`${deviceName} ${os}`);

  return (
    <View style={styles.deviceRow}>
      <View style={styles.deviceIcon}>
        <Ionicons
          name={isMobile ? 'phone-portrait-outline' : 'laptop-outline'}
          size={19}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.deviceInfo}>
        <View style={styles.deviceTitleRow}>
          <AppText numberOfLines={1} style={styles.deviceTitle}>
            {title}
          </AppText>
          {device.isCurrent && (
            <View style={styles.currentBadge}>
              <AppText style={styles.currentBadgeText}>This device</AppText>
            </View>
          )}
        </View>
        {!!details && (
          <AppText numberOfLines={1} style={styles.deviceDetails}>
            {details}
          </AppText>
        )}
        <AppText style={styles.lastActive}>{lastActive}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sign out ${title}`}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={() => onSignOut(device)}
          hitSlop={6}
          style={({ pressed }) => [
            styles.signOutDevice,
            disabled && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="log-out-outline" size={15} color={theme.colors.danger} />
          <AppText style={styles.signOutDeviceText}>Sign out</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export function DevicesCard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const confirm = useConfirm();

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      setDevices((await api.get('auth/user/sessions')).data.data.sessions);
    } catch {
      setError('We couldn’t load your devices. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  function revoke(device?: Device) {
    setError('');
    const target = device
      ? usefulLabel(device.deviceName) || 'this device'
      : 'all devices';
    confirm({
      title: device ? 'Sign out this device?' : 'Sign out all devices?',
      icon: 'log-out-outline',
      subtitle: device ? target : undefined,
      message: device
        ? device.isCurrent
          ? 'You’ll be signed out here and returned to the sign-in screen.'
          : 'This device will need to sign in again to access your account.'
        : 'All active sessions, including this one, will be ended.',
      confirmLabel: 'Sign out',
      cancelLabel: 'Stay signed in',
      onConfirm: async () => {
        setBusy(true);
        try {
          if (!device) {
            await useSession.getState().logoutAll();
          } else {
            await api.delete(`auth/user/sessions/${device.id}`);
            if (device.isCurrent) {
              await useSession.getState().signOut(true);
            } else {
              await load();
            }
          }
        } catch {
          const message = 'Unable to sign out. Please retry.';
          setError(message);
          throw new Error(message);
        } finally {
          setBusy(false);
        }
      },
    });
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.headerCopy}>
          <AppText accessibilityRole="header" style={styles.heading}>
            Your devices
          </AppText>
          <AppText style={styles.description}>
            Manage where your account is signed in.
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh devices"
          accessibilityState={{ disabled: loading }}
          disabled={loading}
          onPress={load}
          hitSlop={8}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.pressed,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Ionicons
              name="refresh-outline"
              size={19}
              color={theme.colors.primary}
            />
          )}
        </Pressable>
      </View>

      {loading && devices.length === 0 ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <AppText style={styles.loadingText}>Checking signed-in devices…</AppText>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <AppText accessibilityRole="alert" style={styles.errorText}>
            {error}
          </AppText>
          <Pressable accessibilityRole="button" onPress={load}>
            <AppText style={styles.retryText}>Retry</AppText>
          </Pressable>
        </View>
      ) : devices.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="phone-portrait-outline"
            size={20}
            color={theme.colors.secondary}
          />
          <AppText style={styles.emptyText}>No active devices found.</AppText>
        </View>
      ) : (
        <>
          <View style={styles.deviceList}>
            {devices.map((device, index) => (
              <React.Fragment key={device.id}>
                {index > 0 && <View style={styles.divider} />}
                <DeviceRow
                  device={device}
                  disabled={busy}
                  onSignOut={revoke}
                />
              </React.Fragment>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={() => revoke()}
            style={({ pressed }) => [
              styles.signOutAll,
              busy && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="log-out-outline" size={17} color={theme.colors.danger} />
            <AppText style={styles.signOutAllText}>Sign out all devices</AppText>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  headerCopy: { flex: 1, gap: 2 },
  heading: {
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: theme.colors.text,
  },
  description: { fontSize: 12, lineHeight: 17, color: theme.colors.secondary },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F8F7',
  },
  loadingRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  loadingText: { color: theme.colors.secondary, fontSize: 13 },
  deviceList: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: '#FCFDFD',
  },
  deviceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 12 },
  deviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  deviceInfo: { flex: 1, minWidth: 0, gap: 4 },
  deviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  deviceTitle: {
    flexShrink: 1,
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    lineHeight: 19,
    color: theme.colors.text,
  },
  currentBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryLight,
  },
  currentBadgeText: {
    fontFamily: theme.fonts.medium,
    fontSize: 10,
    lineHeight: 14,
    color: theme.colors.primaryDark,
  },
  deviceDetails: { fontSize: 12, lineHeight: 17, color: theme.colors.secondary },
  lastActive: { fontSize: 11, lineHeight: 16, color: '#7A828B' },
  signOutDevice: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
    paddingVertical: 3,
  },
  signOutDeviceText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.danger,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
  signOutAll: {
    alignSelf: 'stretch',
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  signOutAllText: {
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
    color: theme.colors.danger,
  },
  emptyState: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: { fontSize: 13, color: theme.colors.secondary },
  errorBox: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  errorText: { textAlign: 'center', color: theme.colors.danger, fontSize: 13 },
  retryText: { color: theme.colors.primary, fontFamily: theme.fonts.semibold, fontSize: 13 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.75 },
});
