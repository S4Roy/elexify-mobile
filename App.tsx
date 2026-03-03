/**
 * Elexify E-commerce Mobile App
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, View, Text, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

// Import navigation
import StackNav from './src/navigators/StackNav';
LogBox.ignoreLogs(['Warning: ...']);
LogBox.ignoreAllLogs();

// Enable screens for better performance
enableScreens();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={'dark-content'} backgroundColor={'#FFFFFF'} />

      <StackNav />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#000000',
  },
});

export default App;
