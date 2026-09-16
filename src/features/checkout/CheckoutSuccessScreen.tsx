import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText, Button } from '../../components/ui';
import { shop } from '../../components/shop';
import { theme } from '../../theme';

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? '';

export default function CheckoutSuccessScreen() {
  const route = useLocalSearchParams<{ orderId?: string; orderNumber?: string }>();
  const orderId = first(route.orderId);
  const orderNumber = first(route.orderNumber);

  return (
    <View style={[shop.page, styles.center]}>
      <Ionicons name="checkmark-circle" size={72} color={theme.colors.primary} />
      <AppText accessibilityRole="header" style={styles.title}>
        Order placed!
      </AppText>
      {!!orderNumber && <AppText style={shop.muted}>Order {orderNumber}</AppText>}
      <View style={styles.actions}>
        <Button
          label="View order"
          onPress={() => (orderId ? router.replace({ pathname: '/orders/[id]', params: { id: orderId } }) : router.replace('/orders'))}
        />
        <Button label="Continue shopping" onPress={() => router.replace('/')} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontFamily: theme.fonts.bold, fontSize: 22 },
  actions: { gap: 10, width: '100%', marginTop: 12 },
});
