import React, { useState } from 'react';
import {
  Image as RNImage,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { AppText, Button } from '../../components/ui';
import { BottomSheet, Chip, shop } from '../../components/shop';
import { theme } from '../../theme';
import type { OrderDetail } from '../../api/order';
import type { PickedImage } from '../../api/media';
import type { ReturnType } from '../../api/returns';
import { useSubmitReturn } from './hooks';

const MAX_IMAGES = 5;

export function ReturnRequestSheet({
  order,
  onClose,
}: {
  order: OrderDetail;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [returnType, setReturnType] = useState<ReturnType>('refund');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<PickedImage[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [submissionKey] = useState(() => Crypto.randomUUID());
  const submit = useSubmitReturn(order.id);

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library access is needed to attach images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.8,
    });
    if (result.canceled) {
      return;
    }
    const picked: PickedImage[] = result.assets.map((asset, index) => ({
      uri: asset.uri,
      name: asset.fileName || `return-${Date.now()}-${index}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
    }));
    setImages(current => [...current, ...picked].slice(0, MAX_IMAGES));
  };

  const onSubmit = () => {
    setError('');
    const items = Object.entries(selected)
      .filter(([, quantity]) => quantity > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (!items.length) {
      setError('Select at least one item.');
      return;
    }
    if (!reason) {
      setError('Select a return reason.');
      return;
    }
    if (reason === 'Other' && !comment.trim()) {
      setError('Please describe your reason.');
      return;
    }
    if (!confirmed) {
      setError('Confirm your selected items and quantities before submitting.');
      return;
    }
    if (order.returns.requireImages && !images.length) {
      setError('Supporting images are required.');
      return;
    }
    submit.mutate(
      {
        items,
        returnType,
        reason,
        comment: comment.trim() || undefined,
        images,
        submissionKey,
      },
      { onSuccess: onClose, onError: err => setError(err.message) },
    );
  };

  return (
    <BottomSheet title="Request a return" onClose={onClose}>
      <ScrollView style={styles.shrink} contentContainerStyle={styles.body}>
        <AppText style={shop.muted}>
          Select the items and quantities to return. Requests are reviewed
          before pickup or refund.
        </AppText>

        {order.items.map(item => {
          const max = item.quantity;
          const qty = selected[item.id] ?? 0;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: qty > 0 }}
              onPress={() =>
                setSelected(current => ({
                  ...current,
                  [item.id]: current[item.id] ? 0 : max,
                }))
              }
              style={styles.itemRow}
            >
              <Ionicons
                name={qty > 0 ? 'checkbox' : 'square-outline'}
                size={22}
                color={theme.colors.primary}
              />
              <View style={shop.flex}>
                <AppText numberOfLines={2}>{item.name}</AppText>
                <AppText style={shop.muted}>{max} eligible for return</AppText>
              </View>
              {qty > 0 && max > 1 && (
                <View style={styles.stepper}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Decrease quantity"
                    onPress={() =>
                      setSelected(current => ({
                        ...current,
                        [item.id]: Math.max(1, qty - 1),
                      }))
                    }
                    style={styles.stepperButton}
                  >
                    <Ionicons
                      name="remove"
                      size={16}
                      color={theme.colors.primary}
                    />
                  </Pressable>
                  <AppText style={styles.stepperValue}>{qty}</AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Increase quantity"
                    onPress={() =>
                      setSelected(current => ({
                        ...current,
                        [item.id]: Math.min(max, qty + 1),
                      }))
                    }
                    style={styles.stepperButton}
                  >
                    <Ionicons
                      name="add"
                      size={16}
                      color={theme.colors.primary}
                    />
                  </Pressable>
                </View>
              )}
            </Pressable>
          );
        })}

        <AppText style={styles.label}>Resolution</AppText>
        <View style={styles.wrap}>
          <Chip
            label="Refund"
            selected={returnType === 'refund'}
            onPress={() => setReturnType('refund')}
          />
          <Chip
            label="Replacement"
            selected={returnType === 'replacement'}
            onPress={() => setReturnType('replacement')}
          />
        </View>
        <AppText style={shop.muted}>
          Return window: {order.returns.windowDays} days after delivery. Refunds
          cover accepted merchandise after discounts; shipping and COD fees are
          excluded. Replacements are arranged after quality check, subject to
          stock.
        </AppText>

        <AppText style={styles.label}>Reason</AppText>
        <View style={styles.wrap}>
          {order.returns.reasons.map(option => (
            <Chip
              key={option}
              label={option}
              selected={reason === option}
              onPress={() => setReason(option)}
            />
          ))}
        </View>

        <AppText style={styles.label}>Additional details</AppText>
        <TextInput
          accessibilityLabel="Additional details"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          maxLength={1000}
          placeholder="Tell us more"
          placeholderTextColor={theme.colors.secondary}
          style={styles.textArea}
        />

        <AppText style={styles.label}>
          Supporting images{' '}
          {order.returns.requireImages ? '(required)' : '(optional)'}
        </AppText>
        <View style={styles.images}>
          {images.map((image, index) => (
            <View key={image.uri} style={styles.imageThumbWrap}>
              <RNImage source={{ uri: image.uri }} style={styles.imageThumb} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove image"
                onPress={() =>
                  setImages(current => current.filter((_, i) => i !== index))
                }
                style={styles.imageRemove}
              >
                <Ionicons name="close" size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
          {images.length < MAX_IMAGES && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add photo"
              onPress={pickImages}
              style={styles.imageAdd}
            >
              <Ionicons
                name="camera-outline"
                size={22}
                color={theme.colors.primary}
              />
            </Pressable>
          )}
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmed }}
          onPress={() => setConfirmed(v => !v)}
          style={styles.confirmRow}
        >
          <Ionicons
            name={confirmed ? 'checkbox' : 'square-outline'}
            size={20}
            color={theme.colors.primary}
          />
          <AppText style={[shop.muted, shop.flex]}>
            I confirm the selected items, quantities and return reason.
          </AppText>
        </Pressable>

        {!!error && <AppText style={styles.error}>{error}</AppText>}

        <Button
          label={submit.isPending ? 'Submitting…' : 'Submit request'}
          disabled={submit.isPending}
          onPress={onSubmit}
        />
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  shrink: { flexShrink: 1 },
  body: { paddingBottom: 8, gap: 12 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 18,
    textAlign: 'center',
    fontFamily: theme.fonts.medium,
  },
  label: { fontFamily: theme.fonts.medium, fontSize: 13, marginTop: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  textArea: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.text,
    textAlignVertical: 'top',
  },
  images: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageThumbWrap: { width: 64, height: 64 },
  imageThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#F0F1F3',
  },
  imageRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.danger,
  },
  imageAdd: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  error: { color: theme.colors.danger },
});
