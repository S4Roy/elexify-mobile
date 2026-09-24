import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiConfig } from '../../api/config';
import { cancelOrder, fetchOrderDetail, fetchOrders } from '../../api/order';
import { createReturn, type ReturnType } from '../../api/returns';
import { uploadMedia, type PickedImage } from '../../api/media';
import { useSession } from '../../stores/session';
import { useIdentity } from '../catalog/hooks';
import { downloadAndShareInvoice } from './invoice';

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

export function useDownloadInvoice(orderNumber: string) {
  return useMutation({
    mutationFn: (orderId: string) => downloadAndShareInvoice(orderId, orderNumber),
  });
}

export function useSubmitReturn(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      items: { orderItemId: string; quantity: number }[];
      returnType: ReturnType;
      reason: string;
      comment?: string;
      images: PickedImage[];
      submissionKey: string;
    }) => {
      const uploaded = params.images.length ? await uploadMedia(params.images, 'return') : [];
      await createReturn({
        orderId,
        items: params.items,
        returnType: params.returnType,
        reason: params.reason,
        comment: params.comment,
        evidence: uploaded.map(m => m.id),
        submissionKey: params.submissionKey,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] }).catch(() => undefined);
    },
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
