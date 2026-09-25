import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TextInputProps,
  useWindowDimensions,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Control, RegisterOptions, useController, useForm, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { AppText, Feedback } from '../../components/ui';
import { ShopHeader, shop } from '../../components/shop';
import { theme } from '../../theme';
import { fetchCities, fetchStates, lookupPincode, MasterRef, reverseGeocode, ReverseGeocodeResult } from '../../api/address';
import { useAccount } from '../auth/hooks';
import { QueryState } from '../catalog/QueryState';
import { useAddresses, useSaveAddress } from './hooks';
import { useCheckoutAddress } from '../../stores/checkoutAddress';

type FormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  postcode: string;
  addressLine1: string;
  addressLine2: string;
  landMark: string;
  addressType: 'home' | 'office' | 'other';
  isDefault: boolean;
};
type TextFieldName = Exclude<keyof FormValues, 'addressType' | 'isDefault'>;
type Locality = { cityId: number; cityName: string; stateId: number; stateName: string; countryId?: number };
type LookupStatus = 'idle' | 'loading' | 'resolved' | 'not_found' | 'unserviceable' | 'error';

const initialValues: FormValues = {
  firstName: '', lastName: '', phone: '', email: '', postcode: '',
  addressLine1: '', addressLine2: '', landMark: '', addressType: 'home', isDefault: false,
};
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value ?? '';
const mobilePattern = /^[6-9]\d{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({
  control, name, label, placeholder, rules, required = false, prefix, transform, multiline, ...inputProps
}: {
  control: Control<FormValues>;
  name: TextFieldName;
  label: string;
  placeholder: string;
  rules?: RegisterOptions<FormValues, TextFieldName>;
  required?: boolean;
  prefix?: string;
  transform?: (value: string) => string;
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'style' | 'placeholder'>) {
  const { field, fieldState } = useController({ control, name, rules });
  return (
    <View style={styles.field}>
      <AppText style={styles.label}>{label}{required && <AppText style={styles.required}> *</AppText>}</AppText>
      <View style={[styles.inputShell, inputProps.editable === false && styles.inputDisabled, multiline && styles.multilineShell, fieldState.error && styles.invalid]}>
        {!!prefix && <AppText style={styles.prefix}>{prefix}</AppText>}
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          accessibilityHint={fieldState.error?.message}
          ref={field.ref}
          value={field.value ?? ''}
          onChangeText={value => field.onChange(transform ? transform(value) : value)}
          onBlur={field.onBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.secondary}
          multiline={multiline}
          style={[styles.inputText, multiline && styles.multilineText]}
        />
      </View>
      {!!fieldState.error?.message && (
        <AppText accessibilityRole="alert" style={styles.fieldError}>{fieldState.error.message}</AppText>
      )}
    </View>
  );
}

/** Account-owned contact detail (mobile/email): shown read-only, but still
 * validated so an address is never saved without a valid contact number. */
function AccountField({
  control, name, icon, label, emptyText, rules,
}: {
  control: Control<FormValues>;
  name: 'phone' | 'email';
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  emptyText: string;
  rules?: RegisterOptions<FormValues, TextFieldName>;
}) {
  const { field, fieldState } = useController({ control, name, rules });
  const value = String(field.value ?? '');
  return (
    <View style={styles.accountRow} accessible accessibilityLabel={`${label}: ${value || emptyText}`}>
      <View style={styles.accountIcon}>
        <Ionicons name={icon} size={17} color={theme.colors.primary} />
      </View>
      <View style={styles.flex}>
        <AppText style={styles.accountLabel}>{label}</AppText>
        <AppText style={value ? styles.accountValue : styles.accountEmpty}>
          {value ? (name === 'phone' ? `+91 ${value}` : value) : emptyText}
        </AppText>
        {!!fieldState.error?.message && (
          <AppText accessibilityRole="alert" style={styles.fieldError}>{fieldState.error.message}</AppText>
        )}
      </View>
    </View>
  );
}

export default function AddressFormScreen() {
  const route = useLocalSearchParams<{ id?: string; from?: string }>();
  const id = first(route.id) || undefined;
  // Opened from checkout: the saved address becomes the delivery address there.
  const fromCheckout = first(route.from) === 'checkout';
  const selectForCheckout = useCheckoutAddress(s => s.select);
  const { width } = useWindowDimensions();
  const addresses = useAddresses();
  const account = useAccount();
  const existing = id ? addresses.data?.items.find(item => item.id === id) : undefined;
  const save = useSaveAddress();
  const seededId = useRef<string | null>(null);
  const [locality, setLocality] = useState<Locality | null>(null);
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [lookupAttempt, setLookupAttempt] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const locationRequest = useRef(0);
  const detectedLocation = useRef<{ postcode: string; latitude: number; longitude: number; result: ReverseGeocodeResult } | null>(null);
  const [manualState, setManualState] = useState<MasterRef | null>(null);
  const [manualCity, setManualCity] = useState<MasterRef | null>(null);
  const [citySuggestion, setCitySuggestion] = useState<{ postcode: string; name: string } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [picker, setPicker] = useState<'state' | 'city' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const manualLocation = lookupStatus === 'not_found' || lookupStatus === 'error';
  const states = useQuery({
    queryKey: ['address-states', 101],
    queryFn: ({ signal }) => fetchStates(101, signal),
    enabled: manualLocation,
  });
  const cities = useQuery({
    queryKey: ['address-cities', manualState?.id],
    queryFn: ({ signal }) => fetchCities(manualState?.id as number, signal),
    enabled: manualLocation && manualState?.id != null,
  });
  const {
    control, handleSubmit, reset, setError, clearErrors, setFocus, getValues, setValue,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({ defaultValues: initialValues, mode: 'onBlur', reValidateMode: 'onChange' });
  const postcode = useWatch({ control, name: 'postcode' });
  const addressType = useWatch({ control, name: 'addressType' });
  const isDefault = useWatch({ control, name: 'isDefault' });

  useEffect(() => {
    if (!existing || seededId.current === id) return;
    seededId.current = id ?? null;
    reset({
      firstName: existing.firstName,
      lastName: existing.lastName,
      phone: (account.data?.mobile ?? '').replace(/\D/g, "").slice(-10),
      email: account.data?.email ?? '',
      postcode: existing.postcode,
      addressLine1: existing.addressLine1,
      addressLine2: existing.addressLine2,
      landMark: existing.landMark,
      addressType: ['home', 'office', 'other'].includes(existing.addressType)
        ? existing.addressType as FormValues['addressType'] : 'home',
      isDefault: existing.isDefault,
    });
  }, [existing, id, reset, account.data?.mobile, account.data?.email]);

  useEffect(() => {
    if (id || !account.data) return;
    const current = getValues();
    if (!dirtyFields.firstName && !current.firstName && account.data.firstName) setValue('firstName', account.data.firstName);
    if (!dirtyFields.lastName && !current.lastName && account.data.lastName) setValue('lastName', account.data.lastName);
  }, [account.data, dirtyFields, getValues, id, setValue]);

  useEffect(() => {
    setValue('phone', (account.data?.mobile ?? '').replace(/\D/g, '').slice(-10));
    setValue('email', account.data?.email ?? '');
  }, [account.data?.mobile, account.data?.email, existing, setValue]);

  useEffect(() => {
    if (!id && addresses.data?.items.length === 0 && !dirtyFields.isDefault) {
      setValue('isDefault', true);
    }
  }, [addresses.data, dirtyFields.isDefault, id, setValue]);

  useEffect(() => {
    if (detectedLocation.current && detectedLocation.current.postcode !== postcode) {
      detectedLocation.current = null;
    }
    setLocationError('');
    const saved = existing?.postcode === postcode ? existing : undefined;
    const savedState = saved?.state.id != null ? saved.state : null;
    const savedCity = saved?.city.id != null ? saved.city : null;
    if (!/^\d{6}$/.test(postcode)) {
      setLookupStatus('idle');
      setLocality(null);
      setManualState(null);
      setManualCity(null);
      setCitySuggestion(null);
      return;
    }
    const request = new AbortController();
    setLookupStatus('loading');
    setLocality(null);
    setManualState(null);
    setManualCity(null);
    setCitySuggestion(null);
    clearErrors('postcode');
    lookupPincode(postcode, request.signal).then(result => {
      if (request.signal.aborted) return;
      const detected = detectedLocation.current?.postcode === postcode ? detectedLocation.current.result : null;
      const suggestedName = result.suggestedCityName || detected?.suggestedCityName;
      if (suggestedName) setCitySuggestion({ postcode, name: suggestedName });
      if (!result.found) {
        setLookupStatus('not_found');
        setManualState(savedState);
        setManualCity(savedCity);
        clearErrors('postcode');
      } else if (!result.serviceable) {
        setLookupStatus('unserviceable');
        setError('postcode', { type: 'lookup', message: 'Delivery is not available for this pincode.' });
      } else if (result.city?.id != null && result.state?.id != null) {
        setLocality({ cityId: result.city.id, cityName: result.city.name, stateId: result.state.id, stateName: result.state.name, countryId: result.country?.id ?? undefined });
        setLookupStatus('resolved');
        clearErrors('postcode');
      } else {
        const state = result.state ?? detected?.state ?? savedState;
        const city = result.city ?? detected?.city ?? (state?.id === savedState?.id ? savedCity : null);
        if (state?.id != null && city?.id != null) {
          setLocality({ cityId: city.id, cityName: city.name, stateId: state.id, stateName: state.name, countryId: result.country?.id ?? detected?.country?.id ?? undefined });
          setLookupStatus('resolved');
        } else {
          setLookupStatus('not_found');
          setManualState(state);
          setManualCity(city);
        }
        clearErrors('postcode');
      }
    }).catch(() => {
      if (request.signal.aborted) return;
      setLookupStatus('error');
      setManualState(savedState);
      setManualCity(savedCity);
      clearErrors('postcode');
    });
    return () => request.abort();
  }, [postcode, lookupAttempt, clearErrors, setError, existing]);

  useEffect(() => {
    if (!manualLocation || !manualState?.id || manualCity?.id || !cities.data?.length) return;
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const savedName = manualState.id === existing?.state.id && existing?.postcode === postcode ? existing.city.name : '';
    const suggestedName = citySuggestion?.postcode === postcode ? citySuggestion.name : '';
    for (const name of [savedName, suggestedName]) {
      const target = normalize(name);
      if (!target) continue;
      const exact = cities.data.find(city => normalize(city.name) === target);
      const close = cities.data.filter(city => {
        const candidate = normalize(city.name);
        return candidate.length >= 4 && (candidate.includes(target) || target.includes(candidate));
      });
      const match = exact ?? (close.length === 1 ? close[0] : undefined);
      if (match) { setManualCity(match); break; }
    }
  }, [cities.data, citySuggestion, existing, manualCity?.id, manualLocation, manualState?.id, postcode]);

  const useCurrentLocation = async () => {
    if (locating) return;
    const requestId = ++locationRequest.current;
    const startingPostcode = getValues('postcode');
    setLocating(true);
    setLocationMessage('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationMessage('Location permission denied. Enable it in Settings or enter your pincode.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      const result = await reverseGeocode(latitude, longitude);
      if (requestId !== locationRequest.current || getValues('postcode') !== startingPostcode) return;
      if (!/^\d{6}$/.test(result.pincode)) {
        setLocationMessage('We could not detect a pincode here. Enter it manually.');
        return;
      }
      detectedLocation.current = { postcode: result.pincode, latitude, longitude, result };
      if (result.suggestedAddressLine1 && !getValues('addressLine1').trim()) {
        setValue('addressLine1', result.suggestedAddressLine1, { shouldDirty: true, shouldValidate: true });
      }
      if (result.suggestedAddressLine2 && !getValues('addressLine2').trim()) {
        setValue('addressLine2', result.suggestedAddressLine2, { shouldDirty: true });
      }
      setValue('postcode', result.pincode, { shouldDirty: true, shouldValidate: true });
      if (result.pincode === startingPostcode) setLookupAttempt(value => value + 1);
      setLocationMessage('Location detected. Review the address details before saving.');
    } catch {
      if (requestId === locationRequest.current) setLocationMessage('Could not get your location. Try again or enter your pincode.');
    } finally {
      if (requestId === locationRequest.current) setLocating(false);
    }
  };

  const submit = (values: FormValues) => {
    if (manualLocation && (!manualState?.id || !manualCity?.id)) {
      setLocationError(!manualState?.id ? 'Select a state to continue.' : 'Select a city to continue.');
      return;
    }
    const resolved = locality ?? (manualLocation && manualState?.id != null && manualCity?.id != null
      ? { cityId: manualCity.id, cityName: manualCity.name, stateId: manualState.id, stateName: manualState.name, countryId: 101 }
      : null);
    if (!resolved || lookupStatus === 'unserviceable') {
      setError('postcode', { type: 'lookup', message: lookupStatus === 'loading' ? 'Wait for the pincode check to finish.' : 'Enter a serviceable pincode.' });
      setFocus('postcode');
      return;
    }
    if (resolved.cityName.trim().replace(/\s+/g, ' ').length > 40) {
      setLocationError('City must be 40 characters or fewer. Contact support to correct this city listing.');
      setError('postcode', { type: 'validate', message: 'City must be 40 characters or fewer. Contact support to correct this city listing.' });
      return;
    }
    save.mutate({
      id,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone: values.phone,
      email: values.email.trim(),
      postcode: values.postcode,
      addressLine1: values.addressLine1.trim(),
      addressLine2: values.addressLine2.trim(),
      landMark: values.landMark.trim(),
      city: resolved.cityId,
      state: resolved.stateId,
      country: resolved.countryId,
      addressType: values.addressType,
      isDefault: values.isDefault,
      ...(detectedLocation.current?.postcode === values.postcode
        ? { latitude: detectedLocation.current.latitude, longitude: detectedLocation.current.longitude }
        : {}),
    }, {
      onSuccess: savedId => {
        if (fromCheckout && (savedId ?? id)) selectForCheckout((savedId ?? id)!);
        router.back();
      },
    });
  };
  const pickerQuery = picker === 'state' ? states : cities;
  const pickerItems = (pickerQuery.data ?? []).filter(item =>
    item.name.toLowerCase().includes(pickerSearch.trim().toLowerCase()),
  );

  if (id && !existing) {
    return (
      <View style={shop.page}>
        <ShopHeader title="Edit address" back />
        <View style={styles.stateBody}>
          <QueryState pending={addresses.isPending} error={addresses.error} retry={() => addresses.refetch().catch(() => undefined)} />
          {!addresses.isPending && !addresses.error && <Feedback title="Address unavailable" message="This address could not be found." />}
        </View>
      </View>
    );
  }

  const saveLabel = save.isPending
    ? 'Saving…'
    : fromCheckout
    ? 'Save & deliver here'
    : id ? 'Save changes' : 'Save address';

  return (
    <View style={[shop.page, styles.page]}>
      <ShopHeader title={id ? 'Edit address' : 'Add new address'} back />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: locating }} disabled={locating}
            onPress={useCurrentLocation}
            style={({ pressed }) => [styles.locateCard, pressed && styles.pressed]}>
            <View style={styles.locateIcon}>
              {locating
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Ionicons name="navigate" size={18} color="#FFFFFF" />}
            </View>
            <View style={styles.flex}>
              <AppText style={styles.locateTitle}>{locating ? 'Detecting your location…' : 'Use my current location'}</AppText>
              <AppText style={styles.locateText}>Fills in your pincode and street automatically</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
          </Pressable>
          {!!locationMessage && (
            <AppText accessibilityRole="alert" style={[styles.helper, styles.locateMessage]}>{locationMessage}</AppText>
          )}

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
              <AppText style={styles.cardTitle}>Delivery address</AppText>
            </View>
            <Field control={control} name="postcode" label="Pincode" placeholder="6-digit pincode" required keyboardType="number-pad"
              textContentType="postalCode" autoComplete="postal-code" maxLength={6} transform={value => value.replace(/\D/g, '')}
              rules={{ validate: value => /^\d{6}$/.test(value) || 'Enter a 6-digit pincode.' }} />
            {lookupStatus === 'loading' && (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <AppText style={styles.helper}>Checking delivery area…</AppText>
              </View>
            )}
            {lookupStatus === 'resolved' && locality && (
              <View style={styles.locality}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                <View style={styles.flex}>
                  <AppText style={styles.localityTitle}>We deliver here</AppText>
                  <AppText style={styles.helper}>{locality.cityName}, {locality.stateName}</AppText>
                </View>
              </View>
            )}
            {lookupStatus === 'error' && (
              <Pressable accessibilityRole="button" onPress={() => setLookupAttempt(value => value + 1)} style={styles.retryButton}>
                <Ionicons name="refresh" size={15} color={theme.colors.primary} />
                <AppText style={styles.retryText}>Retry pincode check</AppText>
              </Pressable>
            )}
            {manualLocation && (
              <View style={styles.manualLocation}>
                <View style={styles.manualNotice}>
                  <Ionicons name="information-circle-outline" size={19} color={theme.colors.primary} />
                  <AppText style={[styles.helper, styles.manualNoticeText]}>
                    {lookupStatus === 'error'
                      ? 'Pincode lookup is unavailable. Confirm the state and city below.'
                      : 'We could not confirm the city for this pincode. Check the details below.'}
                  </AppText>
                </View>
                <View style={width >= 380 ? styles.nameRow : styles.stack}>
                  <View style={[styles.flex, styles.field]}>
                    <AppText style={styles.label}>State <AppText style={styles.required}>*</AppText></AppText>
                    <Pressable accessibilityRole="button" accessibilityLabel="Select state" onPress={() => { setPickerSearch(''); setPicker('state'); }}
                      style={[styles.locationSelect, !!locationError && !manualState && styles.invalid]}>
                      <AppText numberOfLines={1} style={manualState ? styles.locationValue : styles.locationPlaceholder}>{manualState?.name || 'Select state'}</AppText>
                      <Ionicons name="chevron-down" size={18} color={theme.colors.secondary} />
                    </Pressable>
                  </View>
                  <View style={[styles.flex, styles.field]}>
                    <AppText style={styles.label}>City <AppText style={styles.required}>*</AppText></AppText>
                    <Pressable accessibilityRole="button" accessibilityLabel="Select city" accessibilityState={{ disabled: !manualState }} disabled={!manualState}
                      onPress={() => { setPickerSearch(''); setPicker('city'); }}
                      style={[styles.locationSelect, !manualState && styles.selectDisabled, !!locationError && !!manualState && !manualCity && styles.invalid]}>
                      <AppText numberOfLines={1} style={manualCity ? styles.locationValue : styles.locationPlaceholder}>{manualCity?.name || 'Select city'}</AppText>
                      <Ionicons name="chevron-down" size={18} color={theme.colors.secondary} />
                    </Pressable>
                  </View>
                </View>
                {!!locationError && <AppText accessibilityRole="alert" style={styles.fieldError}>{locationError}</AppText>}
              </View>
            )}
            <Field control={control} name="addressLine1" label="House no., building, street" placeholder="e.g. Flat 4B, Green Tower, MG Road" required
              maxLength={200} autoCapitalize="sentences" multiline textContentType="streetAddressLine1"
              rules={{ validate: value => value.trim().length >= 5 || 'Enter at least 5 characters.' }} />
            <Field control={control} name="addressLine2" label="Area, locality or colony" placeholder="e.g. Salt Lake Sector V"
              maxLength={200} autoCapitalize="sentences" textContentType="streetAddressLine2" />
            <Field control={control} name="landMark" label="Landmark (optional)" placeholder="e.g. Near City Centre mall"
              maxLength={100} autoCapitalize="sentences" />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Ionicons name="person-outline" size={18} color={theme.colors.primary} />
              <AppText style={styles.cardTitle}>Contact details</AppText>
            </View>
            <View style={width >= 380 ? styles.nameRow : styles.stack}>
              <View style={styles.flex}>
                <Field control={control} name="firstName" label="First name" placeholder="First name" required maxLength={100}
                  autoCapitalize="words" textContentType="givenName" autoComplete="name-given"
                  rules={{ validate: value => value.trim().length >= 2 || 'Enter at least 2 characters.' }} />
              </View>
              <View style={styles.flex}>
                <Field control={control} name="lastName" label="Last name" placeholder="Last name" required maxLength={100}
                  autoCapitalize="words" textContentType="familyName" autoComplete="name-family"
                  rules={{ validate: value => value.trim().length >= 2 || 'Enter at least 2 characters.' }} />
              </View>
            </View>
            <View style={styles.accountBox}>
              <AccountField control={control} name="phone" icon="call-outline" label="Mobile number" emptyText="No mobile number on your account"
                rules={{ validate: value => mobilePattern.test(value) || 'Add a valid mobile number in your account settings.' }} />
              <View style={styles.accountDivider} />
              <AccountField control={control} name="email" icon="mail-outline" label="Email (optional)" emptyText="No email on your account"
                rules={{ validate: value => !value.trim() || emailPattern.test(value.trim()) || 'Update your email in your account settings.' }} />
            </View>
            <Pressable accessibilityRole="link" onPress={() => router.push('/account/security')} hitSlop={8} style={styles.accountLink}>
              <AppText style={styles.helper}>From your account · </AppText>
              <AppText style={styles.accountLinkText}>Change</AppText>
            </Pressable>
          </View>

          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Save address as</AppText>
            <View style={styles.typeRow} accessibilityRole="radiogroup">
              {(['home', 'office', 'other'] as const).map(type => {
                const selected = addressType === type;
                return (
                  <Pressable key={type} accessibilityRole="radio" accessibilityState={{ checked: selected }}
                    onPress={() => setValue('addressType', type, { shouldDirty: true })}
                    style={[styles.typeOption, selected && styles.typeSelected]}>
                    <Ionicons name={type === 'home' ? (selected ? 'home' : 'home-outline') : type === 'office' ? (selected ? 'briefcase' : 'briefcase-outline') : (selected ? 'location' : 'location-outline')}
                      size={17} color={selected ? theme.colors.primary : theme.colors.secondary} />
                    <AppText style={[styles.typeText, selected && styles.typeTextSelected]}>{type[0].toUpperCase() + type.slice(1)}</AppText>
                  </Pressable>
                );
              })}
            </View>
            <Pressable accessibilityRole="switch" accessibilityState={{ checked: isDefault }}
              onPress={() => setValue('isDefault', !isDefault, { shouldDirty: true })} style={styles.defaultRow}>
              <View style={styles.flex}>
                <AppText style={styles.defaultTitle}>Make this my default address</AppText>
                <AppText style={styles.helper}>Selected first whenever you check out.</AppText>
              </View>
              <Switch accessibilityLabel="Make this my default address" value={isDefault} onValueChange={value => setValue('isDefault', value, { shouldDirty: true })}
                trackColor={{ false: '#D1D5DB', true: '#9ED9D1' }} thumbColor={isDefault ? theme.colors.primary : '#FFFFFF'} />
            </Pressable>
          </View>

          {(!!save.error || Object.keys(errors).length > 0) && (
            <View accessibilityRole="alert" style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={17} color={theme.colors.danger} />
              <AppText style={styles.errorText}>
                {save.error?.message ?? 'Please fix the highlighted fields before saving.'}
              </AppText>
            </View>
          )}
        </ScrollView>
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: save.isPending, busy: save.isPending }} disabled={save.isPending}
            onPress={handleSubmit(submit, invalidFields => {
              const firstInvalid = Object.keys(invalidFields)[0] as TextFieldName | undefined;
              if (firstInvalid && firstInvalid !== 'phone' && firstInvalid !== 'email') setFocus(firstInvalid);
            })} style={({ pressed }) => [styles.saveButton, save.isPending && styles.saveDisabled, pressed && styles.pressed]}>
            {save.isPending
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Ionicons name={fromCheckout ? 'checkmark-circle' : 'save-outline'} size={18} color="#FFFFFF" />}
            <AppText style={styles.saveText}>{saveLabel}</AppText>
          </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
      <Modal visible={!!picker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPicker(null)}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.pickerPage}>
          <View style={styles.pickerHeader}>
            <View style={styles.flex}>
              <AppText style={styles.pickerTitle}>Select {picker}</AppText>
              <AppText style={styles.pickerSubtitle}>{picker === 'city' ? `Cities in ${manualState?.name || 'your state'}` : 'Choose your delivery state'}</AppText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close selection" onPress={() => setPicker(null)} style={styles.pickerClose}>
              <Ionicons name="close" size={23} color={theme.colors.text} />
            </Pressable>
          </View>
          <View style={styles.pickerSearchWrap}>
            <Ionicons name="search-outline" size={20} color={theme.colors.secondary} />
            <TextInput accessibilityLabel={`Search ${picker ?? 'location'}`} value={pickerSearch} onChangeText={setPickerSearch}
              placeholder={`Search ${picker ?? 'location'}`} placeholderTextColor={theme.colors.secondary} style={styles.pickerSearch}
              autoCorrect={false} autoCapitalize="words" returnKeyType="search" />
            {!!pickerSearch && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setPickerSearch('')} style={styles.clearSearch}>
              <Ionicons name="close-circle" size={20} color={theme.colors.secondary} />
            </Pressable>}
          </View>
          <QueryState pending={pickerQuery.isPending} error={pickerQuery.error} retry={() => pickerQuery.refetch().catch(() => undefined)} />
          {!pickerQuery.isPending && !pickerQuery.error && (
            <View style={styles.pickerResultsHeader}>
              <AppText style={styles.pickerResultsText}>{pickerSearch ? `${pickerItems.length} matches` : `${pickerItems.length} ${picker === 'city' ? 'cities' : 'states'} available`}</AppText>
            </View>
          )}
          <FlatList
            data={pickerItems}
            keyExtractor={item => String(item.id)}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.pickerList}
            ListEmptyComponent={!pickerQuery.isPending && !pickerQuery.error ? <AppText style={styles.emptyPicker}>No {picker}s match your search. Try another name.</AppText> : null}
            renderItem={({ item }) => (
              <Pressable accessibilityRole="button" accessibilityState={{ selected: (picker === 'city' ? manualCity?.id : manualState?.id) === item.id }} onPress={() => {
                if (picker === 'state') {
                  setManualState(item);
                  setManualCity(null);
                  setLocationError('');
                } else {
                  setManualCity(item);
                  setLocationError('');
                  clearErrors('postcode');
                }
                setPicker(null);
              }} style={[styles.pickerItem, (picker === 'city' ? manualCity?.id : manualState?.id) === item.id && styles.pickerItemSelected]}>
                <AppText style={styles.pickerItemText}>{item.name}</AppText>
                {(picker === 'city' ? manualCity?.id : manualState?.id) === item.id && <Ionicons name="checkmark-circle" size={21} color={theme.colors.primary} />}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { backgroundColor: '#F4F6F8' },
  pressed: { opacity: 0.85 },
  stateBody: { padding: 20 },
  body: { padding: 16, gap: 14, paddingBottom: 28 },
  card: {
    gap: 14, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: theme.fonts.semibold, fontSize: 16, color: theme.colors.text },
  locateCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#9FD3CB', backgroundColor: '#F3FBF9',
  },
  locateIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary },
  locateTitle: { fontFamily: theme.fonts.semibold, fontSize: 15, color: theme.colors.primary },
  locateText: { fontSize: 12, color: '#4B5563', marginTop: 1 },
  locateMessage: { marginTop: -6, paddingHorizontal: 4 },
  accountBox: { borderRadius: 12, backgroundColor: '#F9FAFB', paddingHorizontal: 12 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  accountIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F5F3' },
  accountLabel: { fontSize: 11, color: theme.colors.secondary },
  accountValue: { fontFamily: theme.fonts.medium, fontSize: 14, color: theme.colors.text },
  accountEmpty: { fontSize: 13, color: theme.colors.secondary, fontStyle: 'italic' },
  accountDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginLeft: 44 },
  accountLink: { flexDirection: 'row', alignItems: 'center', marginTop: -6 },
  accountLinkText: { color: theme.colors.primary, fontFamily: theme.fonts.semibold, fontSize: 12 },
  errorBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, backgroundColor: '#FEF2F2' },
  errorText: { flex: 1, color: theme.colors.danger, fontSize: 13, lineHeight: 18 },
  nameRow: { flexDirection: 'row', gap: 12 },
  stack: { gap: 14 },
  field: { gap: 6 },
  label: { fontFamily: theme.fonts.medium, fontSize: 14, color: theme.colors.text },
  required: { color: theme.colors.danger },
  inputShell: { minHeight: 52, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  inputDisabled: { backgroundColor: '#F3F4F6', opacity: 0.7 },
  invalid: { borderColor: theme.colors.danger, borderWidth: 1.5 },
  multilineShell: { minHeight: 80, alignItems: 'flex-start' },
  inputText: { flex: 1, minHeight: 50, paddingVertical: 10, fontFamily: theme.fonts.regular, fontSize: 15, color: theme.colors.text },
  multilineText: { minHeight: 78, textAlignVertical: 'top' },
  prefix: { fontFamily: theme.fonts.medium, fontSize: 15, color: theme.colors.text, marginRight: 10 },
  fieldError: { color: theme.colors.danger, fontSize: 12, lineHeight: 18 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeOption: { flex: 1, minHeight: 46, borderRadius: 999, borderWidth: 1.5, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  typeSelected: { backgroundColor: '#F3FBF9', borderColor: theme.colors.primary },
  typeText: { color: theme.colors.secondary, fontFamily: theme.fonts.medium, fontSize: 13 },
  typeTextSelected: { color: theme.colors.primary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  helper: { color: theme.colors.secondary, fontSize: 12, lineHeight: 18 },
  locality: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: '#E9F8F5', marginTop: -4 },
  localityTitle: { color: theme.colors.primary, fontFamily: theme.fonts.medium, fontSize: 13 },
  retryButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  retryText: { color: theme.colors.primary, fontFamily: theme.fonts.medium, fontSize: 13 },
  manualLocation: { gap: 7 },
  manualNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10, backgroundColor: '#F1F8F7', marginBottom: 5 },
  manualNoticeText: { flex: 1 },
  locationSelect: { minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF' },
  locationValue: { flex: 1, color: theme.colors.text, fontSize: 15 },
  locationPlaceholder: { flex: 1, color: theme.colors.secondary, fontSize: 15 },
  selectDisabled: { opacity: 0.5 },
  pickerPage: { flex: 1, backgroundColor: theme.colors.surface },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16, gap: 12 },
  pickerTitle: { fontFamily: theme.fonts.semibold, fontSize: 21, lineHeight: 29, color: theme.colors.text },
  pickerSubtitle: { color: theme.colors.secondary, fontSize: 13, lineHeight: 19 },
  pickerClose: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  pickerSearchWrap: { minHeight: 50, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 14, backgroundColor: '#F9FAFB', flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerSearch: { flex: 1, minHeight: 48, color: theme.colors.text, fontFamily: theme.fonts.regular, fontSize: 15, paddingVertical: 8 },
  clearSearch: { width: 32, height: 44, alignItems: 'center', justifyContent: 'center' },
  pickerResultsHeader: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  pickerResultsText: { fontFamily: theme.fonts.medium, color: theme.colors.secondary, fontSize: 12 },
  pickerList: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 24, flexGrow: 1 },
  pickerItem: { minHeight: 56, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerItemSelected: { backgroundColor: theme.colors.primaryLight },
  pickerItemText: { flex: 1, fontFamily: theme.fonts.regular, color: theme.colors.text, fontSize: 15, lineHeight: 23 },
  emptyPicker: { padding: 24, color: theme.colors.secondary, fontSize: 14, textAlign: 'center' },
  defaultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB' },
  defaultTitle: { fontFamily: theme.fonts.medium, fontSize: 14 },
  footer: {
    backgroundColor: '#FFFFFF', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB', paddingHorizontal: 16, paddingTop: 12,
    shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  saveButton: {
    minHeight: 52, borderRadius: 14, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: '#FFFFFF', fontFamily: theme.fonts.semibold, fontSize: 16 },
});
