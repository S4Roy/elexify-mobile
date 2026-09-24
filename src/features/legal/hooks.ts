import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchSiteSettings, submitContactUs } from '../../api/cms';

export function useSubmitContactUs() {
  return useMutation({ mutationFn: submitContactUs });
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: ({ signal }) => fetchSiteSettings(signal),
    staleTime: 5 * 60 * 1000,
  });
}
