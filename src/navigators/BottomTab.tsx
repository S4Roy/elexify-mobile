import { StyleSheet, Text, View, Image, Dimensions } from 'react-native';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import normalize from '../utils/helper/normalize';
import HomeScreen from '../screens/home/HomeScreen';
import { COLORS, FONTS, ICONS } from '../utils/constants';
import CategoryScreen from '../screens/category/CategoryScreen';
import BrandsScreen from '../screens/brands/BrandsScreen';
import AccountScreen from '../screens/account/AccountScreen';

const Tab = createBottomTabNavigator();

const width = Dimensions.get('window').width * 0.25;

const BottomTab = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="HomeScreen"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          height: normalize(50) + insets.bottom, // Add bottom safe area
          borderTopWidth: normalize(1),
          borderTopColor: '#EFEFEF',
          paddingTop: normalize(12),
          // paddingBottom: insets.bottom, // Add bottom padding for safe area
          backgroundColor: COLORS.white,
          elevation: 0, // Remove shadow on Android
          shadowOpacity: 0, // Remove shadow on iOS
        },
      }}
    >
      <Tab.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.con}>
              <Image
                source={focused ? ICONS.home : ICONS.inhome}
                style={{
                  height: normalize(20),
                  width: normalize(20),
                  resizeMode: 'contain',
                }}
              />
              <Text
                style={{
                  fontSize: normalize(10),
                  fontFamily: FONTS.medium,
                  color: focused ? COLORS.primary : COLORS.mediumGray,
                  marginTop: normalize(2),
                }}
              >
                Home
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="CategoryScreen"
        component={CategoryScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.con}>
              <Image
                source={focused ? ICONS.category : ICONS.incategory}
                style={{
                  height: normalize(20),
                  width: normalize(20),
                  resizeMode: 'contain',
                }}
              />
              <Text
                style={{
                  fontSize: normalize(10),
                  fontFamily: FONTS.medium,
                  color: focused ? COLORS.primary : COLORS.mediumGray,
                  marginTop: normalize(2),
                }}
              >
                Category
              </Text>
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="BrandsScreen"
        component={BrandsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.con}>
              <Image
                source={focused ? ICONS.brands : ICONS.inbrands}
                style={{
                  height: normalize(20),
                  width: normalize(20),
                  resizeMode: 'contain',
                  // tintColor: focused ? COLORS.primary : COLORS.mediumGray,
                }}
              />
              <Text
                style={{
                  fontSize: normalize(10),
                  fontFamily: FONTS.medium,
                  color: focused ? COLORS.primary : COLORS.mediumGray,
                  marginTop: normalize(2),
                }}
              >
                Brands
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="AccountScreen"
        component={AccountScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.con}>
              <Image
                source={focused ? ICONS.account : ICONS.inaccount}
                style={{
                  height: normalize(20),
                  width: normalize(20),
                  resizeMode: 'contain',
                  // tintColor: focused ? COLORS.black : COLORS.mediumGray,
                }}
              />
              <Text
                style={{
                  fontSize: normalize(10),
                  fontFamily: FONTS.medium,
                  color: focused ? COLORS.primary : COLORS.mediumGray,
                  marginTop: normalize(2),
                }}
              >
                Account
              </Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTab;

const styles = StyleSheet.create({
  con: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
