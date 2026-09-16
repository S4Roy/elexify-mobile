import type { Variation } from '../../api/productDetail';

function normalize(raw: string): string {
  return raw
    .split('|')
    .map(s => s.trim())
    .filter(Boolean)
    .sort()
    .join('|');
}
export function matchVariation(
  variations: Variation[],
  selected: Record<string, string>,
): Variation | undefined {
  const pairs = Object.entries(selected);
  if (!pairs.length) {
    return undefined;
  }
  const key = normalize(pairs.map(([a, b]) => `${a}:${b}`).join('|'));
  return variations.find(v => normalize(v.combinationKey) === key);
}
export function selectionsFor(variation: Variation): Record<string, string> {
  return Object.fromEntries(
    variation.selections.map(s => [s.attributeId, s.valueId]),
  );
}
