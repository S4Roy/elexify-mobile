import React, { useEffect, useState } from 'react';
import { Image as RNImage, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { AppText, Button, Feedback } from '../../components/ui';
import { Chip, ShopHeader, shop } from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { useAccount } from '../auth/hooks';
import { useUpdateAvatar, useUpdateProfile } from './hooks';

const GENDER_OPTIONS = [
  { id: 'male', name: 'Male' },
  { id: 'female', name: 'Female' },
  { id: 'other', name: 'Other' },
];

function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <View style={[styles.badge, verified ? styles.badgeVerified : styles.badgeUnverified]}>
      <Ionicons
        name={verified ? 'checkmark-circle' : 'close-circle'}
        size={12}
        color={verified ? theme.colors.primary : theme.colors.danger}
      />
      <AppText style={[styles.badgeText, { color: verified ? theme.colors.primary : theme.colors.danger }]}>
        {verified ? 'Verified' : 'Unverified'}
      </AppText>
    </View>
  );
}

const formatDob = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null;

export default function ProfileScreen() {
  const account = useAccount();
  const data = account.data;
  const updateAvatar = useUpdateAvatar();
  const updateProfile = useUpdateProfile();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!data) {
      return;
    }
    setFirstName(data.firstName);
    setLastName(data.lastName);
    setDob(data.dob ? new Date(data.dob) : null);
    setGender(data.gender);
  }, [data]);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library access is needed to change your photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    const asset = result.assets[0];
    setError('');
    updateAvatar.mutate(
      { uri: asset.uri, name: asset.fileName || 'avatar.jpg', mimeType: asset.mimeType || 'image/jpeg' },
      { onError: err => setError(err.message) },
    );
  };

  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'U';
  const canSubmit = firstName.trim().length >= 2;

  const submit = () => {
    setError('');
    setSuccess(false);
    updateProfile.mutate(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob: dob ? dob.toISOString().slice(0, 10) : null,
        gender,
      },
      {
        onSuccess: () => setSuccess(true),
        onError: err => setError(err.message),
      },
    );
  };

  return (
    <View style={shop.page}>
      <ShopHeader title="Profile" back />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <QueryState
          pending={account.isPending}
          error={account.error}
          paused={account.fetchStatus === 'paused'}
          retry={() => {
            account.refetch().catch(() => undefined);
          }}
        />
        {!account.isPending && !account.isError && !data && (
          <Feedback title="Unable to load your details" message="Please try again." />
        )}
        {data && (
          <>
            <View style={styles.avatarRow}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  {data.profileImage ? (
                    <RNImage source={{ uri: data.profileImage }} style={styles.avatarImage} />
                  ) : (
                    <AppText style={styles.avatarInitials}>{initials}</AppText>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Change photo"
                  disabled={updateAvatar.isPending}
                  onPress={pickAvatar}
                  style={styles.avatarEdit}
                >
                  <Ionicons name="camera" size={13} color="#FFFFFF" />
                </Pressable>
              </View>
              <AppText style={shop.muted}>
                {updateAvatar.isPending ? 'Uploading…' : 'Tap the camera icon to change your photo'}
              </AppText>
            </View>

            <View style={styles.contactGrid}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/account/security')}
                style={styles.contactCard}
              >
                <AppText style={shop.muted}>Email</AppText>
                <View style={shop.between}>
                  <AppText numberOfLines={1} style={styles.contactValue}>
                    {data.email || '—'}
                  </AppText>
                  <VerifiedBadge verified={data.emailVerified} />
                </View>
                <AppText style={shop.link}>Change email</AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/account/security')}
                style={styles.contactCard}
              >
                <AppText style={shop.muted}>Mobile</AppText>
                <View style={shop.between}>
                  <AppText numberOfLines={1} style={styles.contactValue}>
                    {data.mobile ? `+${data.phoneCode} ${data.mobile}` : '—'}
                  </AppText>
                  <VerifiedBadge verified={data.mobileVerified} />
                </View>
                <AppText style={shop.link}>Change mobile</AppText>
              </Pressable>
            </View>

            <AppText style={styles.label}>First name</AppText>
            <TextInput
              accessibilityLabel="First name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={theme.colors.secondary}
              style={styles.input}
            />
            <AppText style={styles.label}>Last name</AppText>
            <TextInput
              accessibilityLabel="Last name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={theme.colors.secondary}
              style={styles.input}
            />
            <AppText style={styles.label}>Date of birth</AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowDatePicker(true)}
              style={styles.input}
            >
              <AppText style={dob ? undefined : shop.muted}>{formatDob(dob?.toISOString() ?? null) ?? 'Select date'}</AppText>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={dob ?? new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(event, selected) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (event.type === 'set' && selected) {
                    setDob(selected);
                  }
                }}
              />
            )}
            <AppText style={styles.label}>Gender</AppText>
            <View style={styles.wrap}>
              {GENDER_OPTIONS.map(option => (
                <Chip
                  key={option.id}
                  label={option.name}
                  selected={gender === option.id}
                  onPress={() => setGender(current => (current === option.id ? null : option.id))}
                />
              ))}
            </View>

            {!!error && <AppText style={styles.error}>{error}</AppText>}
            {success && <AppText style={styles.success}>Profile updated successfully.</AppText>}
            <Button
              label={updateProfile.isPending ? 'Saving…' : 'Save changes'}
              disabled={!canSubmit || updateProfile.isPending}
              onPress={submit}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 10 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  avatarWrap: { width: 76, height: 76 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 76, height: 76 },
  avatarInitials: { color: theme.colors.primary, fontFamily: theme.fonts.semibold, fontSize: 26 },
  avatarEdit: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  contactGrid: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  contactCard: {
    flex: 1,
    gap: 6,
    padding: 12,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  contactValue: { flex: 1, fontFamily: theme.fonts.medium, fontSize: 13 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeVerified: { backgroundColor: theme.colors.primaryLight },
  badgeUnverified: { backgroundColor: '#FEF3E7' },
  badgeText: { fontFamily: theme.fonts.medium, fontSize: 10 },
  label: { fontFamily: theme.fonts.medium, fontSize: 13, marginTop: 4 },
  input: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    color: theme.colors.text,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  error: { color: theme.colors.danger, fontSize: 13 },
  success: { color: theme.colors.primary, fontSize: 13 },
});
