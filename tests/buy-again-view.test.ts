import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../src/features/catalog/hooks', () => ({
  useIdentity: () => 'customer-1',
}));
jest.mock('../src/features/catalog/QueryState', () => ({
  QueryState: () => null,
}));
jest.mock('../src/api/buyAgain', () => ({
  fetchBuyAgain: jest.fn(),
  addBuyAgain: jest.fn(),
  buyAgainUnitPrice: () => 72,
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));
jest.mock('../src/components/ui', () => {
  const React = require('react');
  const { Text, Pressable } = require('react-native');
  return {
    AppText: Text,
    Button: ({ label, onPress, disabled }: any) =>
      React.createElement(
        Pressable,
        { accessibilityLabel: label, onPress, disabled },
        React.createElement(Text, null, label),
      ),
  };
});
jest.mock('../src/components/shop', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BottomSheet: ({ children, footer }: any) =>
      React.createElement(View, null, children, footer),
    money: (n: number) => `₹${n}`,
    shop: {},
  };
});
import { BuyAgainButton } from '../src/features/orders/BuyAgainButton';
import { addBuyAgain } from '../src/api/buyAgain';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
const invalidate = jest.fn().mockResolvedValue(undefined);
const items = [
  {
    id: 'line-1',
    name: 'Transformer',
    originalQuantity: 2,
    eligible: true,
    maxQuantity: 5,
    existingQuantity: 3,
    basePrice: 80,
    tiers: [],
  },
  {
    id: 'custom',
    name: 'Custom board',
    originalQuantity: 1,
    eligible: false,
    maxQuantity: 0,
    existingQuantity: 0,
    basePrice: 0,
    tiers: [],
    reason: 'Configure again.',
  },
];
beforeEach(() => {
  (useQuery as jest.Mock).mockReturnValue({
    data: items,
    isFetching: false,
    isPending: false,
    error: null,
  });
  (useQueryClient as jest.Mock).mockReturnValue({
    invalidateQueries: invalidate,
  });
  (useMutation as jest.Mock).mockImplementation(options => ({
    isPending: false,
    mutateAsync: async (selection: any) => {
      try {
        return await options.mutationFn(selection);
      } finally {
        options.onSettled();
      }
    },
  }));
});
const button = (view: ReactTestRenderer, label: string) =>
  view.root.findAll(
    node =>
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  )[0];
test('selects only eligible items, adds additional quantities once and refreshes the cart', async () => {
  let resolve!: (value: any) => void;
  (addBuyAgain as jest.Mock).mockReturnValue(
    new Promise(done => {
      resolve = done;
    }),
  );
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(React.createElement(BuyAgainButton, { orderId: 'order-1' }));
  });
  await act(async () => {
    button(view, 'Buy again').props.onPress();
  });
  expect(button(view, 'Select Custom board').props.disabled).toBe(true);
  const add = button(view, 'Add selected to cart');
  expect(add.props.disabled).toBe(false);
  let first: Promise<void>;
  act(() => {
    first = add.props.onPress();
    add.props.onPress();
  });
  expect(addBuyAgain).toHaveBeenCalledTimes(1);
  expect(addBuyAgain).toHaveBeenCalledWith('order-1', [
    { id: 'line-1', quantity: 2 },
  ]);
  await act(async () => {
    resolve([
      { id: 'line-1', added: true, quantity: 2, unitPrice: 72, reason: '' },
    ]);
    await first;
  });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cart', 'customer-1'] });
  expect(button(view, 'Add selected to cart').props.disabled).toBe(true);
  expect(button(view, 'Review cart')).toBeDefined();
  act(() => view.unmount());
});
