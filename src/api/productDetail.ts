import { api, ApiError } from './client';
import { imageUrl, record, string } from './discovery';

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

export type AttributeValue = {
  id: string;
  name: string;
  image?: string;
  description: string;
};
export type ProductAttribute = {
  id: string;
  name: string;
  displayType: string;
  values: AttributeValue[];
};
export type Variation = {
  id: string;
  combinationKey: string;
  name: string;
  price: number | null;
  regularPrice: number | null;
  stockQuantity: number | null;
  images: string[];
  askForPrice: boolean;
  selections: { attributeId: string; valueId: string }[];
};
export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  description: string;
  shortDescription: string;
  images: string[];
  categories: { id: string; name: string; slug: string }[];
  price: number | null;
  regularPrice: number | null;
  rating: number | null;
  totalReviews: number;
  stockQuantity: number | null;
  askForPrice: boolean;
  inWishlist: boolean;
  attributes: ProductAttribute[];
  variations: Variation[];
};

function parseAttributeValue(value: unknown): AttributeValue {
  const v = record(value);
  return {
    id: string(v._id),
    name: string(v.name),
    image: imageUrl(v.image),
    description: string(v.description),
  };
}
function parseAttribute(value: unknown): ProductAttribute {
  const a = record(value);
  const details = record(a.attribute_details);
  const values = Array.isArray(a.attribute_values) ? a.attribute_values : [];
  return {
    id: string(a.attribute_id) || string(details._id),
    name: string(details.name),
    displayType: string(details.display_type),
    values: values.map(parseAttributeValue).filter(v => v.id && v.name),
  };
}
function parseVariation(value: unknown): Variation {
  const d = record(value);
  const images = Array.isArray(d.images) ? d.images : [];
  const attrs = Array.isArray(d.attributes) ? d.attributes : [];
  return {
    id: string(d._id),
    combinationKey: string(d.combination_key),
    name: string(d.name),
    price: num(d.sale_price),
    regularPrice: num(d.regular_price),
    stockQuantity: num(d.stock_quantity),
    images: images
      .map(imageUrl)
      .filter((u): u is string => !!u),
    askForPrice: d.ask_for_price === true,
    selections: attrs
      .map(record)
      .map(a => ({
        attributeId: string(a.attribute_id),
        valueId: string(a.value_id),
      }))
      .filter(s => s.attributeId && s.valueId),
  };
}
export function parseProductDetail(value: unknown): ProductDetail {
  const p = record(value);
  if (!string(p._id) || !string(p.name) || !string(p.slug)) {
    throw new ApiError('Unable to read product information.');
  }
  const images = Array.isArray(p.images) ? p.images : [];
  const categories = Array.isArray(p.categories) ? p.categories : [];
  const attributes = Array.isArray(p.attributes) ? p.attributes : [];
  const variations = Array.isArray(p.variations) ? p.variations : [];
  return {
    id: string(p._id),
    slug: string(p.slug),
    name: string(p.name),
    sku: string(p.sku),
    description: string(p.description),
    shortDescription: string(p.short_description),
    images: images.map(imageUrl).filter((u): u is string => !!u),
    categories: categories
      .map(record)
      .map(c => ({ id: string(c._id), name: string(c.name), slug: string(c.slug) }))
      .filter(c => c.id && c.name),
    price: num(p.sale_price),
    regularPrice: num(p.regular_price),
    rating: num(p.avg_rating),
    totalReviews: num(p.total_reviews) ?? 0,
    stockQuantity: num(p.stock_quantity),
    askForPrice: p.ask_for_price === true,
    inWishlist: !!p.wishlist,
    attributes: attributes.map(parseAttribute).filter(a => a.id && a.values.length > 0),
    variations: variations.map(parseVariation).filter(v => v.id),
  };
}
export async function fetchProductDetail(
  slug: string,
  variationId?: string,
  signal?: AbortSignal,
) {
  const res = await api.get(`site/inventory/product/details/${encodeURIComponent(slug)}`, {
    params: { currency: 'INR', ...(variationId ? { variation_id: variationId } : {}) },
    signal,
  });
  return parseProductDetail(res.data?.data);
}

export type Specification = { id: string; label: string; value: string; type: string };
function parseSpecification(value: unknown): Specification | null {
  const d = record(value);
  const spec = record(d.specification);
  const id = string(d._id);
  const label = string(spec.label) || string(d.label);
  if (!id || !label) {
    return null;
  }
  const type = string(spec.type);
  let text: string;
  if (type === 'boolean') {
    text = d.value === true || string(d.value_string).toLowerCase() === 'true' ? 'Yes' : 'No';
  } else {
    const numberValue = num(d.value_number);
    text = string(d.value) || string(d.value_string) || (numberValue !== null ? String(numberValue) : '');
  }
  return { id, label, value: text, type };
}
export async function fetchSpecifications(slug: string, signal?: AbortSignal) {
  const res = await api.get(
    `site/inventory/product/specifications/${encodeURIComponent(slug)}`,
    { signal },
  );
  const specs = res.data?.data?.specifications;
  if (!Array.isArray(specs)) {
    return [];
  }
  return specs
    .map(parseSpecification)
    .filter((s): s is Specification => s !== null && !!s.value);
}

export type Review = {
  id: string;
  rating: number;
  description: string;
  userName: string;
  createdAt: string;
  media: string[];
};
function parseReview(value: unknown): Review | null {
  const r = record(value);
  const id = string(r._id);
  const rating = num(r.rating);
  if (!id || rating === null) {
    return null;
  }
  const media = Array.isArray(r.media) ? r.media : [];
  return {
    id,
    rating,
    description: string(r.description),
    userName: string(record(r.user).name) || 'Elexify customer',
    createdAt: string(r.created_at),
    media: media.map(imageUrl).filter((u): u is string => !!u),
  };
}
export type SubmitRatingParams = {
  productId: string;
  variationId?: string;
  rating: number;
  description?: string;
};
export async function submitRating(params: SubmitRatingParams): Promise<void> {
  await api.post('user/rating/add', {
    product_id: params.productId,
    variation_id: params.variationId ?? null,
    rating: params.rating,
    description: params.description || undefined,
  });
}
export async function fetchReviews(
  productId: string,
  variationId: string | undefined,
  signal?: AbortSignal,
) {
  const res = await api.get('site/cms/ratings', {
    params: { product_id: productId, ...(variationId ? { variation_id: variationId } : {}) },
    signal,
  });
  const docs = res.data?.data?.docs;
  if (!Array.isArray(docs)) {
    return [];
  }
  return docs.map(parseReview).filter((r): r is Review => r !== null);
}

export type DeliveryEstimate = {
  shippingAmount: number | null;
  deliveryDisplay: string;
  isAvailable: boolean;
};
export async function checkDelivery(params: {
  postcode: string;
  productId: string;
  variationId?: string;
}): Promise<DeliveryEstimate> {
  const res = await api.post('site/inventory/shipping/estimate', {
    postcode: params.postcode,
    product_id: params.productId,
    ...(params.variationId ? { variation_id: params.variationId } : {}),
  });
  const data = record(res.data?.data);
  const shipping = record(data.shipping);
  const delivery = record(data.delivery);
  return {
    shippingAmount: num(shipping.amount),
    deliveryDisplay: string(delivery.display),
    isAvailable: data.is_available !== false,
  };
}
