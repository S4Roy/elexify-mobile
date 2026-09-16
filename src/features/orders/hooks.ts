import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiConfig } from '../../api/config';
import { cancelOrder, fetchOrderDetail, fetchOrders } from '../../api/order';
import { useSession } from '../../stores/session';
import { useIdentity } from '../catalog/hooks';

export function useOrders() {
  const identity = useIdentity();
  const isAuthenticated = useSession(s => s.status === 'authenticated');
  return useInfiniteQuery({
    queryKey: ['orders', identity],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchOrders(pageParam, signal),
    getNextPageParam: page => page.nextPage,
    enabled: !!apiConfig.baseUrl && isAuthenticated,
  });
}

export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: ['order-detail', id],
    queryFn: ({ signal }) => fetchOrderDetail(id, signal),
    enabled: !!apiConfig.baseUrl && !!id,
  });
}

export function useCancelOrder(id: string) {
  const identity = useIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { reason: string; comment?: string }) =>
      cancelOrder({ orderId: id, ...params }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-detail', id] }).catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: ['orders', identity] }).catch(() => undefined);
    },
  });
}
