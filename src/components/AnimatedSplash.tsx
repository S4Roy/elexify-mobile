import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../theme';

// Brand handoff after the native launch screen (Theme.App.SplashScreen):
//  1. First frame is pixel-identical to the native splash — teal, white bolt
//     96x120dp at the exact centre — so hiding the native one is invisible.
//  2. Once fonts are in, the bolt settles up and the "elexify" wordmark
//     fades in beneath it (a short, one-off reveal; no endless pulse).
//  3. When the app is ready and the reveal has been seen, the overlay fades
//     out. A spinner appears only if loading is unusually slow.
// Honours the OS "remove animations" setting with plain fades.

const BOLT = { width: 96, height: 120 };
const MIN_VISIBLE_MS = 900; // long enough to read the brand, short enough not to annoy
const SLOW_LOAD_MS = 2500;

export function AnimatedSplash({
  ready,
  brandReady,
  onFinish,
}: {
  /** App can be shown (fonts + session restored). */
  ready: boolean;
  /** Fonts loaded — the wordmark can render in Poppins. */
  brandReady: boolean;
  onFinish: () => void;
}) {
  const mountedAt = useRef(Date.now()).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [slow, setSlow] = useState(false);

  const boltShift = useRef(new Animated.Value(0)).current; // 0 = native position, 1 = settled
  const wordmark = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(1)).current;
  const spinner = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Our first frame matches the native splash, so swap instantly — the
    // default 400ms native fade would show both bolts at once.
    SplashScreen.setOptions({ duration: 0, fade: false });
    SplashScreen.hideAsync().catch(() => undefined);
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const timer = setTimeout(() => setSlow(true), SLOW_LOAD_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!brandReady) return;
    Animated.parallel([
      Animated.timing(boltShift, {
        toValue: 1,
        duration: reduceMotion ? 0 : 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(wordmark, {
        toValue: 1,
        duration: reduceMotion ? 200 : 400,
        delay: reduceMotion ? 0 : 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => setIntroDone(true));
  }, [brandReady, reduceMotion, boltShift, wordmark]);

  useEffect(() => {
    if (!slow || ready) return;
    Animated.timing(spinner, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [slow, ready, spinner]);

  useEffect(() => {
    if (!ready || !introDone) return;
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - mountedAt));
    const timer = setTimeout(() => {
      Animated.timing(overlay, {
        toValue: 0,
        duration: 280,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(onFinish);
    }, wait);
    return () => clearTimeout(timer);
  }, [ready, introDone, mountedAt, overlay, onFinish]);

  const settle = reduceMotion ? 0 : 1;
  const boltTransform = [
    { translateY: boltShift.interpolate({ inputRange: [0, 1], outputRange: [0, -34 * settle] }) },
    { scale: boltShift.interpolate({ inputRange: [0, 1], outputRange: [1, settle ? 0.72 : 1] }) },
  ];
  const wordmarkTransform = [
    { translateY: wordmark.interpolate({ inputRange: [0, 1], outputRange: [10 * settle, 0] }) },
  ];

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.overlay, { opacity: overlay }]}
    >
      <StatusBar style="light" />
      <Animated.Image
        source={require('../assets/images/splash-bolt.png')}
        resizeMode="contain"
        style={[styles.bolt, { transform: boltTransform }]}
      />
      <Animated.View style={[styles.wordmarkWrap, { opacity: wordmark, transform: wordmarkTransform }]}>
        {brandReady && (
          <>
            <Text allowFontScaling={false} style={styles.wordmark}>elexify</Text>
            <Text allowFontScaling={false} style={styles.caption}>ONLINE</Text>
          </>
        )}
      </Animated.View>
      <Animated.View style={[styles.spinner, { opacity: spinner }]}>
        {slow && !ready && <ActivityIndicator color="#FFFFFF" />}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // No zIndex: the splash is rendered last in the root layout, so it
    // already draws on top. On Android a zIndexed child crashes the parent
    // ("getChildDrawingOrder() returned invalid index") when the splash
    // unmounts and the sibling count drops.
  },
  bolt: BOLT,
  // Sits just below the settled bolt without moving the bolt's centre.
  wordmarkWrap: {
    position: 'absolute',
    top: '50%',
    marginTop: 30,
    alignItems: 'center',
  },
  wordmark: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bold,
    fontSize: 34,
    letterSpacing: 3,
    lineHeight: 42,
  },
  caption: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: theme.fonts.semibold,
    fontSize: 11,
    letterSpacing: 5,
    marginTop: -2,
  },
  spinner: {
    position: 'absolute',
    bottom: '12%',
  },
});
