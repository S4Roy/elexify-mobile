import { useQuery } from '@tanstack/react-query';
import { apiConfig } from '../../api/config';
import { compareProducts } from '../../api/compare';

export function useCompareProducts(ids: string[]) {
  return useQuery({
    queryKey: ['compare', ids.join(',')],
    queryFn: ({ signal }) => compareProducts(ids, signal),
    enabled: !!apiConfig.baseUrl && ids.length > 0,
  });
}
