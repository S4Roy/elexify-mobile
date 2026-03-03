import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TrackOrderScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track Order</Text>
      {/* Add your track order components here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default TrackOrderScreen;
