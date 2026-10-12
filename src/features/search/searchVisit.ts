export type SearchPayload = {
  event_id: string;
  query: string;
  platform: 'web' | 'mobile';
  action: 'submitted' | 'results_viewed' | 'suggestion_selected';
  source: 'submitted' | 'results_url' | 'suggestion';
  result_count?: number;
  filters?: Record<string, unknown>;
  product_id?: string;
};
export const validEventId = (id: string | undefined): id is string =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
export function filterContext(params: Record<string, unknown>) {
  const excluded = ['page', 'limit', 'search_key', 'sort_by', 'sort_order', 'currency'];
  return Object.fromEntries(Object.entries(params).filter(([key, value]) =>
    !excluded.includes(key) && value !== undefined && value !== null && value !== ''
  ).sort(([a], [b]) => a.localeCompare(b)));
}
// One visit accepts the initial filter context once. Retries, sort and pagination add no searches.
export function createSearchVisit(
  query: string, id: string, platform: 'web' | 'mobile', source: 'submitted' | 'results_url',
  initialParams: Record<string, unknown>, send: (payload: SearchPayload) => void,
) {
  const filters = filterContext(initialParams);
  let recorded = false;
  return {
    results(count: unknown, params: Record<string, unknown>) {
      if (recorded || !query.trim() || Number(params.page ?? 1) !== 1 ||
          typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0 ||
          JSON.stringify(filterContext(params)) !== JSON.stringify(filters)) return;
      recorded = true;
      try {
        send({ event_id: id, query, platform, source, action: 'results_viewed', result_count: count, filters });
      } catch { /* Analytics cannot change search behavior. */ }
    },
  };
}
