import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './ui';
import { theme } from '../theme';

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const THUMB = 52;
const THUMB_GAP = 8;

// Pan modes, decided on the first move of each drag.
const UNDECIDED = 0;
const PAGE = 1;
const DISMISS = 2;
const ZOOM_PAN = 3;

const clamp = (value: number, min: number, max: number) => {
  'worklet';
  return Math.min(max, Math.max(min, value));
};

type Size = { w: number; h: number };

/**
 * Full-screen photo viewer: swipe between photos, pinch or double-tap to zoom,
 * drag a zoomed photo around, swipe down to close, tap to hide the controls.
 * Mount it only while open — it renders its own Modal.
 */
export function ImageViewer({
  images,
  initialIndex = 0,
  title,
  onClose,
}: {
  images: string[];
  initialIndex?: number;
  title?: string;
  /** Receives the photo the customer ended on, to sync the gallery behind. */
  onClose: (index: number) => void;
}) {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const count = images.length;
  const startIndex = clamp(initialIndex, 0, Math.max(0, count - 1));
  const [size, setSize] = useState<Size>({ w: window.width, h: window.height });
  const [index, setIndex] = useState(startIndex);
  const [chrome, setChrome] = useState(true);
  const [aspects, setAspects] = useState<Record<number, number>>({});
  const thumbsRef = useRef<ScrollView>(null);

  const W = size.w;
  const H = size.h;
  const indexSV = useSharedValue(startIndex);
  const pagerX = useSharedValue(-startIndex * W);
  const dismissY = useSharedValue(0);
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const aspect = useSharedValue(1);
  const mode = useSharedValue(UNDECIDED);
  const pinching = useSharedValue(false);
  const pinchStart = useSharedValue({ s: 1, tx: 0, ty: 0, fx: 0, fy: 0 });

  const close = useCallback(() => onClose(indexSV.value), [onClose, indexSV]);
  const toggleChrome = useCallback(() => setChrome(c => !c), []);

  useEffect(() => {
    aspect.value = aspects[index] ?? 1;
  }, [aspect, aspects, index]);

  // Keep the page offset right if the viewer is re-laid out (rotation, or
  // the first real layout replacing the window-size estimate).
  useEffect(() => {
    pagerX.value = -indexSV.value * W;
  }, [W, pagerX, indexSV]);

  useEffect(() => {
    thumbsRef.current?.scrollTo({
      x: Math.max(0, index * (THUMB + THUMB_GAP) - (W - THUMB) / 2),
      animated: true,
    });
  }, [index, W]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) {
      setSize({ w: width, h: height });
    }
  };

  /** How far a photo zoomed to `s` may move before its edge leaves the frame. */
  const bounds = (s: number) => {
    'worklet';
    const wide = aspect.value > W / H;
    const fitW = wide ? W : H * aspect.value;
    const fitH = wide ? W / aspect.value : H;
    return {
      x: Math.max(0, (fitW * s - W) / 2),
      y: Math.max(0, (fitH * s - H) / 2),
    };
  };

  const resetZoom = () => {
    'worklet';
    scale.value = withTiming(1);
    tx.value = withTiming(0);
    ty.value = withTiming(0);
  };

  const settleZoom = () => {
    'worklet';
    if (scale.value <= 1) {
      resetZoom();
      return;
    }
    const b = bounds(scale.value);
    tx.value = withTiming(clamp(tx.value, -b.x, b.x));
    ty.value = withTiming(clamp(ty.value, -b.y, b.y));
  };

  const goTo = (next: number) => {
    'worklet';
    const target = clamp(next, 0, count - 1);
    indexSV.value = target;
    scale.value = 1;
    tx.value = 0;
    ty.value = 0;
    pagerX.value = withTiming(-target * W, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
    runOnJS(setIndex)(target);
  };

  const pinch = Gesture.Pinch()
    .onStart(e => {
      pinching.value = true;
      // A second finger mid-swipe turns the swipe into a zoom.
      if (mode.value === PAGE) {
        pagerX.value = withTiming(-indexSV.value * W);
      } else if (mode.value === DISMISS) {
        dismissY.value = withSpring(0);
      }
      mode.value = ZOOM_PAN;
      pinchStart.value = {
        s: scale.value,
        tx: tx.value,
        ty: ty.value,
        fx: e.focalX - W / 2,
        fy: e.focalY - H / 2,
      };
    })
    .onUpdate(e => {
      const start = pinchStart.value;
      const s = clamp(start.s * e.scale, 0.8, MAX_SCALE);
      const k = s / start.s;
      const fx = e.focalX - W / 2;
      const fy = e.focalY - H / 2;
      // Keep the point under the fingers fixed while scaling, and follow the
      // fingers if they move together.
      tx.value = fx - (start.fx - start.tx) * k;
      ty.value = fy - (start.fy - start.ty) * k;
      scale.value = s;
    })
    .onEnd(() => settleZoom())
    .onFinalize(() => {
      pinching.value = false;
    });

  const pan = Gesture.Pan()
    .minDistance(6)
    .averageTouches(true)
    .onStart(() => {
      mode.value = scale.value > 1.01 ? ZOOM_PAN : UNDECIDED;
    })
    .onChange(e => {
      if (pinching.value) {
        return;
      }
      if (mode.value === ZOOM_PAN) {
        if (scale.value <= 1.01) {
          return;
        }
        // Resist dragging past the photo's edge.
        const b = bounds(scale.value);
        const nx = tx.value + e.changeX;
        const ny = ty.value + e.changeY;
        tx.value = Math.abs(nx) > b.x ? tx.value + e.changeX * 0.35 : nx;
        ty.value = Math.abs(ny) > b.y ? ty.value + e.changeY * 0.35 : ny;
        return;
      }
      if (mode.value === UNDECIDED) {
        mode.value =
          Math.abs(e.translationX) >= Math.abs(e.translationY) ? PAGE : DISMISS;
      }
      if (mode.value === PAGE) {
        const pastEdge =
          (indexSV.value === 0 && e.translationX > 0) ||
          (indexSV.value === count - 1 && e.translationX < 0);
        pagerX.value =
          -indexSV.value * W + e.translationX * (pastEdge ? 0.3 : 1);
      } else {
        dismissY.value = e.translationY;
      }
    })
    .onEnd(e => {
      if (mode.value === ZOOM_PAN) {
        if (pinching.value || scale.value <= 1.01) {
          return;
        }
        const b = bounds(scale.value);
        tx.value =
          Math.abs(tx.value) > b.x
            ? withTiming(clamp(tx.value, -b.x, b.x))
            : withDecay({ velocity: e.velocityX, clamp: [-b.x, b.x] });
        ty.value =
          Math.abs(ty.value) > b.y
            ? withTiming(clamp(ty.value, -b.y, b.y))
            : withDecay({ velocity: e.velocityY, clamp: [-b.y, b.y] });
      } else if (mode.value === PAGE) {
        let next = indexSV.value;
        if (e.translationX < -W * 0.2 || e.velocityX < -600) {
          next += 1;
        } else if (e.translationX > W * 0.2 || e.velocityX > 600) {
          next -= 1;
        }
        goTo(next);
      } else if (mode.value === DISMISS) {
        if (Math.abs(e.translationY) > 120 || Math.abs(e.velocityY) > 900) {
          const direction = e.translationY < 0 ? -1 : 1;
          dismissY.value = withTiming(
            direction * H,
            { duration: 180 },
            done => {
              if (done) {
                runOnJS(close)();
              }
            },
          );
        } else {
          dismissY.value = withSpring(0, { damping: 18, stiffness: 180 });
        }
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(250)
    .maxDistance(24)
    .onEnd(e => {
      if (scale.value > 1.01) {
        resetZoom();
        return;
      }
      const b = bounds(DOUBLE_TAP_SCALE);
      tx.value = withTiming(
        clamp((e.x - W / 2) * (1 - DOUBLE_TAP_SCALE), -b.x, b.x),
      );
      ty.value = withTiming(
        clamp((e.y - H / 2) * (1 - DOUBLE_TAP_SCALE), -b.y, b.y),
      );
      scale.value = withTiming(DOUBLE_TAP_SCALE);
    });

  const singleTap = Gesture.Tap()
    .maxDistance(10)
    .onEnd(() => {
      runOnJS(toggleChrome)();
    });

  const gesture = Gesture.Simultaneous(
    pinch,
    pan,
    Gesture.Exclusive(doubleTap, singleTap),
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - clamp(Math.abs(dismissY.value) / (H * 0.5), 0, 0.85),
  }));
  const pagerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pagerX.value },
      { translateY: dismissY.value },
      { scale: 1 - clamp(Math.abs(dismissY.value) / H, 0, 0.25) },
    ],
  }));
  const chromeStyle = useAnimatedStyle(() => ({
    opacity: 1 - clamp(Math.abs(dismissY.value) / 120, 0, 1),
  }));

  const jumpTo = (next: number) => {
    scale.value = 1;
    tx.value = 0;
    ty.value = 0;
    indexSV.value = next;
    pagerX.value = withTiming(-next * W, { duration: 260 });
    setIndex(next);
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      <StatusBar barStyle="light-content" />
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
        <GestureDetector gesture={gesture}>
          <View
            style={styles.root}
            onLayout={onLayout}
            accessible
            accessibilityLabel={`Photo ${index + 1} of ${count}${
              title ? `, ${title}` : ''
            }`}
            accessibilityHint="Pinch or double-tap to zoom. Swipe down to close."
          >
            <Animated.View
              style={[
                styles.pager,
                { width: W * count, height: H },
                pagerStyle,
              ]}
            >
              {images.map((uri, i) => (
                <ViewerPage
                  key={uri + i}
                  uri={uri}
                  width={W}
                  height={H}
                  active={i === index}
                  scale={scale}
                  tx={tx}
                  ty={ty}
                  onAspect={value =>
                    setAspects(current =>
                      current[i] === value
                        ? current
                        : { ...current, [i]: value },
                    )
                  }
                />
              ))}
            </Animated.View>
          </View>
        </GestureDetector>

        {chrome && (
          <Animated.View
            pointerEvents="box-none"
            style={[styles.chrome, chromeStyle]}
          >
            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close photos"
                onPress={close}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.roundButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
              <View style={styles.topCenter}>
                {!!title && (
                  <AppText numberOfLines={1} style={styles.title}>
                    {title}
                  </AppText>
                )}
              </View>
              {count > 1 ? (
                <View style={styles.counter}>
                  <AppText style={styles.counterText}>
                    {index + 1} / {count}
                  </AppText>
                </View>
              ) : (
                <View style={styles.roundButton} />
              )}
            </View>

            {count > 1 && (
              <View
                style={[
                  styles.bottomBar,
                  { paddingBottom: insets.bottom + 12 },
                ]}
              >
                <ScrollView
                  ref={thumbsRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbRow}
                >
                  {images.map((uri, i) => (
                    <Pressable
                      key={uri + i}
                      accessibilityRole="button"
                      accessibilityLabel={`Show photo ${i + 1}`}
                      accessibilityState={{ selected: i === index }}
                      onPress={() => jumpTo(i)}
                      style={[styles.thumb, i === index && styles.thumbActive]}
                    >
                      <Image
                        source={{ uri }}
                        resizeMode="cover"
                        style={styles.thumbImage}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </Animated.View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

function ViewerPage({
  uri,
  width,
  height,
  active,
  scale,
  tx,
  ty,
  onAspect,
}: {
  uri: string;
  width: number;
  height: number;
  active: boolean;
  scale: SharedValue<number>;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  onAspect: (aspect: number) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const zoomStyle = useAnimatedStyle(() =>
    active
      ? {
          transform: [
            { translateX: tx.value },
            { translateY: ty.value },
            { scale: scale.value },
          ],
        }
      : { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }] },
  );
  return (
    <View style={{ width, height }}>
      <Animated.View style={[styles.page, zoomStyle]}>
        {failed ? (
          <View style={styles.failed}>
            <Ionicons name="image-outline" size={40} color="#9CA3AF" />
            <AppText style={styles.failedText}>Photo unavailable</AppText>
          </View>
        ) : (
          <Image
            source={{ uri }}
            resizeMode="contain"
            style={{ width, height }}
            onLoad={e => {
              const source = e.nativeEvent.source;
              if (source?.width && source?.height) {
                onAspect(source.width / source.height);
              }
            }}
            onLoadEnd={() => setLoading(false)}
            onError={() => setFailed(true)}
          />
        )}
      </Animated.View>
      {loading && !failed && (
        <ActivityIndicator
          color="#FFFFFF"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000' },
  pager: { flexDirection: 'row' },
  page: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  failed: { alignItems: 'center', gap: 8 },
  failedText: { color: '#9CA3AF', fontSize: 14 },
  chrome: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  topCenter: { flex: 1, minWidth: 0 },
  title: { color: '#FFFFFF', fontFamily: theme.fonts.medium, fontSize: 15 },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  pressed: { opacity: 0.6 },
  counter: {
    minWidth: 40,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  counterText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  bottomBar: { paddingTop: 12, backgroundColor: 'rgba(0,0,0,0.35)' },
  thumbRow: { paddingHorizontal: 16, gap: THUMB_GAP },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    opacity: 0.55,
    backgroundColor: '#FFFFFF',
  },
  thumbActive: { borderColor: '#FFFFFF', opacity: 1 },
  thumbImage: { width: '100%', height: '100%' },
});
