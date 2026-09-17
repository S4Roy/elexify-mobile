import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText, Feedback } from '../../components/ui';
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
  const locality = [address.city.name, address.state.name].filter(Boolean).join(', ');
  const addressLines = [address.addressLine1, address.addressLine2, address.landMark].filter(Boolean).join(', ');
  const type = address.addressType === 'office' ? 'Office' : address.addressType === 'home' ? 'Home' : 'Other';
  const icon = address.addressType === 'office' ? 'briefcase-outline' : address.addressType === 'other' ? 'location-outline' : 'home-outline';

  return (
    <View style={[styles.card, address.isDefault && styles.selectedCard]}>
      <View style={styles.topRow}>
        <View style={styles.typeIcon}><Ionicons name={icon} size={21} color={theme.colors.primary} /></View>
        <View style={styles.identity}>
          <AppText style={styles.name}>{address.fullName}</AppText>
          <AppText style={styles.typeLabel}>{type} address</AppText>
        </View>
        {address.isDefault && (
          <View style={styles.defaultBadge}>
            <Ionicons name="checkmark-circle" size={15} color={theme.colors.primary} />
            <AppText style={styles.defaultBadgeText}>Default</AppText>
          </View>
        )}
      </View>
      <View style={styles.details}>
        <AppText style={styles.addressLine}>{addressLines}</AppText>
        <AppText style={styles.addressLine}>{locality ? `${locality} – ` : ''}{address.postcode}</AppText>
        {!!address.phone && <AppText style={styles.phone}>+{address.phoneCode} {address.phone}</AppText>}
      </View>
      <View style={styles.actionBar}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Edit address for ${address.fullName}`}
          onPress={() => router.push({ pathname: '/addresses/form', params: { id: address.id } })} style={styles.textAction}>
          <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
          <AppText style={styles.actionLabel}>Edit</AppText>
        </Pressable>
        {!address.isDefault && (
          <Pressable accessibilityRole="button" accessibilityLabel={`Set address for ${address.fullName} as default`}
            accessibilityState={{ disabled: setDefault.isPending }} disabled={setDefault.isPending}
            onPress={() => setDefault.mutate(address.id, { onError: error => onError(error.message) })} style={styles.textAction}>
            {setDefault.isPending ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.primary} />}
            <AppText style={styles.actionLabel}>Set default</AppText>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete address for ${address.fullName}`}
          onPress={() => onDelete(address)}
          style={styles.deleteAction}
        >
          <Ionicons name="trash-outline" size={19} color={theme.colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

export default function AddressListScreen() {
  const addresses = useAddresses();
  const remove = useDeleteAddress();
  const [selected, setSelected] = useState<Address | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const items = [...(addresses.data?.items ?? [])].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  const closeActions = () => {
    if (remove.isPending) return;
    setSelected(null);
    remove.reset();
  };

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
          <AppText accessibilityRole="alert" style={styles.error}>{actionError}</AppText>
        )}
        {!addresses.isPending && !addresses.error && items.length === 0 && (
          <Feedback title="No saved addresses" message="Add an address to speed up checkout." />
        )}
        {items.length > 0 && <AppText style={styles.sectionLabel}>Saved addresses ({items.length})</AppText>}
        {items.map(address => (
          <AddressCard
            key={address.id}
            address={address}
            onError={setActionError}
            onDelete={item => {
              setActionError(null);
              remove.reset();
              setSelected(item);
            }}
          />
        ))}
      </ScrollView>
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/addresses/form')} style={styles.addButton}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <AppText style={styles.addLabel}>Add new address</AppText>
        </Pressable>
      </SafeAreaView>
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeActions}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close address actions"
            onPress={closeActions}
            style={styles.backdrop}
          />
          <SafeAreaView edges={['bottom']} style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.handle} />
            <View style={styles.sheetHeading}>
              <View style={styles.sheetHeadingText}>
                <AppText style={styles.sheetTitle}>Delete address?</AppText>
                <AppText style={styles.sheetSubtitle}>{selected?.fullName}</AppText>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={closeActions} style={styles.closeButton}>
                <Ionicons name="close" size={22} color={theme.colors.secondary} />
              </Pressable>
            </View>
              <View style={styles.confirmBody}>
                <AppText style={styles.confirmText}>This address will be removed from your saved addresses.</AppText>
                {!!remove.error && <AppText accessibilityRole="alert" style={styles.error}>{remove.error.message}</AppText>}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: remove.isPending }}
                  disabled={remove.isPending}
                  onPress={() => {
                    if (!selected) return;
                    remove.mutate(selected.id, {
                      onSuccess: () => {
                        setSelected(null);
                        remove.reset();
                      },
                    });
                  }}
                  style={[styles.deleteButton, remove.isPending && styles.disabled]}
                >
                  <AppText style={styles.deleteButtonText}>{remove.isPending ? 'Deleting…' : 'Delete address'}</AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: remove.isPending }}
                  disabled={remove.isPending}
                  onPress={() => {
                    closeActions();
                  }}
                  style={styles.cancelButton}
                >
                  <AppText style={styles.cancelText}>Keep address</AppText>
                </Pressable>
              </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24, gap: 14, flexGrow: 1 },
  sectionLabel: { color: theme.colors.secondary, fontFamily: theme.fonts.medium, fontSize: 13, marginBottom: 2 },
  card: { padding: 16, gap: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, backgroundColor: theme.colors.surface },
  selectedCard: { backgroundColor: '#F6FCFA', borderColor: '#A8D8D0' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  identity: { flex: 1 },
  name: { fontFamily: theme.fonts.semibold, fontSize: 15, lineHeight: 22, color: theme.colors.text },
  typeLabel: { color: theme.colors.secondary, fontSize: 12, lineHeight: 18 },
  defaultBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 16, backgroundColor: theme.colors.primaryLight },
  defaultBadgeText: { color: theme.colors.primaryDark, fontFamily: theme.fonts.medium, fontSize: 11 },
  details: { gap: 3 },
  addressLine: { color: '#4B5563', fontSize: 13, lineHeight: 20 },
  phone: { color: theme.colors.secondary, fontSize: 13, lineHeight: 20, marginTop: 3 },
  actionBar: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  textAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  actionLabel: { color: theme.colors.primary, fontFamily: theme.fonts.medium, fontSize: 13 },
  deleteAction: { marginLeft: 'auto', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  footer: { backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingHorizontal: 20, paddingTop: 12 },
  addButton: { minHeight: 52, borderRadius: 10, backgroundColor: theme.colors.primary, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  addLabel: { color: '#FFFFFF', fontFamily: theme.fonts.semibold, fontSize: 15 },
  error: { color: theme.colors.danger, fontSize: 13 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 10 },
  handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 20 },
  sheetHeading: { flexDirection: 'row', alignItems: 'center', paddingBottom: 16, gap: 10 },
  sheetHeadingText: { flex: 1 },
  sheetTitle: { fontFamily: theme.fonts.semibold, fontSize: 18 },
  sheetSubtitle: { color: theme.colors.secondary, fontSize: 13 },
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  confirmBody: { gap: 14, paddingBottom: 16 },
  confirmText: { color: theme.colors.secondary, fontSize: 14 },
  deleteButton: { minHeight: 50, borderRadius: 10, backgroundColor: theme.colors.danger, alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { color: '#FFFFFF', fontFamily: theme.fonts.semibold },
  cancelButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: theme.colors.primary, fontFamily: theme.fonts.medium },
  disabled: { opacity: 0.5 },
});
