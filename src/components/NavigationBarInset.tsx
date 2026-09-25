import React, { createContext, useContext, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  type EdgeInsets,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

// The real window insets, for content that draws in its own full-screen
// window (Modal-based sheets, dialogs, the image viewer): those windows sit
// behind the system bars again, so they must not use the zeroed bottom inset
// the app's screens see.
const WindowInsetsContext = createContext<EdgeInsets | null>(null);

/** Insets of the whole window — use inside a Modal instead of useSafeAreaInsets. */
export function useWindowInsets(): EdgeInsets {
  const screen = useSafeAreaInsets();
  return useContext(WindowInsetsContext) ?? screen;
}

// Android draws the app edge-to-edge, so without this every scrolling screen
// runs underneath the translucent system navigation bar: content shows
// through it faded and the end of a page can never scroll clear of it.
// Reserving the bar's height once, here, keeps all screens above it.
//
// Descendants see a bottom inset of 0 so screens that already pad for it
// (tab bar, sticky checkout/cart bars) don't pad twice. Native SafeAreaViews
// measure their own position and resolve to 0 on their own. iOS keeps its
// usual behaviour of drawing behind the home indicator.
export function NavigationBarInset({ children }: React.PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const reserve = Platform.OS === 'android' ? insets.bottom : 0;
  const inner = useMemo(
    () => ({ ...insets, bottom: insets.bottom - reserve }),
    [insets, reserve],
  );
  return (
    <WindowInsetsContext.Provider value={insets}>
      <View style={styles.root}>
        <SafeAreaInsetsContext.Provider value={inner}>
          <View style={styles.content}>{children}</View>
        </SafeAreaInsetsContext.Provider>
        <View style={{ height: reserve }} />
      </View>
    </WindowInsetsContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1 },
});
