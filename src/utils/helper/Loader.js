import React from 'react';
import { ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Loader(props) {
  return props.visible ? (
    <SafeAreaView
      style={{
        height: Dimensions.get('window').height,
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 10,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator size="large" color={'white'} />
    </SafeAreaView>
  ) : null;
}
