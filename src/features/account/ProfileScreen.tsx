import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image as RNImage,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Feedback } from '../../components/ui';
import { ShopHeader, SkeletonBlock, shop } from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { useAccount } from '../auth/hooks';
import { useUpdateAvatar, useUpdateProfile } from './hooks';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const GENDER_OPTIONS: { id: string; name: string; icon: IconName }[] = [
  { id: 'male', name: 'Male', icon: 'male' },
  { id: 'female', name: 'Female', icon: 'female' },
  { id: 'other', name: 'Other', icon: 'person-outline' },
];

const GREEN = '#15803D';
const AMBER = '#B45309';

/** "2000-01-31" → local midnight, so the day never shifts across time zones. */
const parseDob = (value: string | null) => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? new Date(+match[1], +match[2] - 1, +match[3]) : null;
};
/** Local calendar date as "YYYY-MM-DD" — not toISOString(), which is UTC and
 * turns an IST midnight into the previous day. */
const formatYmd = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
const displayDob = (date: Date) =>
  date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

function Card({
  title,
  subtitle,
  icon,
  children,
}: React.PropsWithChildren<{
  title: string;
  subtitle?: string;
  icon: IconName;
}>) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.cardIcon}>
          <Ionicons name={icon} size={16} color={theme.colors.primary} />
        </View>
        <View style={styles.flex}>
          <AppText accessibilityRole="header" style={styles.cardTitle}>
            {title}
          </AppText>
          {!!subtitle && (
            <AppText style={styles.cardSubtitle}>{subtitle}</AppText>
          )}
        </View>
      </View>
      {children}
    </View>
  );
}

function NameField({
  label,
  value,
  onChange,
  error,
  required,
  autoComplete,
  textContentType,
  inputRef,
  onSubmitEditing,
  returnKeyType,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  autoComplete: 'name-given' | 'name-family';
  textContentType: 'givenName' | 'familyName';
  inputRef?: React.Ref<TextInput>;
  onSubmitEditing?: () => void;
  returnKeyType: 'next' | 'done';
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, styles.flex]}>
      <AppText style={styles.label}>
        {label}
        {required && <AppText style={styles.required}> *</AppText>}
      </AppText>
      <View
        style={[
          styles.inputShell,
          focused && styles.inputFocused,
          !!error && styles.inputInvalid,
        ]}
      >
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          accessibilityHint={error}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={label}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          maxLength={40}
          style={styles.inputText}
        />
      </View>
      {!!error && (
        <AppText accessibilityRole="alert" style={styles.fieldError}>
          {error}
        </AppText>
      )}
    </View>
  );
}

function StatusBadge({
  verified,
  pending,
}: {
  verified: boolean;
  pending: boolean;
}) {
  const tone = pending ? 'pending' : verified ? 'verified' : 'unverified';
  const config = {
    verified: {
      icon: 'checkmark-circle' as IconName,
      text: 'Verified',
      color: GREEN,
      bg: '#DCFCE7',
    },
    unverified: {
      icon: 'alert-circle' as IconName,
      text: 'Not verified',
      color: theme.colors.danger,
      bg: '#FEE2E2',
    },
    pending: {
      icon: 'time' as IconName,
      text: 'Pending',
      color: AMBER,
      bg: '#FEF3C7',
    },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={12} color={config.color} />
      <AppText style={[styles.badgeText, { color: config.color }]}>
        {config.text}
      </AppText>
    </View>
  );
}

