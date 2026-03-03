import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FilterScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filter</Text>
      {/* Add your filter components here */}
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

export default FilterScreen;
