import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import axios from 'axios';
import { apiConfig } from '../../api/config';
import { parsePolicy, requiresUpdate, UpdatePolicy } from './policy';

const supported = Platform.OS === 'android' || Platform.OS === 'ios';
const cacheKey = `mobile-update-policy:v1:${Platform.OS}:${apiConfig.baseUrl}`;
export function UpdateGate({ children }: React.PropsWithChildren) {
  const [policy, setPolicy] = useState<UpdatePolicy | null>(null);
  const [ready, setReady] = useState(!supported);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!supported) return;
    let active = true;
    let pending = false;
    const controller = new AbortController();
    async function check() {
      if (pending || !active) return;
      pending = true;
      try {
        if (!apiConfig.baseUrl) throw new Error('Missing API URL');
        const response = await axios.get(
          `${apiConfig.baseUrl}mobile/update-policy`,
          {
            params: { platform: Platform.OS },
            timeout: 8000,
            signal: controller.signal,
          },
        );
        const next = parsePolicy(response.data, Platform.OS);
        if (!next) throw new Error('Invalid policy');
        if (active) {
          setPolicy(next);
          setError('');
        }
        await AsyncStorage.setItem(cacheKey, JSON.stringify(next)).catch(
          () => undefined,
        );
      } catch {
        // Keep the last validated policy, including a previously required update.
        if (active)
          setError(
            'Unable to check for updates. Check your connection and try again.',
          );
      } finally {
        pending = false;
        if (active) setReady(true);
      }
    }
    async function start() {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        const parsed = cached && parsePolicy(JSON.parse(cached), Platform.OS);
        if (active && parsed) setPolicy(parsed);
      } catch {
        /* A corrupt cache must not lock out a fresh installation. */
      }
      await check();
    }
    start().catch(() => undefined);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') check().catch(() => undefined);
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') check().catch(() => undefined);
    }, 5 * 60 * 1000);
    return () => {
      active = false;
      controller.abort();
      subscription.remove();
      clearInterval(timer);
    };
  }, [attempt]);
  if (!ready)
    return (
      <View style={styles.center}>
        <ActivityIndicator accessibilityLabel="Checking for updates" />
      </View>
    );
  if (!policy || !requiresUpdate(Application.nativeApplicationVersion, policy))
    return <>{children}</>;
  async function openStore() {
    try {
      await Linking.openURL(policy!.storeUrl!);
      setError('');
    } catch {
      setError('Unable to open the store. Please try again.');
    }
  }
  return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.title} accessibilityRole="header">
        Update Elexify to continue
      </Text>
      <Text style={styles.message}>
        This version is no longer supported. Install the latest version to keep
        shopping.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={openStore}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Update now</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => setAttempt(value => value + 1)}
        style={styles.retry}
      >
        <Text>Check again</Text>
      </Pressable>
      {!!error && (
        <Text accessibilityRole="alert" style={styles.message}>
          {error}
        </Text>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    color: '#4b5563',
  },
  button: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  retry: { padding: 20 },
});
