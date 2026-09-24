import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText, Feedback } from '../../components/ui';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { ShopHeader, shop } from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { Address } from '../../api/address';
import { useAddresses, useDeleteAddress, useSetDefaultAddress } from './hooks';

function AddressCard({
  address,
  onDelete,
  onError,
}: {
  address: Address;
  onDelete: (address: Address) => void;
  onError: (message: string) => void;
}) {
  const setDefault = useSetDefaultAddress();
  const locality = [address.city.name, address.state.name]
    .filter(Boolean)
    .join(', ');
  const addressLines = [
    address.addressLine1,
    address.addressLine2,
    address.landMark,
  ]
    .filter(Boolean)
    .join(', ');
  const type =
    address.addressType === 'office'
      ? 'Office'
      : address.addressType === 'home'
      ? 'Home'
      : 'Other';
  const icon =
    address.addressType === 'office'
      ? 'briefcase-outline'
      : address.addressType === 'other'
      ? 'location-outline'
      : 'home-outline';

  return (
    <View style={[styles.card, address.isDefault && styles.selectedCard]}>
      <View style={styles.topRow}>
        <View style={styles.typeIcon}>
          <Ionicons name={icon} size={21} color={theme.colors.primary} />
        </View>
        <View style={styles.identity}>
          <AppText style={styles.name}>{address.fullName}</AppText>
          <AppText style={styles.typeLabel}>{type} address</AppText>
        </View>
        {address.isDefault && (
          <View style={styles.defaultBadge}>
            <Ionicons
              name="checkmark-circle"
              size={15}
              color={theme.colors.primary}
            />
            <AppText style={styles.defaultBadgeText}>Default</AppText>
          </View>
        )}
      </View>
      <View style={styles.details}>
        <AppText style={styles.addressLine}>{addressLines}</AppText>
        <AppText style={styles.addressLine}>
          {locality ? `${locality} – ` : ''}
          {address.postcode}
        </AppText>
        {!!address.phone && (
          <AppText style={styles.phone}>
            +{address.phoneCode} {address.phone}
          </AppText>
        )}
      </View>
      <View style={styles.actionBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit address for ${address.fullName}`}
          onPress={() =>
            router.push({
              pathname: '/addresses/form',
              params: { id: address.id },
            })
          }
          style={styles.textAction}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={theme.colors.primary}
          />
          <AppText style={styles.actionLabel}>Edit</AppText>
        </Pressable>
        {!address.isDefault && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Set address for ${address.fullName} as default`}
            accessibilityState={{ disabled: setDefault.isPending }}
            disabled={setDefault.isPending}
            onPress={() =>
              setDefault.mutate(address.id, {
                onError: error => onError(error.message),
              })
            }
            style={styles.textAction}
          >
            {setDefault.isPending ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={theme.colors.primary}
              />
            )}
            <AppText style={styles.actionLabel}>Set default</AppText>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete address for ${address.fullName}`}
          onPress={() => onDelete(address)}
          style={styles.deleteAction}
        >
          <Ionicons
            name="trash-outline"
            size={19}
            color={theme.colors.danger}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function AddressListScreen() {
  const addresses = useAddresses();
  const remove = useDeleteAddress();
  const confirm = useConfirm();
  const [actionError, setActionError] = useState<string | null>(null);
  const items = [...(addresses.data?.items ?? [])].sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault),
  );

  return (
    <View style={shop.page}>
      <ShopHeader title="Address" back />
      <ScrollView contentContainerStyle={styles.body}>
        <QueryState
          pending={addresses.isPending}
          error={addresses.error}
          paused={addresses.fetchStatus === 'paused'}
          retry={() => addresses.refetch().catch(() => undefined)}
        />
        {!!actionError && (
          <AppText accessibilityRole="alert" style={styles.error}>
            {actionError}
          </AppText>
        )}
        {!addresses.isPending && !addresses.error && items.length === 0 && (
          <Feedback
            title="No saved addresses"
            message="Add an address to speed up checkout."
          />
        )}
        {items.length > 0 && (
          <AppText style={styles.sectionLabel}>
            Saved addresses ({items.length})
          </AppText>
        )}
        {items.map(address => (
          <AddressCard
            key={address.id}
            address={address}
            onError={setActionError}
            onDelete={item => {
              setActionError(null);
              confirm({
                title: 'Delete address?',
                subtitle: item.fullName,
                message:
                  'This address will be removed from your saved addresses.',
                confirmLabel: 'Delete address',
                cancelLabel: 'Keep address',
                onConfirm: () => remove.mutateAsync(item.id),
              });
            }}
          />
        ))}
      </ScrollView>
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/addresses/form')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <AppText style={styles.addLabel}>Add new address</AppText>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 14,
    flexGrow: 1,
  },
  sectionLabel: {
    color: theme.colors.secondary,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    marginBottom: 2,
  },
  card: {
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
  },
  selectedCard: { backgroundColor: '#F6FCFA', borderColor: '#A8D8D0' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { flex: 1 },
  name: {
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
  },
  typeLabel: { color: theme.colors.secondary, fontSize: 12, lineHeight: 18 },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryLight,
  },
  defaultBadgeText: {
    color: theme.colors.primaryDark,
    fontFamily: theme.fonts.medium,
    fontSize: 11,
  },
  details: { gap: 3 },
  addressLine: { color: '#4B5563', fontSize: 13, lineHeight: 20 },
  phone: {
    color: theme.colors.secondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 3,
  },
  actionBar: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  actionLabel: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
  },
  deleteAction: {
    marginLeft: 'auto',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  addButton: {
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
  error: { color: theme.colors.danger, fontSize: 13 },
});
