import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiConfig } from '../../api/config';
import {
  checkDelivery,
  fetchProductDetail,
  fetchReviews,
  fetchSpecifications,
  submitRating,
} from '../../api/productDetail';
import { useIdentity } from '../catalog/hooks';

export function useProductDetail(slug: string, variationId?: string) {
  const identity = useIdentity();
  return useQuery({
    queryKey: ['product-detail', identity, slug, variationId ?? ''],
    queryFn: ({ signal }) => fetchProductDetail(slug, variationId, signal),
    enabled: !!apiConfig.baseUrl && !!slug,
  });
}
export function useSpecifications(slug: string) {
  return useQuery({
    queryKey: ['product-specifications', slug],
    queryFn: ({ signal }) => fetchSpecifications(slug, signal),
    enabled: !!apiConfig.baseUrl && !!slug,
  });
}
export function useReviews(productId?: string, variationId?: string) {
  return useQuery({
    queryKey: ['product-reviews', productId ?? '', variationId ?? ''],
    queryFn: ({ signal }) => fetchReviews(productId as string, variationId, signal),
    enabled: !!apiConfig.baseUrl && !!productId,
  });
}
export function useSubmitRating(productId?: string, variationId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { rating: number; description?: string }) =>
      submitRating({ productId: productId as string, variationId, ...params }),
    onSuccess: () => {
      queryClient
        .invalidateQueries({
          queryKey: ['product-reviews', productId ?? '', variationId ?? ''],
        })
        .catch(() => undefined);
    },
  });
}
export function useDeliveryCheck() {
  return useMutation({
    mutationFn: (params: { postcode: string; productId: string; variationId?: string }) =>
      checkDelivery(params),
  });
}
