import React, { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import axios from 'axios';
import { apiConfig } from '../../api/config';
import {
  useConfirm,
  useDismissConfirm,
} from '../../components/ui/ConfirmDialog';
import {
  parsePolicy,
  shouldPromptOptional,
  SkippedUpdate,
  updateKind,
  UpdatePolicy,
} from './policy';

const supported = Platform.OS === 'android' || Platform.OS === 'ios';
const cacheKey = `mobile-update-policy:v2:${Platform.OS}:${apiConfig.baseUrl}`;
const skipKey = `mobile-update-skip:${Platform.OS}`;

async function readSkip(): Promise<SkippedUpdate | null> {
  try {
    const raw = await AsyncStorage.getItem(skipKey);
    const value = raw ? JSON.parse(raw) : null;
    return typeof value?.version === 'string' && typeof value?.at === 'number'
      ? value
      : null;
  } catch {
    return null;
  }
}

/**
 * Admin-managed app updates (Admin → Settings → App Updates):
 * below the minimum version a blocking dialog requires the update; below the
 * latest version a dialog offers it with "Later", re-offered after the
 * admin's reminder interval.
 */
export function UpdateGate({ children }: React.PropsWithChildren) {
  const confirm = useConfirm();
  const dismiss = useDismissConfirm();
  const [policy, setPolicy] = useState<UpdatePolicy | null>(null);
  // Which prompt is on screen, so re-checks don't re-open or flash it.
  const shown = useRef<string | null>(null);

  useEffect(() => {
    if (!supported) return;
    let active = true;
    let pending = false;
    const controller = new AbortController();
    async function check() {
      if (pending || !active) return;
      pending = true;
      try {
        if (!apiConfig.baseUrl) return;
        const response = await axios.get(
          `${apiConfig.baseUrl}mobile/update-policy`,
          {
            params: { platform: Platform.OS, schema: 2 },
            timeout: 8000,
            signal: controller.signal,
          },
        );
        const next = parsePolicy(response.data, Platform.OS);
        if (!next) return;
        if (active) setPolicy(next);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(next)).catch(
          () => undefined,
        );
      } catch {
        // Offline or unavailable: keep the last validated policy, including a
        // previously required update.
      } finally {
        pending = false;
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
  }, []);

  useEffect(() => {
    if (!policy) return;
    let cancelled = false;
    const kind = updateKind(Application.nativeApplicationVersion, policy);
    const key =
      kind && `${kind}:${policy.minimumVersion}:${policy.latestVersion}`;
    if (key === shown.current) return;
    if (shown.current) {
      // The admin lowered or lifted the requirement while a prompt was open.
      shown.current = null;
      dismiss();
    }
    if (!kind || !policy.storeUrl) return;
    const storeUrl = policy.storeUrl;
    const openStore = async () => {
      try {
        await Linking.openURL(storeUrl);
      } catch {
        throw new Error('Unable to open the store. Please try again.');
      }
    };
    const show = () => {
      if (cancelled) return;
      shown.current = key;
      if (kind === 'required') {
        confirm({
          title: policy.title || 'Update required',
          subtitle: `Version ${policy.latestVersion} is available`,
          message:
            policy.message ||
            'This version of Elexify is no longer supported. Update to keep shopping.',
          icon: 'cloud-download-outline',
          confirmLabel: 'Update now',
          destructive: false,
          dismissible: false,
          keepOpenOnConfirm: true,
          onConfirm: openStore,
        });
        return;
      }
      confirm({
        title: policy.title || 'Update available',
        subtitle: `Version ${policy.latestVersion} is ready to install`,
        message:
          policy.message ||
          'Get the latest features and improvements in the new version of Elexify.',
        icon: 'cloud-download-outline',
        confirmLabel: 'Update now',
        cancelLabel: 'Later',
        destructive: false,
        onConfirm: async () => {
          shown.current = null;
          await openStore();
        },
        onCancel: () => {
          shown.current = null;
          const skip: SkippedUpdate = {
            version: policy.latestVersion,
            at: Date.now(),
          };
          AsyncStorage.setItem(skipKey, JSON.stringify(skip)).catch(
            () => undefined,
          );
        },
      });
    };
    if (kind === 'required') show();
    else
      readSkip().then(skipped => {
        if (shouldPromptOptional(policy, skipped)) show();
      });
    return () => {
      cancelled = true;
    };
  }, [policy, confirm, dismiss]);

  return <>{children}</>;
}
