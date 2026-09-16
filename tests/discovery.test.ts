import {
  parseCategory,
  parseHome,
  parsePage,
  parseProduct,
  resolvedQuery,
} from '../src/api/discovery';
import {
  emptyFilters,
  priceError,
  productParams,
  uniqueProducts,
} from '../src/features/catalog/filters';
jest.mock('../src/api/client', () => ({
  api: {},
  ApiError: class extends Error {},
}));
const product = {
  _id: 'p1',
  slug: 'amplifier',
  name: 'Amplifier',
  converted_price: 1200,
  converted_regular_price: 1299,
  images: [{ url: 'https://images.test/board.png' }],
};
test('retains variation identity, prices and image media shape', () => {
  const parsed = parseProduct({
    ...product,
    variation_id: 'v1',
    in_stock: false,
  });
  expect(parsed).toMatchObject({
    key: 'p1:v1',
    price: 1200,
    regularPrice: 1299,
    image: 'https://images.test/board.png',
    inStock: false,
  });
  expect(
    uniqueProducts([
      parsed,
      parsed,
      parseProduct({ ...product, variation_id: 'v2' }),
    ]),
  ).toHaveLength(2);
});
test('missing prices are not presented as free products', () => {
  expect(
    parseProduct({ ...product, converted_price: undefined }).price,
  ).toBeNull();
  expect(() => parseProduct({ name: 'Bad' })).toThrow();
});
test('honors server pagination and stops on empty pages', () => {
  expect(
    parsePage(
      { docs: [product], hasNextPage: true, totalDocs: 20 },
      parseProduct,
      1,
      12,
    ).nextPage,
  ).toBe(2);
  expect(
    parsePage({ docs: [product], hasNextPage: false }, parseProduct, 1, 1)
      .nextPage,
  ).toBeUndefined();
  expect(
    parsePage({ docs: [], hasNextPage: true }, parseProduct, 2, 12).nextPage,
  ).toBeUndefined();
  expect(() => parsePage({}, parseProduct, 1, 12)).toThrow();
});
test('maps category hierarchy and rejects missing route slugs', () => {
  expect(
    parseCategory({ _id: 'c', slug: 'boards', name: 'Boards', child_count: 2 })
      .hasChildren,
  ).toBe(true);
  expect(() => parseCategory({ _id: 'c', name: 'Boards' })).toThrow();
});
test('home ignores disabled and unknown sections and preserves order', () => {
  expect(
    parseHome({
      sections: [
        { _id: 'b', type: 'hero', order: 2 },
        { _id: 'a', type: 'category_section', order: 1 },
        { _id: 'x', type: 'hero', enabled: false },
        { _id: 'z', type: 'unknown' },
      ],
    }).map(s => s.id),
  ).toEqual(['a', 'b']);
  expect(() => parseHome({})).toThrow();
});
test('CMS cannot supply arbitrary transport config or unsupported filters', () => {
  expect(
    resolvedQuery(
      {
        baseURL: 'https://other.test',
        brand: 'brand',
        category: 'boards',
        limit: 999,
      },
      'product',
    ),
  ).toEqual({ category: 'boards', limit: 24 });
});
test('filters map to supported server params and keep search with sorting', () => {
  expect(
    productParams(
      ' amplifier ',
      {
        ...emptyFilters(),
        categories: ['boards', 'boards'],
        bestseller: true,
        min: '100',
        max: '500',
      },
      'price_asc',
    ),
  ).toEqual({
    limit: 12,
    sort_by: 'price',
    sort_order: 1,
    search_key: 'amplifier',
    category: 'boards',
    is_bestseller: 'true',
    price_min: 100,
    price_max: 500,
  });
});
test('invalid price ranges cannot reach the API', () => {
  for (const [min, max] of [
    ['500', '100'],
    ['-1', '100'],
    ['1.234', '100'],
    ['NaN', ''],
    ['', '0'],
  ]) {
    const filters = { ...emptyFilters(), min, max };
    expect(priceError(filters)).not.toBeNull();
    expect(() => productParams('', filters, 'newest')).toThrow();
  }
  expect(priceError({ ...emptyFilters(), min: '0', max: '100' })).toBeNull();
});
