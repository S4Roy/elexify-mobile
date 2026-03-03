import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProductListScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product List</Text>
      {/* Add your product list components here */}
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

export default ProductListScreen;
