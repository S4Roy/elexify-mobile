import { Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import normalize from '../../utils/helper/normalize';
import { IMAGES } from '../../utils/constants';
import { navigate } from '../../utils/helper/RootNavigation';

const SplashScreen = () => {
  useEffect(() => {
    setTimeout(() => {
      navigate('BottomTab');
    }, 3000);
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
      }}
    >
      <StatusBar barStyle={'dark-content'} backgroundColor={'#FFFFFF'} />
      <Image
        source={IMAGES.logo}
        style={{
          height: normalize(90),
          width: normalize(180),
          resizeMode: 'contain',
        }}
      />
    </SafeAreaView>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({});
