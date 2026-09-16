import { api, ApiError } from './client';
export type CatalogPreview = { id: string; name: string };
export function parseCatalogPreview(value: unknown): CatalogPreview[] {
  if (!Array.isArray(value)) {
    throw new ApiError('The product response could not be read.');
  }
  return value.map((item: unknown) => {
    if (
      !item ||
      typeof item !== 'object' ||
      !('_id' in item) ||
      !('name' in item) ||
      typeof item._id !== 'string' ||
      typeof item.name !== 'string'
    ) {
      throw new ApiError('The product response could not be read.');
    }
    return { id: item._id, name: item.name };
  });
}
export async function getCatalogPreview(signal?: AbortSignal) {
  const response = await api.get('site/inventory/product/list', {
    params: { limit: 4, page: 1, currency: 'INR' },
    signal,
  });
  return parseCatalogPreview(response.data?.data?.docs);
}
