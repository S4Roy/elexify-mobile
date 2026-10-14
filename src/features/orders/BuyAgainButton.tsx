import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppText, Button } from '../../components/ui';
import { BottomSheet, money, shop } from '../../components/shop';
import {
  addBuyAgain,
  buyAgainUnitPrice,
  fetchBuyAgain,
  type BuyAgainResult,
} from '../../api/buyAgain';
import { useIdentity } from '../catalog/hooks';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';

function BuyAgainSheet({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const identity = useIdentity();
  const queryClient = useQueryClient();
  const preview = useQuery({
    queryKey: ['buy-again', identity, orderId],
    queryFn: ({ signal }) => fetchBuyAgain(orderId, signal),
    refetchOnMount: 'always',
  });
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [results, setResults] = useState<BuyAgainResult[]>([]);
  const [error, setError] = useState('');
  const initialized = useRef(false);
  const inFlight = useRef(false);
  useEffect(() => {
    if (!preview.data || preview.isFetching || initialized.current) return;
    initialized.current = true;
    setSelected(
      Object.fromEntries(preview.data.map(item => [item.id, item.eligible])),
    );
    setQuantities(
      Object.fromEntries(
        preview.data.map(item => [
          item.id,
          String(
            Math.max(1, Math.min(item.originalQuantity, item.maxQuantity)),
          ),
        ]),
      ),
    );
  }, [preview.data, preview.isFetching]);
  const submit = useMutation({
    mutationFn: (items: { id: string; quantity: number }[]) =>
      addBuyAgain(orderId, items),
    retry: false,
    onSettled: () => {
      queryClient
        .invalidateQueries({ queryKey: ['cart', identity] })
        .catch(() => undefined);
    },
  });
  const chosen = (preview.data ?? []).filter(
    item =>
      item.eligible &&
      selected[item.id] &&
      !results.some(result => result.id === item.id && result.added),
  );
  const valid =
    chosen.length > 0 &&
    chosen.length <= 100 &&
    chosen.every(item => {
      const quantity = Number(quantities[item.id]);
      return (
        Number.isInteger(quantity) &&
        quantity >= 1 &&
        quantity <= item.maxQuantity
      );
    });
  const add = async () => {
    if (!valid || inFlight.current) return;
    inFlight.current = true;
    setError('');
    try {
      const incoming = await submit.mutateAsync(
        chosen.map(item => ({
          id: item.id,
          quantity: Number(quantities[item.id]),
        })),
      );
      setResults(previous => [
        ...previous.filter(
          result => !incoming.some(next => next.id === result.id),
        ),
        ...incoming,
      ]);
      if (!incoming.length)
        setError('Could not confirm the additions. Please review your cart.');
    } catch {
      setError(
        'Could not confirm the additions. Review your cart before trying again.',
      );
    } finally {
      inFlight.current = false;
    }
  };
  const reviewCart = () => {
    onClose();
    router.push('/cart');
  };
  return (
    <BottomSheet
      title="Buy again"
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          {(results.some(result => result.added) || !!error) && (
            <Button
              label="Review cart"
              variant="secondary"
              onPress={reviewCart}
            />
          )}
          <Button
            label={submit.isPending ? 'Adding…' : 'Add selected to cart'}
            onPress={add}
            disabled={preview.isFetching || submit.isPending || !valid}
          />
        </View>
      }
    >
      <ScrollView
        style={styles.shrink}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <AppText style={shop.muted}>
          Choose items at today’s prices. Existing cart quantities stay in
          place. Delivery, GST and payment options are confirmed at checkout.
        </AppText>
        <QueryState
          pending={preview.isPending}
          error={preview.error}
          retry={() => {
            preview.refetch().catch(() => undefined);
          }}
        />
        {(preview.data ?? []).map(item => {
          const result = results.find(entry => entry.id === item.id);
          const disabled =
            !item.eligible || submit.isPending || result?.added === true;
          const quantity = Number(quantities[item.id]);
          return (
            <View key={item.id} style={styles.item}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={`Select ${item.name}`}
                accessibilityState={{ checked: !!selected[item.id], disabled }}
                disabled={disabled}
                onPress={() =>
                  setSelected(previous => ({
                    ...previous,
                    [item.id]: !previous[item.id],
                  }))
                }
                style={styles.row}
              >
                <Ionicons
                  name={selected[item.id] ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={disabled ? '#9CA3AF' : theme.colors.primary}
                />
                <View style={shop.flex}>
                  <AppText style={styles.name}>{item.name}</AppText>
                  {!!item.variationName && (
                    <AppText style={shop.muted}>{item.variationName}</AppText>
                  )}
                </View>
              </Pressable>
              <AppText style={shop.muted}>
                Previously ordered: {item.originalQuantity}
                {item.existingQuantity
                  ? ` · Already in cart: ${item.existingQuantity}`
                  : ''}
              </AppText>
              {item.eligible ? (
                <>
                  <View style={styles.row}>
                    <AppText style={shop.flex}>Add quantity</AppText>
                    <TextInput
                      accessibilityLabel={`Quantity to add for ${item.name}`}
                      keyboardType="number-pad"
                      editable={!disabled}
                      value={quantities[item.id] ?? ''}
                      onChangeText={value =>
                        setQuantities(previous => ({
                          ...previous,
                          [item.id]: value.replace(/[^0-9]/g, ''),
                        }))
                      }
                      style={styles.quantity}
                    />
                    <AppText>
                      {money(
                        result?.added
                          ? result.unitPrice
                          : buyAgainUnitPrice(item, quantity || 1),
                      )}{' '}
                      / unit
                    </AppText>
                  </View>
                  <AppText style={shop.muted}>
                    Up to {item.maxQuantity} additional units. Discounts include
                    units already in your cart.
                  </AppText>
                </>
              ) : (
                <AppText style={shop.muted}>{item.reason}</AppText>
              )}
              {result && (
                <AppText
                  accessibilityLiveRegion="polite"
                  style={{
                    color: result.added ? '#15803D' : theme.colors.danger,
                  }}
                >
                  {result.added
                    ? `Added ${result.quantity} unit(s) to your cart.`
                    : result.reason}
                </AppText>
              )}
            </View>
          );
        })}
        {!preview.isPending && !preview.error && !preview.data?.length && (
          <AppText>No items available to reorder.</AppText>
        )}
        {chosen.length > 100 && (
          <AppText style={styles.error}>
            Select up to 100 items at a time.
          </AppText>
        )}
        {!!error && (
          <AppText accessibilityRole="alert" style={styles.error}>
            {error}
          </AppText>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

export function BuyAgainButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        label="Buy again"
        variant="secondary"
        onPress={() => setOpen(true)}
        icon={
          <Ionicons
            name="cart-outline"
            size={17}
            color={theme.colors.primary}
          />
        }
      />
      {open && (
        <BuyAgainSheet orderId={orderId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
const styles = StyleSheet.create({
  body: { padding: 16, gap: 14 },
  shrink: { flexShrink: 1 },
  item: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    gap: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontWeight: '600' },
  quantity: {
    width: 58,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 8,
    color: '#111827',
  },
  footer: { paddingHorizontal: 16, gap: 10 },
  error: { color: theme.colors.danger },
});
