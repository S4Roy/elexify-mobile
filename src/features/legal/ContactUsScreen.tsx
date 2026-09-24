import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText, Button } from '../../components/ui';
import { ShopHeader, shop } from '../../components/shop';
import { theme } from '../../theme';
import { useSubmitContactUs } from './hooks';

// Matches the backend's celebrate validation (validations/site/contact_us/submit.js):
// name letters/spaces only, phone 10-15 digits, subject required, email/message optional.
const namePattern = /^[a-zA-Z ]+$/;
const phonePattern = /^[0-9]{10,15}$/;

export default function ContactUsScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = useSubmitContactUs();

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
      { name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, subject: subject.trim(), message: message.trim() || undefined },
      { onSuccess: () => setSent(true) },
    );
  };

  if (sent) {
    return (
      <View style={[shop.page, styles.center]}>
        <Ionicons name="checkmark-circle" size={64} color={theme.colors.primary} />
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
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <AppText style={shop.muted}>
            Have a question about an order or a product? Send us a message and we'll respond as soon as we can.
          </AppText>

          <AppText style={styles.label}>Name</AppText>
          <TextInput
            accessibilityLabel="Name"
            style={[styles.input, touched && !nameValid && styles.invalid]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
          />
          {touched && !nameValid && <AppText style={styles.fieldError}>Enter a valid name.</AppText>}

          <AppText style={styles.label}>Phone</AppText>
          <TextInput
            accessibilityLabel="Phone number"
            style={[styles.input, touched && !phoneValid && styles.invalid]}
            value={phone}
            onChangeText={t => setPhone(t.replace(/[^0-9]/g, ''))}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={15}
          />
          {touched && !phoneValid && <AppText style={styles.fieldError}>Enter a valid phone number.</AppText>}

          <AppText style={styles.label}>Email (optional)</AppText>
          <TextInput
            accessibilityLabel="Email"
            style={[styles.input, touched && !emailValid && styles.invalid]}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {touched && !emailValid && <AppText style={styles.fieldError}>Enter a valid email address.</AppText>}

          <AppText style={styles.label}>Subject</AppText>
          <TextInput
            accessibilityLabel="Subject"
            style={[styles.input, touched && !subjectValid && styles.invalid]}
            value={subject}
            onChangeText={setSubject}
            placeholder="What is this about?"
          />
          {touched && !subjectValid && <AppText style={styles.fieldError}>Subject is required.</AppText>}

          <AppText style={styles.label}>Message (optional)</AppText>
          <TextInput
            accessibilityLabel="Message"
            style={[styles.input, styles.multiline]}
            value={message}
            onChangeText={setMessage}
            placeholder="Tell us more…"
            multiline
            numberOfLines={4}
          />

          {submit.isError && <AppText style={styles.fieldError}>{submit.error.message}</AppText>}
          <Button label={submit.isPending ? 'Sending…' : 'Send message'} disabled={submit.isPending} onPress={onSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: 16, gap: 8, paddingBottom: 32 },
  label: { fontFamily: theme.fonts.medium, fontSize: 13, marginTop: 6 },
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
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  invalid: { borderColor: theme.colors.danger, borderWidth: 1.5 },
  fieldError: { color: theme.colors.danger, fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  sentTitle: { fontFamily: theme.fonts.bold, fontSize: 20 },
  sentMessage: { textAlign: 'center', maxWidth: 300 },
});
