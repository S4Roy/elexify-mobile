import React, { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { AppText } from '../../components/ui';
import { api } from '../../api/client';
import { useSession } from '../../stores/session';
export function DevicesCard() {
  const [devices, setDevices] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function load() {
    setError('');
    try { setDevices((await api.get('auth/user/sessions')).data.data.sessions); }
    catch { setError('Unable to load devices. Please retry.'); }
  }
  useEffect(() => { void load(); }, []);
  function revoke(device?: any) {
    Alert.alert('Sign out', device ? 'Sign out this device?' : 'Sign out all devices?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => {
        setBusy(true);
        void (async () => {
          try {
            if (!device) await useSession.getState().logoutAll();
            else {
              await api.delete(`auth/user/sessions/${device.id}`);
              if (device.isCurrent) await useSession.getState().signOut(true);
              else await load();
            }
          } catch { setError('Unable to sign out. Please retry.'); }
          finally { setBusy(false); }
        })();
      } },
    ]);
  }
  return <View style={{ padding: 16, gap: 12, backgroundColor: 'white', borderRadius: 12 }}>
    <AppText>Your devices</AppText>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => void load()}><AppText>Refresh devices</AppText></Pressable>
    {!!error && <AppText accessibilityRole="alert">{error}</AppText>}
    {devices.map(device => <View key={device.id} style={{ gap: 8 }}>
      <AppText>{device.deviceName} · {device.browser} · {device.os}{device.isCurrent ? ' (this device)' : ''}</AppText>
      <AppText>Last active {new Date(device.lastActivityAt).toLocaleString()}</AppText>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => revoke(device)}><AppText>Sign out device</AppText></Pressable>
    </View>)}
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => revoke()}><AppText>Sign out all devices</AppText></Pressable>
  </View>;
}
