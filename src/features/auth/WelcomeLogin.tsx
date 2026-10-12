import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import { useSession } from '../../stores/session';
import { useWelcome } from './welcome';

/** Opens the skippable login once on first launch (see welcome.ts). Rendered
 * in the root layout; pushes under the splash so the customer lands on it
 * directly when the splash fades, without a flash of Home first. */
export function WelcomeLogin() {
  const sessionStatus = useSession(s => s.status);
  const phase = useWelcome(s => s.phase);
  const decide = useWelcome(s => s.decide);
  const navigationReady = !!useRootNavigationState()?.key;
  const opened = useRef(false);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    (async () => {
      // Opened from a link (shared product, notification, ad): go where they meant to.
      const url = await Linking.getInitialURL().catch(() => null);
      const path = url?.replace(/^[a-z][\w+.-]*:\/\/[^/]*/i, '').replace(/^\/+|\/+$/g, '') ?? '';
      if (path && !path.startsWith('?')) {
        useWelcome.getState().finish();
        return;
      }
      await decide(sessionStatus);
    })().catch(() => useWelcome.getState().finish());
  }, [sessionStatus, decide]);

  useEffect(() => {
    if (phase !== 'show' || !navigationReady || opened.current) return;
    opened.current = true;
    router.push({ pathname: '/login', params: { welcome: '1' } });
  }, [phase, navigationReady]);

  return null;
}
