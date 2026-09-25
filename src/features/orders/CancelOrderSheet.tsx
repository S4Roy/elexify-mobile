import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../components/ui';
import { BottomSheet, shop } from '../../components/shop';
import { theme } from '../../theme';
import {
  CANCELLATION_REASONS,
  type CancelResult,
  type OrderDetail,
} from '../../api/order';
import { cancellationImpact } from './cancellation';
import { useCancelOrder } from './hooks';

const OTHER = 'Other';

// App counterpart of elexify.online's CancelOrderModal: explain the
// consequences, require a reason (and a note for "Other"), then let the
// customer choose between keeping the order and cancelling it.
export function CancelOrderSheet({
  order,
  onClose,
  onCancelled,
}: {
  order: OrderDetail;
  onClose: () => void;
  onCancelled: (result: CancelResult) => void;
}) {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const cancel = useCancelOrder(order.id);
  const busy = cancel.isPending;

  const confirm = (close: () => void) => {
    if (!reason) {
      setError('Please choose a reason for cancelling.');
      return;
    }
    if (reason === OTHER && !comment.trim()) {
      setError('Please tell us why you are cancelling.');
      return;
    }
    setError('');
    cancel.mutate(
      { reason, comment: comment.trim() || undefined },
      {
        onSuccess: result => {
          onCancelled(result);
          close();
        },
        onError: err => setError(err.message),
      },
    );
  };

  return (
    <BottomSheet
      title="Cancel this order?"
      onClose={onClose}
      // eslint-disable-next-line react/no-unstable-nested-components -- render prop invoked inline, never mounted as a JSX component type
      footer={close => (
        <>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={close}
            style={({ pressed }) => [
              styles.action,
              styles.keep,
              pressed && styles.pressed,
            ]}
          >
            <AppText style={styles.keepText}>Keep order</AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy, busy }}
            disabled={busy}
            onPress={() => confirm(close)}
            style={({ pressed }) => [
              styles.action,
              styles.destroy,
              (pressed || busy) && styles.pressed,
            ]}
          >
            <AppText style={styles.destroyText}>
              {busy ? 'Cancelling…' : 'Cancel order'}
            </AppText>
          </Pressable>
        </>
      )}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.shrink}
      >
        <ScrollView
          style={styles.shrink}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <AppText style={shop.muted}>
            Order #{order.orderNumber} will be cancelled and its items released
            back to stock.
          </AppText>
          <View style={styles.impact}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={theme.colors.primary}
            />
            <AppText style={styles.impactText}>
              {cancellationImpact(order)}
            </AppText>
          </View>

          <AppText style={styles.label}>Reason for cancellation</AppText>
          <View accessibilityRole="radiogroup" style={styles.reasons}>
            {CANCELLATION_REASONS.map(option => {
              const selected = reason === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: busy }}
                  disabled={busy}
                  onPress={() => {
                    setReason(option);
                    setError('');
                  }}
                  style={[styles.reason, selected && styles.reasonSelected]}
                >
                  <View style={[styles.radio, selected && styles.radioOn]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                  <AppText
                    style={[styles.reasonText, selected && styles.reasonTextOn]}
                  >
                    {option}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {reason === OTHER && (
            <TextInput
              accessibilityLabel="Tell us the reason"
              value={comment}
              onChangeText={setComment}
              editable={!busy}
              placeholder="Tell us what went wrong"
              placeholderTextColor={theme.colors.secondary}
              multiline
              maxLength={500}
              style={styles.input}
            />
          )}

          {!!error && (
            <View accessibilityRole="alert" style={styles.error}>
              <Ionicons
                name="alert-circle"
                size={16}
                color={theme.colors.danger}
              />
              <AppText style={styles.errorText}>{error}</AppText>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  shrink: { flexShrink: 1 },
  body: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  impact: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 12,
    padding: 12,
  },
  impactText: { flex: 1, fontSize: 13, lineHeight: 19, color: '#1F4F4A' },
  label: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 4,
  },
  reasons: { gap: 8 },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reasonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0FAF8',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C4C9D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: theme.colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  reasonText: { flex: 1, fontSize: 14, color: theme.colors.text },
  reasonTextOn: { fontFamily: theme.fonts.medium },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
    textAlignVertical: 'top',
  },
  error: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
  },
  errorText: { flex: 1, color: theme.colors.danger, fontSize: 13 },
  action: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keep: { backgroundColor: theme.colors.primary },
  keepText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
  destroy: { borderWidth: 1.5, borderColor: '#FCA5A5' },
  destroyText: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
  pressed: { opacity: 0.6 },
});
