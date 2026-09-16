import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Feedback } from '../../components/ui';
import { ShopHeader, shop } from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { Address } from '../../api/address';
import { useAddresses, useDeleteAddress, useSetDefaultAddress } from './hooks';

function Card({ address }: { address: Address }) {
  const setDefault = useSetDefaultAddress();
  const remove = useDeleteAddress();
  const locality = [address.city.name, address.state.name].filter(Boolean).join(', ');

  return (
    <View style={styles.card}>
      <View style={shop.between}>
        <AppText style={styles.name}>{address.fullName}</AppText>
        {address.isDefault && <AppText style={styles.badge}>Default</AppText>}
      </View>
      <AppText style={shop.muted}>
        {[address.addressLine1, address.addressLine2, address.landMark]
          .filter(Boolean)
          .join(', ')}
      </AppText>
      {!!locality && <AppText style={shop.muted}>{locality + ' ' + address.postcode}</AppText>}
      <AppText style={shop.muted}>+{address.phoneCode} {address.phone}</AppText>
      <View style={shop.row}>
        <View style={shop.flex}>
          <Button
            label="Edit"
            onPress={() => router.push({ pathname: '/addresses/form', params: { id: address.id } })}
          />
        </View>
        {!address.isDefault && (
          <View style={shop.flex}>
            <Button
              label={setDefault.isPending ? 'Setting…' : 'Set as default'}
              disabled={setDefault.isPending}
              onPress={() => setDefault.mutate(address.id)}
            />
          </View>
        )}
        <AppText
          accessibilityRole="button"
          onPress={() =>
            Alert.alert('Delete address', 'Remove this address?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => remove.mutate(address.id),
              },
            ])
          }
          style={styles.remove}
        >
          Delete
        </AppText>
      </View>
    </View>
  );
}

export default function AddressListScreen() {
  const addresses = useAddresses();
  const items = addresses.data?.items ?? [];

  return (
    <View style={shop.page}>
      <ShopHeader title="Your addresses" back />
      <View style={styles.body}>
        <QueryState
          pending={addresses.isPending}
          error={addresses.error}
          paused={addresses.fetchStatus === 'paused'}
          retry={() => {
            addresses.refetch().catch(() => undefined);
          }}
        />
        {!addresses.isPending && items.length === 0 && (
          <Feedback
            title="No saved addresses"
            message="Add an address to speed up checkout."
          />
        )}
        {items.map(address => (
          <Card key={address.id} address={address} />
        ))}
        <Button label="Add new address" onPress={() => router.push('/addresses/form')} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  body: { padding: 16, gap: 16 },
  card: {
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
  },
  name: { fontFamily: theme.fonts.medium, fontSize: 16 },
  badge: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    fontSize: 12,
  },
  remove: { color: theme.colors.danger, fontFamily: theme.fonts.medium, alignSelf: 'center' },
});
