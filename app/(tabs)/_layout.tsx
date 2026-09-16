import React from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../../src/theme';
const tabs = [
  { name: 'index', title: 'Home', icon: 'home-outline' },
  { name: 'categories', title: 'Categories', icon: 'grid-outline' },
  { name: 'cart', title: 'Cart', icon: 'bag-outline' },
  { name: 'account', title: 'Account', icon: 'person-outline' },
] as const;
const tabOptions = tabs.map(tab => ({
  ...tab,
  options: {
    title: tab.title,
    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
      <Ionicons name={tab.icon} size={size} color={color} />
    ),
  },
}));
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondary,
        tabBarLabelStyle: { fontFamily: theme.fonts.medium },
      }}
    >
      {tabOptions.map(tab => (
        <Tabs.Screen key={tab.name} name={tab.name} options={tab.options} />
      ))}
    </Tabs>
  );
}
