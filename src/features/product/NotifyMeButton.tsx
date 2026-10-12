import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import {
  fetchStockAlertStatus,
  subscribeStockAlert,
  unsubscribeStockAlert,
} from '../../api/stockAlerts';
import { Button } from '../../components/ui';
import { useSession } from '../../stores/session';
import { theme } from '../../theme';

// Replaces the disabled "Out of stock" button: signed-in customers can ask
// to be told (email / app notification) when this product or variation is
// available again; tapping again withdraws the request.
export function NotifyMeButton({
  productId,
  variationId,
}: {
  productId: string;
  variationId?: string;
}) {
  const isAuthenticated = useSession(s => s.status === 'authenticated');
  const queryClient = useQueryClient();
  const item = { productId, variationId };
  const queryKey = ['stock-alert', productId, variationId ?? null];
  const status = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchStockAlertStatus(item, signal),
    enabled: isAuthenticated,
  });
  const subscribed = status.data === true;
  const toggle = useMutation({
    mutationFn: () =>
      subscribed ? unsubscribeStockAlert(item) : subscribeStockAlert(item),
    onSuccess: () => {
      queryClient.setQueryData(queryKey, !subscribed);
    },
    onError: (error: unknown) => {
      Alert.alert(
        'Could not update',
        error instanceof Error ? error.message : 'Please try again.',
      );
      // e.g. it came back in stock meanwhile — refresh the product.
      queryClient.invalidateQueries({ queryKey: ['product-detail'] }).catch(() => undefined);
    },
  });

  const onPress = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    toggle.mutate();
  };

  return (
    <Button
      label={
        toggle.isPending
          ? 'Please wait…'
          : subscribed
          ? "You'll be notified · Tap to cancel"
          : 'Notify me when available'
      }
      variant={subscribed ? 'secondary' : 'primary'}
      disabled={toggle.isPending || (isAuthenticated && status.isLoading)}
      icon={
        <Ionicons
          name={subscribed ? 'notifications' : 'notifications-outline'}
          size={18}
          color={subscribed ? theme.colors.primary : '#fff'}
        />
      }
      onPress={onPress}
    />
  );
}
