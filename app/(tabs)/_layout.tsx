import React from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../src/theme';
import { useCart } from '../../src/features/cart/hooks';
const tabs = [
  { name: 'index', title: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'categories', title: 'Category', icon: 'grid-outline', activeIcon: 'grid' },
  { name: 'cart', title: 'Cart', icon: 'bag-outline', activeIcon: 'bag' },
  { name: 'account', title: 'Account', icon: 'person-outline', activeIcon: 'person' },
] as const;
const tabOptions = tabs.map(tab => ({
  ...tab,
  options: {
    title: tab.title,
    tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
      <Ionicons name={focused ? tab.activeIcon : tab.icon} size={size} color={color} />
    ),
  },
}));
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const cartCount =
    cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondary,
        tabBarLabelStyle: { fontFamily: theme.fonts.medium, fontSize: 12 },
        tabBarStyle: {
          height: 58 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(8, insets.bottom),
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
        tabBarItemStyle: { borderRadius: 12, marginHorizontal: 4 },
      }}
    >
      {tabOptions.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={
            tab.name === 'cart'
              ? {
                  ...tab.options,
                  tabBarBadge:
                    cartCount > 0 ? (cartCount > 99 ? '99+' : cartCount) : undefined,
                  tabBarBadgeStyle: { backgroundColor: theme.colors.danger },
                  tabBarStyle: { display: 'none' },
                }
              : tab.options
          }
        />
      ))}
    </Tabs>
  );
}