function ContactRow({
  icon,
  label,
  value,
  verified,
  pendingValue,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string | null;
  verified: boolean;
  pendingValue: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? 'not added'}. ${
        pendingValue
          ? `Change to ${pendingValue} awaiting verification`
          : verified
          ? 'Verified'
          : 'Not verified'
      }. Manage in login and security`}
      onPress={onPress}
      style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
    >
      <View style={styles.contactIcon}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={styles.flex}>
        <AppText style={styles.contactLabel}>{label}</AppText>
        {value ? (
          <AppText numberOfLines={1} style={styles.contactValue}>
            {value}
          </AppText>
        ) : (
          <AppText style={styles.contactEmpty}>Not added</AppText>
        )}
        {!!pendingValue && (
          <AppText numberOfLines={1} style={styles.contactPending}>
            Verifying change to {pendingValue}
          </AppText>
        )}
      </View>
      {!!value && <StatusBadge verified={verified} pending={!!pendingValue} />}
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </Pressable>
  );
}

function ProfileSkeleton() {
  return (
    <View style={styles.stack} accessibilityLabel="Loading profile">
      <View style={[styles.card, styles.heroCard]}>
        <SkeletonBlock style={styles.skeletonAvatar} />
        <SkeletonBlock style={styles.skeletonName} />
        <SkeletonBlock style={styles.skeletonLine} />
      </View>
      {[0, 1].map(item => (
        <View key={item} style={styles.card}>
          <SkeletonBlock style={styles.skeletonTitle} />
          <SkeletonBlock style={styles.skeletonInput} />
          <SkeletonBlock style={styles.skeletonInput} />
        </View>
      ))}
    </View>
  );
}

export default function ProfileScreen() {
  const account = useAccount();
  const data = account.data;
  const updateAvatar = useUpdateAvatar();
  const updateProfile = useUpdateProfile();
  const lastNameRef = useRef<TextInput>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) {
      return;
    }
    setFirstName(data.firstName);
    setLastName(data.lastName);
    setDob(parseDob(data.dob));
    setGender(data.gender);
  }, [data]);

  // Hide the "saved" confirmation after a few seconds.
  useEffect(() => {
    if (!saved) {
      return;
    }
    const timer = setTimeout(() => setSaved(false), 3500);
    return () => clearTimeout(timer);
  }, [saved]);

  const dirty =
    !!data &&
    (firstName.trim() !== data.firstName ||
      lastName.trim() !== data.lastName ||
      (dob ? formatYmd(dob) : null) !==
        (parseDob(data.dob) ? formatYmd(parseDob(data.dob)!) : null) ||
      (gender ?? null) !== (data.gender ?? null));

  const firstNameError =
    firstName.trim().length === 0
      ? 'Enter your first name'
      : firstName.trim().length < 2
      ? 'Use at least 2 characters'
      : undefined;
  const showFirstNameError = (touched || dirty) && !!firstNameError;
  const canSave = dirty && !firstNameError && !updateProfile.isPending;

  const completion = useMemo(() => {
    if (!data) {
      return { percent: 0, next: null as string | null };
    }
    const checks: [boolean, string][] = [
      [!!data.firstName && !!data.lastName, 'your full name'],
      [!!data.profileImage, 'a profile photo'],
      [!!data.mobile && data.mobileVerified, 'a verified mobile number'],
      [!!data.email && data.emailVerified, 'a verified email'],
      [!!data.dob, 'your date of birth'],
      [!!data.gender, 'your gender'],
    ];
    const done = checks.filter(([ok]) => ok).length;
    return {
      percent: Math.round((done / checks.length) * 100),
      next: checks.find(([ok]) => !ok)?.[1] ?? null,
    };
  }, [data]);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow photo access in Settings to change your profile photo.');
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
      {
        uri: asset.uri,
        name: asset.fileName || 'avatar.jpg',
        mimeType: asset.mimeType || 'image/jpeg',
      },
      { onError: err => setError(err.message) },
    );
  };

  const submit = () => {
    setTouched(true);
    if (!canSave) {
      return;
    }
    setError('');
    setSaved(false);
    updateProfile.mutate(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob: dob ? formatYmd(dob) : null,
        gender,
      },
      {
        onSuccess: () => setSaved(true),
        onError: err => setError(err.message),
      },
    );
  };

  const displayName =
    [data?.firstName, data?.lastName].filter(Boolean).join(' ') || 'Your name';
  const initials =
    [data?.firstName?.[0], data?.lastName?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase() || 'U';
  const subtitle =
    data?.mobile && data.mobileVerified
      ? `+${data.phoneCode} ${data.mobile}`
      : data?.email ?? '';
  const maxDob = new Date();

  return (
    <View style={[shop.page, styles.page]}>
      <ShopHeader title="Edit profile" back />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <QueryState
            pending={account.isPending}
            error={account.error}
            paused={account.fetchStatus === 'paused'}
            retry={() => {
              account.refetch().catch(() => undefined);
            }}
            skeleton={<ProfileSkeleton />}
          />
          {!account.isPending && !account.isError && !data && (
            <Feedback
              title="Unable to load your details"
              message="Please try again."
            />
          )}
          {data && (
            <>
              <View style={[styles.card, styles.heroCard]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    data.profileImage
                      ? 'Change profile photo'
                      : 'Add profile photo'
                  }
                  accessibilityState={{ busy: updateAvatar.isPending }}
                  disabled={updateAvatar.isPending}
                  onPress={pickAvatar}
                  style={({ pressed }) => [
                    styles.avatarWrap,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.avatar}>
                    {data.profileImage ? (
                      <RNImage
                        source={{ uri: data.profileImage }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <AppText style={styles.avatarInitials}>
                        {initials}
                      </AppText>
                    )}
                    {updateAvatar.isPending && (
                      <View style={styles.avatarBusy}>
                        <ActivityIndicator color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <View style={styles.avatarEdit}>
                    <Ionicons name="camera" size={15} color="#FFFFFF" />
                  </View>
                </Pressable>
                <AppText numberOfLines={1} style={styles.heroName}>
                  {displayName}
                </AppText>
                {!!subtitle && (
                  <AppText numberOfLines={1} style={styles.heroSub}>
                    {subtitle}
                  </AppText>
                )}
                <AppText style={styles.heroHint}>
                  {updateAvatar.isPending
                    ? 'Uploading photo…'
                    : data.profileImage
                    ? 'Tap your photo to change it'
                    : 'Tap to add a profile photo'}
                </AppText>

                <View
                  style={styles.completion}
                  accessible
                  accessibilityLabel={`Profile ${
                    completion.percent
                  } percent complete${
                    completion.next ? `. Add ${completion.next}` : ''
                  }`}
                >
                  <View style={styles.completionHead}>
                    <AppText style={styles.completionTitle}>
                      {completion.percent === 100
                        ? 'Profile complete'
                        : 'Profile strength'}
                    </AppText>
                    <AppText style={styles.completionPercent}>
                      {completion.percent}%
                    </AppText>
                  </View>
                  <View style={styles.track}>
                    <View
                      style={[styles.fill, { width: `${completion.percent}%` }]}
                    />
                  </View>
                  {!!completion.next && (
                    <AppText style={styles.completionHint}>
                      Add {completion.next} to complete your profile
                    </AppText>
                  )}
                </View>
              </View>

              {saved && (
                <View style={styles.successBanner} accessibilityRole="alert">
                  <Ionicons name="checkmark-circle" size={18} color={GREEN} />
                  <AppText style={styles.successText}>
                    Your profile has been updated.
                  </AppText>
                </View>
              )}
              {!!error && (
                <View style={styles.errorBanner} accessibilityRole="alert">
                  <Ionicons
                    name="alert-circle"
                    size={18}
                    color={theme.colors.danger}
                  />
                  <AppText style={styles.errorText}>{error}</AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss"
                    onPress={() => setError('')}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="close"
                      size={16}
                      color={theme.colors.danger}
                    />
                  </Pressable>
                </View>
              )}

              <Card
                title="Personal details"
                subtitle="How we address you on orders and messages"
                icon="person-outline"
              >
                <View style={styles.nameRow}>
                  <NameField
                    label="First name"
                    required
                    value={firstName}
                    onChange={setFirstName}
                    error={showFirstNameError ? firstNameError : undefined}
                    autoComplete="name-given"
                    textContentType="givenName"
                    returnKeyType="next"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                  />
                  <NameField
                    label="Last name"
                    value={lastName}
                    onChange={setLastName}
                    autoComplete="name-family"
                    textContentType="familyName"
                    returnKeyType="done"
                    inputRef={lastNameRef}
                  />
                </View>

                <View style={styles.field}>
                  <AppText style={styles.label}>
                    Date of birth{' '}
                    <AppText style={styles.optional}>(optional)</AppText>
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Date of birth, ${
                      dob ? displayDob(dob) : 'not set'
                    }. Change`}
                    onPress={() => setShowDatePicker(v => !v)}
                    style={({ pressed }) => [
                      styles.inputShell,
                      styles.selectShell,
                      showDatePicker && styles.inputFocused,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={theme.colors.primary}
                    />
                    <AppText
                      style={
                        dob ? styles.selectValue : styles.selectPlaceholder
                      }
                    >
                      {dob ? displayDob(dob) : 'Select your birthday'}
                    </AppText>
                    {dob ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Clear date of birth"
                        onPress={() => {
                          setDob(null);
                          setShowDatePicker(false);
                        }}
                        hitSlop={10}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#9CA3AF"
                        />
                      </Pressable>
                    ) : (
                      <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                    )}
                  </Pressable>
                  {showDatePicker && (
                    <View
                      style={Platform.OS === 'ios' ? styles.iosPicker : null}
                    >
                      <DateTimePicker
                        value={dob ?? new Date(2000, 0, 1)}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        maximumDate={maxDob}
                        onChange={(event, selected) => {
                          if (Platform.OS !== 'ios') {
                            setShowDatePicker(false);
                          }
                          if (event.type === 'set' && selected) {
                            setDob(selected);
                          }
                        }}
                      />
                      {Platform.OS === 'ios' && (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setShowDatePicker(false)}
                          style={styles.iosDone}
                        >
                          <AppText style={styles.iosDoneText}>Done</AppText>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.field}>
                  <AppText style={styles.label}>
                    Gender <AppText style={styles.optional}>(optional)</AppText>
                  </AppText>
                  <View style={styles.genderRow} accessibilityRole="radiogroup">
                    {GENDER_OPTIONS.map(option => {
                      const selected = gender === option.id;
                      return (
                        <Pressable
                          key={option.id}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: selected }}
                          accessibilityHint={
                            selected ? 'Tap again to clear' : undefined
                          }
                          onPress={() =>
                            setGender(current =>
                              current === option.id ? null : option.id,
                            )
                          }
                          style={({ pressed }) => [
                            styles.genderOption,
                            selected && styles.genderSelected,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Ionicons
                            name={option.icon}
                            size={16}
                            color={
                              selected
                                ? theme.colors.primary
                                : theme.colors.secondary
                            }
                          />
                          <AppText
                            style={[
                              styles.genderText,
                              selected && styles.genderTextSelected,
                            ]}
                          >
                            {option.name}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </Card>

              <Card
                title="Contact details"
                subtitle="Used to sign in and for order updates"
                icon="call-outline"
              >
                <View style={styles.contactBox}>
                  <ContactRow
                    icon="phone-portrait-outline"
                    label="Mobile number"
                    value={
                      data.mobile ? `+${data.phoneCode} ${data.mobile}` : null
                    }
                    verified={data.mobileVerified}
                    pendingValue={data.pendingMobile}
                    onPress={() => router.push('/account/security')}
                  />
                  <View style={styles.contactDivider} />
                  <ContactRow
                    icon="mail-outline"
                    label="Email address"
                    value={data.email}
                    verified={data.emailVerified}
                    pendingValue={data.pendingEmail}
                    onPress={() => router.push('/account/security')}
                  />
                </View>
                <View style={styles.note}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={14}
                    color={theme.colors.secondary}
                  />
                  <AppText style={styles.noteText}>
                    Changing your mobile or email needs a one-time code, so it's
                    done in Login & security.
                  </AppText>
                </View>
              </Card>
            </>
          )}
        </ScrollView>
        {data && (
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled: !canSave,
                busy: updateProfile.isPending,
              }}
              disabled={!canSave}
              onPress={submit}
              style={({ pressed }) => [
                styles.saveButton,
                !canSave && styles.saveDisabled,
                pressed && styles.pressed,
              ]}
            >
              {updateProfile.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons
                  name={dirty ? 'checkmark' : 'checkmark-done'}
                  size={18}
                  color="#FFFFFF"
                />
              )}
              <AppText style={styles.saveText}>
                {updateProfile.isPending
                  ? 'Saving…'
                  : dirty
                  ? 'Save changes'
                  : 'No changes to save'}
              </AppText>
            </Pressable>
          </SafeAreaView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  page: { backgroundColor: '#F4F6F8' },
  pressed: { opacity: 0.8 },
  body: { padding: 16, gap: 14, paddingBottom: 28 },
  stack: { gap: 14 },

  card: {
    gap: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5F3',
  },
  cardTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.secondary,
  },

  // Hero
  heroCard: { alignItems: 'center', gap: 4, paddingTop: 22 },
  avatarWrap: { width: 96, height: 96, marginBottom: 10 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 32,
    lineHeight: 40,
  },
  avatarBusy: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  avatarEdit: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    elevation: 5,
  },
  heroName: {
    fontFamily: theme.fonts.semibold,
    fontSize: 19,
    lineHeight: 26,
    color: theme.colors.text,
    maxWidth: '100%',
  },
  heroSub: { fontSize: 13, lineHeight: 19, color: theme.colors.secondary },
  heroHint: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.primary,
    marginTop: 2,
  },
  completion: {
    alignSelf: 'stretch',
    gap: 7,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFB',
  },
  completionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completionTitle: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.text,
  },
  completionPercent: {
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
    color: theme.colors.primary,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
  completionHint: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.secondary,
  },

  // Banners
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successText: { flex: 1, color: GREEN, fontSize: 13, lineHeight: 18 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    flex: 1,
    color: theme.colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },

  // Fields
  nameRow: { flexDirection: 'row', gap: 12 },
  field: { gap: 6 },
  label: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.text,
  },
  required: { color: theme.colors.danger },
  inputShell: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputFocused: { borderColor: theme.colors.primary, borderWidth: 1.5 },
  inputInvalid: { borderColor: theme.colors.danger, borderWidth: 1.5 },
  inputText: {
    flex: 1,
    minHeight: 50,
    paddingVertical: 10,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    color: theme.colors.text,
  },
  fieldError: { color: theme.colors.danger, fontSize: 12, lineHeight: 17 },
  selectShell: { gap: 10 },
  selectValue: { flex: 1, fontSize: 15, color: theme.colors.text },
  selectPlaceholder: { flex: 1, fontSize: 15, color: '#9CA3AF' },
  optional: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.secondary,
  },
  iosPicker: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  iosDone: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iosDoneText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderOption: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  genderSelected: {
    backgroundColor: '#F3FBF9',
    borderColor: theme.colors.primary,
  },
  genderText: {
    color: theme.colors.secondary,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
  },
  genderTextSelected: { color: theme.colors.primary },

  // Contact
  contactBox: {
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5F3',
  },
  contactLabel: { fontSize: 11, lineHeight: 15, color: theme.colors.secondary },
  contactValue: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  contactEmpty: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.secondary,
    fontStyle: 'italic',
  },
  contactPending: { fontSize: 11, lineHeight: 15, color: AMBER, marginTop: 1 },
  contactDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 46,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { fontFamily: theme.fonts.medium, fontSize: 10, lineHeight: 13 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: -4,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.secondary,
  },

  // Skeleton
  skeletonAvatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 8 },
  skeletonName: { width: 150, height: 18 },
  skeletonLine: { width: 110, height: 12, marginTop: 4 },
  skeletonTitle: { width: 140, height: 16 },
  skeletonInput: { width: '100%', height: 52, borderRadius: 12 },

  // Footer
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  saveDisabled: { backgroundColor: '#9CA3AF' },
  saveText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 16,
  },
});
