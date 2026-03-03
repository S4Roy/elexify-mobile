import { NavigationContainer } from '@react-navigation/native';
import {
  createStackNavigator,
  TransitionPresets,
  CardStyleInterpolators,
} from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { Platform, Easing } from 'react-native';
import { navigationRef } from '../utils/helper/RootNavigation';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import DetailsScreen from '../screens/auth/DetailsScreen';
import BottomTab from './BottomTab';
import SplashScreen from '../screens/auth/SplashScreen';
import NotificationScreen from '../screens/notifications/NotificationScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/cart/CheckoutScreen';
import SearchScreen from '../screens/search/SearchScreen';
import ManageAddressScreen from '../screens/account/ManageAddressScreen';
import AddAddressScreen from '../screens/account/AddAddressScreen';
import WishlistScreen from '../screens/account/WishlistScreen';
import ManageAppScreen from '../screens/account/ManageAppScreen';
import FAQScreen from '../screens/account/FAQScreen';
import OngoingOrderScreen from '../screens/orders/OngoingOrderScreen';
import CanceledListScreen from '../screens/orders/CanceledListScreen';
import ReturnOrderScreen from '../screens/orders/ReturnOrderScreen';
import CompletedOrderScreen from '../screens/orders/CompletedOrderScreen';
import OrderDetailsScreen from '../screens/orders/OrderDetailsScreen';
import CancelOrderScreen from '../screens/orders/CancelOrderScreen';
import RecentlyViewedScreen from '../screens/account/RecentlyViewedScreen';
import ProductDetailsScreen from '../screens/product/ProductDetailsScreen';
import AddReviewScreen from '../screens/products/AddReviewScreen';

type RootStackParamList = {
  SplashScreen: undefined;
  // LoginScreen: undefined;
  // SignupScreen: undefined;
  // OTPScreen: undefined;
  // DetailsScreen: undefined;
  BottomTab: undefined;
  NotificationScreen: undefined;
  CartScreen: undefined;
  CheckoutScreen: undefined;
  SearchScreen: undefined;
  ManageAddressScreen: undefined;
  AddAddressScreen: undefined;
  WishlistScreen: undefined;
  ManageAppScreen: undefined;
  FAQScreen: undefined;
  OngoingOrderScreen: undefined;
  CompletedOrderScreen: undefined;
  OrderDetailsScreen: undefined;
  CancelOrderScreen: undefined;
  RecentlyViewedScreen: undefined;
  ProductDetailsScreen: undefined;
  AddReviewScreen: undefined;
  CanceledListScreen: undefined;
  ReturnOrderScreen: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Enhanced smooth transition configuration
const smoothTransition = {
  // gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
  transitionSpec: {
    open: {
      animation: 'timing' as const,
      config: {
        duration: 350,
        easing: Easing.out(Easing.poly(4)),
      },
    },
    close: {
      animation: 'timing' as const,
      config: {
        duration: 300,
        easing: Easing.in(Easing.poly(4)),
      },
    },
  },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

export default function StackNav() {
  const Screens: {
    [key in keyof RootStackParamList]: React.ComponentType<any>;
  } = {
    SplashScreen,
    // LoginScreen,
    // SignupScreen,
    // OTPScreen,
    // DetailsScreen,
    BottomTab,
    NotificationScreen,
    CartScreen,
    CheckoutScreen,
    SearchScreen,
    ManageAddressScreen,
    AddAddressScreen,
    WishlistScreen,
    ManageAppScreen,
    FAQScreen,
    OngoingOrderScreen,
    CompletedOrderScreen,
    OrderDetailsScreen,
    CancelOrderScreen,
    RecentlyViewedScreen,
    ProductDetailsScreen,
    AddReviewScreen,
    CanceledListScreen,
    ReturnOrderScreen,
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          ...smoothTransition,
        }}
      >
        {Object.entries({
          ...Screens,
        }).map(([name, component], index) => {
          return (
            <Stack.Screen
              key={index}
              name={name as keyof RootStackParamList}
              component={component}
              options={{
                ...smoothTransition,
                // gestureEnabled: true,
                gestureResponseDistance: 50, // Increase swipe sensitivity
              }}
            />
          );
        })}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
