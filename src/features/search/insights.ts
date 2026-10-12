import { useEffect, useRef } from 'react';
import * as Crypto from 'expo-crypto';
import axios from 'axios';
import { apiConfig } from '../../api/config';
import { createSearchVisit, validEventId, SearchPayload } from './searchVisit';
const enabled = process.env.EXPO_PUBLIC_SEARCH_INSIGHTS_ENABLED !== 'false';
// Independent of session interceptors and UI error handling.
const analytics = axios.create({
  baseURL: apiConfig.baseUrl ?? undefined,
  timeout: 5000, withCredentials: false,
  headers: { 'x-api-key': apiConfig.publicKey },
});
export function sendSearchEvent(payload: SearchPayload) {
  if (!enabled || !apiConfig.baseUrl) return;
  try {
    void analytics.post('site/inventory/product/search-events', payload)
      .catch((error) => {
        const status = error?.response?.status;
        if (!status || status >= 500) return analytics.post('site/inventory/product/search-events', payload);
      })
      .catch(() => undefined);
  } catch { /* Tracking must never affect product results. */ }
}
export function submitSearch(query: string): string | undefined {
  try {
    if (!enabled || !query.trim()) return;
    const id = Crypto.randomUUID();
    sendSearchEvent({ event_id: id, query, platform: 'mobile', action: 'submitted', source: 'submitted' });
    return id;
  } catch { return; }
}
export function selectSearchSuggestion(query: string, productId: string) {
  try {
    if (!enabled || !query.trim() || !productId) return;
    sendSearchEvent({ event_id: Crypto.randomUUID(), query, platform: 'mobile', action: 'suggestion_selected', source: 'suggestion', product_id: productId });
  } catch { /* Tracking must never prevent selecting a product. */ }
}
export function useSearchVisit(query: string, routeId: string | undefined, params: Record<string, unknown>) {
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const current = useRef<{ key: string; visit: ReturnType<typeof createSearchVisit> } | null>(null);
  const key = JSON.stringify([query, routeId]);
  if (!current.current || current.current.key !== key) {
    try {
      const id = validEventId(routeId) ? routeId : Crypto.randomUUID();
      current.current = { key, visit: createSearchVisit(query, id, 'mobile', validEventId(routeId) ? 'submitted' : 'results_url', params, sendSearchEvent) };
    } catch { current.current = null; }
  }
  const snapshot = current.current;
  return (count: unknown, responseParams: Record<string, unknown>) => {
    if (mounted.current && snapshot && snapshot === current.current) snapshot.visit.results(count, responseParams);
  };
}
