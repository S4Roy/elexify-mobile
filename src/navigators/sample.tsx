import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
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
import CompletedOrderScreen from '../screens/orders/CompletedOrderScreen';
import OrderDetailsScreen from '../screens/orders/OrderDetailsScreen';
import CancelOrderScreen from '../screens/orders/CancelOrderScreen';
import RecentlyViewedScreen from '../screens/account/RecentlyViewedScreen';
import ProductDetailsScreen from '../screens/product/ProductDetailsScreen';
import AddReviewScreen from '../screens/products/AddReviewScreen';

const Stack = createStackNavigator();

export default function StackNav() {
  const Screens = {
    SplashScreen,
    // LoginScreen,
    // SignupScreen,
    // OTPScreen,
    // DetailsScreen,
    // BottomTab,
    // NotificationScreen,
    // CartScreen,
    // CheckoutScreen,
    // SearchScreen,
    // ManageAddressScreen,
    // AddAddressScreen,
    // WishlistScreen,
    // ManageAppScreen,
    // FAQScreen,
    // OngoingOrderScreen,
    // CompletedOrderScreen,
    // OrderDetailsScreen,
    // CancelOrderScreen,
    // RecentlyViewedScreen,
    // ProductDetailsScreen,
    // AddReviewScreen,
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          //  gestureEnabled: false
        }}
      >
        {Object.entries({
          ...Screens,
        }).map(([name, component], index) => {
          //@ts-ignore
          return <Stack.Screen key={index} name={name} component={component} />;
        })}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
