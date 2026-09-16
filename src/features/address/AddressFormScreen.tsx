import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText, Button } from '../../components/ui';
import { Chip, ShopHeader, shop } from '../../components/shop';
import { theme } from '../../theme';
import { useAddresses, useLookupPincode, useSaveAddress } from './hooks';

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? '';
const mobilePattern = /^[6-9]\d{9}$/;
const addressTypes: { value: string; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'office', label: 'Office' },
];

export default function AddressFormScreen() {
  const route = useLocalSearchParams<{ id?: string }>();
  const id = first(route.id) || undefined;
  const addresses = useAddresses();
  const existing = id ? addresses.data?.items.find(a => a.id === id) : undefined;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landMark, setLandMark] = useState('');
  const [postcode, setPostcode] = useState('');
  const [addressType, setAddressType] = useState('home');
  const [isDefault, setIsDefault] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [locality, setLocality] = useState<{
    cityId: number | null;
    cityName: string;
    stateId: number | null;
    stateName: string;
  }>({ cityId: null, cityName: '', stateId: null, stateName: '' });

  const pincode = useLookupPincode();
  const save = useSaveAddress();

  if (existing && !seeded) {
    setSeeded(true);
    setFirstName(existing.firstName);
    setLastName(existing.lastName);
    setPhone(existing.phone);
    setEmail(existing.email ?? '');
    setAddressLine1(existing.addressLine1);
    setAddressLine2(existing.addressLine2);
    setLandMark(existing.landMark);
    setPostcode(existing.postcode);
    setAddressType(existing.addressType);
    setIsDefault(existing.isDefault);
    setLocality({
      cityId: existing.city.id,
      cityName: existing.city.name,
      stateId: existing.state.id,
      stateName: existing.state.name,
    });
  }

  useEffect(() => {
    if (postcode.length !== 6) {
      return;
    }
    pincode.mutate(postcode, {
      onSuccess: result => {
        if (result.city && result.state) {
          setLocality({
            cityId: result.city.id,
            cityName: result.city.name,
            stateId: result.state.id,
            stateName: result.state.name,
          });
        } else {
          setLocality({ cityId: null, cityName: '', stateId: null, stateName: '' });
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postcode]);

  const canSave =
    firstName.trim().length > 1 &&
    lastName.trim().length > 1 &&
    mobilePattern.test(phone) &&
    addressLine1.trim().length >= 5 &&
    postcode.length === 6 &&
    locality.cityId !== null &&
    locality.stateId !== null;

  return (
    <View style={shop.page}>
      <ShopHeader title={id ? 'Edit address' : 'Add address'} back />
      <View style={styles.body}>
        <View style={shop.row}>
          <TextInput
            accessibilityLabel="First name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor={theme.colors.secondary}
            style={[styles.input, styles.flex]}
          />
          <TextInput
            accessibilityLabel="Last name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            placeholderTextColor={theme.colors.secondary}
            style={[styles.input, styles.flex]}
          />
        </View>
        <View style={shop.row}>
          <AppText style={styles.prefix}>+91</AppText>
          <TextInput
            accessibilityLabel="Mobile number"
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={v => setPhone(v.replace(/\D/g, ''))}
            placeholder="10-digit mobile number"
            placeholderTextColor={theme.colors.secondary}
            style={[styles.input, styles.flex]}
          />
        </View>
        <TextInput
          accessibilityLabel="Email (optional)"
          value={email}
          onChangeText={setEmail}
          placeholder="Email (optional)"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={theme.colors.secondary}
          style={styles.input}
        />
        <TextInput
          accessibilityLabel="Address line 1"
          value={addressLine1}
          onChangeText={setAddressLine1}
          placeholder="House no., building, street"
          placeholderTextColor={theme.colors.secondary}
          style={styles.input}
        />
        <TextInput
          accessibilityLabel="Address line 2"
          value={addressLine2}
          onChangeText={setAddressLine2}
          placeholder="Area, colony (optional)"
          placeholderTextColor={theme.colors.secondary}
          style={styles.input}
        />
        <TextInput
          accessibilityLabel="Landmark"
          value={landMark}
          onChangeText={setLandMark}
          placeholder="Landmark (optional)"
          placeholderTextColor={theme.colors.secondary}
          style={styles.input}
        />
        <TextInput
          accessibilityLabel="Pincode"
          keyboardType="number-pad"
          maxLength={6}
          value={postcode}
          onChangeText={v => setPostcode(v.replace(/\D/g, ''))}
          placeholder="6-digit pincode"
          placeholderTextColor={theme.colors.secondary}
          style={styles.input}
        />
        {pincode.isPending && <AppText style={shop.muted}>Checking pincode…</AppText>}
        {postcode.length === 6 && !pincode.isPending && locality.cityId !== null && (
          <AppText style={shop.muted}>
            {locality.cityName}, {locality.stateName}
          </AppText>
        )}
        {postcode.length === 6 && !pincode.isPending && locality.cityId === null && (
          <AppText style={styles.error}>This pincode isn't serviceable.</AppText>
        )}

        <AppText style={shop.muted}>Address type</AppText>
        <View style={styles.wrap}>
          {addressTypes.map(type => (
            <Chip
              key={type.value}
              label={type.label}
              selected={addressType === type.value}
              onPress={() => setAddressType(type.value)}
            />
          ))}
        </View>
        <Chip
          label={isDefault ? '✓ Default address' : 'Set as default'}
          selected={isDefault}
          onPress={() => setIsDefault(v => !v)}
        />

        {save.isError && <AppText style={styles.error}>{save.error.message}</AppText>}
        <Button
          label={save.isPending ? 'Saving…' : 'Save address'}
          disabled={!canSave || save.isPending}
          onPress={() => {
            save.mutate(
              {
                id,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone,
                email: email.trim() || undefined,
                addressLine1: addressLine1.trim(),
                addressLine2: addressLine2.trim() || undefined,
                landMark: landMark.trim() || undefined,
                city: locality.cityId as number,
                state: locality.stateId as number,
                postcode,
                addressType,
                isDefault,
              },
              { onSuccess: () => router.back() },
            );
          }}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  body: { padding: 16, gap: 12 },
  flex: { flex: 1 },
  prefix: { fontFamily: theme.fonts.medium, fontSize: 16 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
  },
  error: { color: theme.colors.danger },
});
