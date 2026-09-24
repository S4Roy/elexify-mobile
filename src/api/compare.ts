import { api, ApiError } from './client';
import { imageUrl, record, string } from './discovery';

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

export type CompareVariation = {
  id: string;
  label: string;
  price: number | null;
  regularPrice: number | null;
  stockQuantity: number | null;
  image?: string;
};

export type CompareSpec = {
  key: string;
  label: string;
  value: string;
  variationId?: string;
};

export type CompareProduct = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  image?: string;
  brand: string;
  category: string;
  categoryId?: string;
  categorySlug?: string;
  price: number | null;
  regularPrice: number | null;
  rating: number | null;
  totalReviews: number;
  stockQuantity: number | null;
  inStock: boolean;
  soldIndividually: boolean;
  weight: number;
  dimensions: string;
  variations: CompareVariation[];
  specifications: CompareSpec[];
};

function parseSpec(value: unknown): CompareSpec | null {
  const s = record(value);
  const def = record(s.definition);
  const key = string(s.key) || string(def.key);
  const label = string(s.label) || string(def.label);
  const rawValue = string(s.value) || string(s.value_string);
  if (!key || !label || !rawValue) {
    return null;
  }
  const unit = string(s.unit) || string(def.unit);
  return {
    key,
    label,
    value: unit ? `${rawValue} ${unit}` : rawValue,
    variationId: string(s.variation_id) || undefined,
  };
}
function parseVariation(value: unknown): CompareVariation {
  const v = record(value);
  const images = Array.isArray(v.images) ? v.images : [];
  return {
    id: string(v._id),
    label: string(v.combination_display) || string(v.sku) || 'Option',
    price: num(v.converted_price),
    regularPrice: num(v.converted_regular_price),
    stockQuantity: num(v.stock_quantity),
    image: imageUrl(images[0]),
  };
}
function parseCompareProduct(value: unknown): CompareProduct | null {
  const p = record(value);
  const id = string(p._id);
  if (!id || !string(p.name) || !string(p.slug)) {
    return null;
  }
  const images = Array.isArray(p.images) ? p.images : [];
  const categories = Array.isArray(p.categories) ? p.categories : [];
  const category = record(categories[0]);
  const brand = record(p.brand);
  const dims = record(p.dimensions);
  const dimensionParts = [dims.length, dims.width, dims.height]
    .map(v => num(v) ?? 0)
    .filter(v => v > 0);
  const specs = Array.isArray(p.specifications) ? p.specifications : [];
  const variations = Array.isArray(p.variations) ? p.variations : [];
  const stockQuantity = num(p.stock_quantity);
  return {
    id,
    slug: string(p.slug),
    name: string(p.name),
    sku: string(p.sku),
    image: imageUrl(images[0]),
    brand: string(brand.name),
    category: string(category.name),
    categoryId: string(category._id) || undefined,
    categorySlug: string(category.slug) || undefined,
    price: num(p.converted_price),
    regularPrice: num(p.converted_regular_price),
    rating: num(p.avg_rating),
    totalReviews: num(p.total_reviews) ?? 0,
    stockQuantity,
    inStock: !['out_of_stock', 'outofstock'].includes(string(p.stock_status)) && (stockQuantity ?? 0) > 0,
    soldIndividually: p.sold_individually === true,
    weight: num(p.weight) ?? 0,
    dimensions: dimensionParts.length ? `${dimensionParts.join(' × ')} cm` : '',
    variations: variations.map(parseVariation).filter(v => v.id),
    specifications: specs.map(parseSpec).filter((s): s is CompareSpec => s !== null),
  };
}
export async function compareProducts(
  ids: string[],
  signal?: AbortSignal,
): Promise<CompareProduct[]> {
  if (!ids.length) {
    return [];
  }
  const res = await api.post(
    'site/inventory/product/compare',
    { product_ids: ids, currency: 'INR' },
    { signal },
  );
  const docs = res.data?.data?.docs;
  if (!Array.isArray(docs)) {
    throw new ApiError('Unable to load comparison.');
  }
  const ordered = ids
    .map(id => docs.find((d: unknown) => string(record(d)._id) === id))
    .filter((d): d is unknown => d !== undefined);
  return ordered
    .map(parseCompareProduct)
    .filter((p): p is CompareProduct => p !== null);
}
