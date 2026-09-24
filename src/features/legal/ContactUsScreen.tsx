import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText, Button } from '../../components/ui';
import { ShopHeader, shop } from '../../components/shop';
import { theme } from '../../theme';
import { useSiteSettings, useSubmitContactUs } from './hooks';

// Matches the backend's celebrate validation (validations/site/contact_us/submit.js):
// name letters/spaces only, phone 10-15 digits, subject required, email/message optional.
const namePattern = /^[a-zA-Z ]+$/;
const phonePattern = /^[0-9]{10,15}$/;

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <View style={styles.infoIcon}>
          <Ionicons name={icon} size={17} color={theme.colors.primary} />
        </View>
        <AppText style={styles.infoTitle}>{title}</AppText>
      </View>
      {children}
    </View>
  );
}

export default function ContactUsScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = useSubmitContactUs();
  const settings = useSiteSettings();
  const settingValue = (slug: string) =>
    settings.data?.find(s => s.slug === slug)?.value ?? '';
  const address = settingValue('contact_address');
  const contactPhone = settingValue('contact_mobile');
  const contactEmail = settingValue('contact_email');

  const nameValid = namePattern.test(name.trim());
  const phoneValid = phonePattern.test(phone.trim());
  const subjectValid = subject.trim().length > 0;
  const emailValid = !email.trim() || /^\S+@\S+\.\S+$/.test(email.trim());
  const canSubmit = nameValid && phoneValid && subjectValid && emailValid;

  const onSubmit = () => {
    setTouched(true);
    if (!canSubmit || submit.isPending) {
      return;
    }
    submit.mutate(
      {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        subject: subject.trim(),
        message: message.trim() || undefined,
      },
      { onSuccess: () => setSent(true) },
    );
  };

  if (sent) {
    return (
      <View style={[shop.page, styles.center]}>
        <View style={styles.sentIcon}>
          <Ionicons
            name="checkmark-circle"
            size={56}
            color={theme.colors.primary}
          />
        </View>
        <AppText accessibilityRole="header" style={styles.sentTitle}>
          Message sent
        </AppText>
        <AppText style={[shop.muted, styles.sentMessage]}>
          Thanks for reaching out — our support team will get back to you soon.
        </AppText>
      </View>
    );
  }

  return (
    <View style={shop.page}>
      <ShopHeader title="Contact Us" back />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <AppText style={styles.eyebrow}>Get in touch</AppText>
            <AppText style={styles.heroTitle}>We're here to help</AppText>
            <AppText style={styles.lead}>
              Have a question about an order, a product, or your account? Reach
              us below or send a message and we'll get back to you soon.
            </AppText>
          </View>

          <View style={styles.infoRow}>
            <InfoCard icon="business-outline" title="Registered Office">
              {!!address && (
                <AppText style={styles.infoText}>{address}</AppText>
              )}
              {!!contactPhone && (
                <AppText
                  accessibilityRole="link"
                  onPress={() =>
                    Linking.openURL(
                      `tel:${contactPhone.replace(/\s/g, '')}`,
                    ).catch(() => undefined)
                  }
                  style={styles.infoLink}
                >
                  {contactPhone}
                </AppText>
              )}
            </InfoCard>
            <InfoCard icon="help-circle-outline" title="Quick Help">
              <AppText style={styles.infoText}>
                You can ask anything you want to know about our products.
              </AppText>
              {!!contactEmail && (
                <AppText
                  accessibilityRole="link"
                  onPress={() =>
                    Linking.openURL(`mailto:${contactEmail}`).catch(
                      () => undefined,
                    )
                  }
                  style={styles.infoLink}
                >
                  {contactEmail}
                </AppText>
              )}
            </InfoCard>
          </View>

          <View style={styles.formCard}>
            <AppText style={styles.formTitle}>Send us a message</AppText>
            <AppText style={styles.formSubtitle}>
              Fields marked with * are required.
            </AppText>

            <AppText style={styles.label}>Name *</AppText>
            <TextInput
              accessibilityLabel="Name"
              style={[styles.input, touched && !nameValid && styles.invalid]}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={theme.colors.secondary}
              autoCapitalize="words"
            />
            {touched && !nameValid && (
              <AppText style={styles.fieldError}>Enter a valid name.</AppText>
            )}

            <AppText style={styles.label}>Phone number *</AppText>
            <View
              style={[
                styles.phoneRow,
                touched && !phoneValid && styles.invalid,
              ]}
            >
              <Ionicons
                name="call-outline"
                size={17}
                color={theme.colors.secondary}
              />
              <TextInput
                accessibilityLabel="Phone number"
                style={styles.phoneInput}
                value={phone}
                onChangeText={t => setPhone(t.replace(/\D/g, ''))}
                placeholder="Your phone number"
                placeholderTextColor={theme.colors.secondary}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
            {touched && !phoneValid && (
              <AppText style={styles.fieldError}>
                Enter a valid phone number (10–15 digits).
              </AppText>
            )}

            <AppText style={styles.label}>Email</AppText>
            <TextInput
              accessibilityLabel="Email"
              style={[styles.input, touched && !emailValid && styles.invalid]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.secondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {touched && !emailValid && (
              <AppText style={styles.fieldError}>
                Enter a valid email address.
              </AppText>
            )}

            <AppText style={styles.label}>Subject *</AppText>
            <TextInput
              accessibilityLabel="Subject"
              style={[styles.input, touched && !subjectValid && styles.invalid]}
              value={subject}
              onChangeText={setSubject}
              placeholder="What is this about?"
              placeholderTextColor={theme.colors.secondary}
            />
            {touched && !subjectValid && (
              <AppText style={styles.fieldError}>Subject is required.</AppText>
            )}

            <AppText style={styles.label}>Message</AppText>
            <TextInput
              accessibilityLabel="Message"
              style={[styles.input, styles.multiline]}
              value={message}
              onChangeText={setMessage}
              placeholder="Tell us more…"
              placeholderTextColor={theme.colors.secondary}
              multiline
              numberOfLines={4}
            />

            {submit.isError && (
              <AppText style={styles.fieldError}>
                {submit.error.message}
              </AppText>
            )}
            <Button
              label={submit.isPending ? 'Sending…' : 'Send message'}
              disabled={submit.isPending}
              icon={
                <Ionicons
                  name="paper-plane-outline"
                  size={17}
                  color="#FFFFFF"
                />
              }
              onPress={onSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: 16, paddingBottom: 32, gap: 16 },
  hero: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    color: theme.colors.text,
  },
  lead: {
    color: theme.colors.secondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 2,
  },
  infoRow: { gap: 12 },
  infoCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    padding: 16,
    gap: 8,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  infoTitle: { fontFamily: theme.fonts.semibold, fontSize: 14 },
  infoText: { color: theme.colors.secondary, fontSize: 13, lineHeight: 20 },
  infoLink: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
  },
  formCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    padding: 18,
    gap: 8,
  },
  formTitle: { fontFamily: theme.fonts.semibold, fontSize: 17 },
  formSubtitle: {
    color: theme.colors.secondary,
    fontSize: 12,
    marginBottom: 4,
  },
  label: { fontFamily: theme.fonts.medium, fontSize: 13, marginTop: 6 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    padding: 12,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    color: theme.colors.text,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    color: theme.colors.text,
    paddingVertical: 12,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  invalid: { borderColor: theme.colors.danger, borderWidth: 1.5 },
  fieldError: { color: theme.colors.danger, fontSize: 12 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  sentIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
    marginBottom: 6,
  },
  sentTitle: { fontFamily: theme.fonts.bold, fontSize: 20 },
  sentMessage: { textAlign: 'center', maxWidth: 300 },
});
