import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { AddressAccessGate } from '../src/features/address/AddressAccessGate';

let mockStatus = 'guest';
const mockInitialize = jest.fn(() => Promise.resolve());
const mockPush = jest.fn();
jest.mock('../src/stores/session', () => ({
  useSession: (selector: (state: unknown) => unknown) =>
    selector({ status: mockStatus, initialize: mockInitialize }),
}));
jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    canGoBack: () => true,
    back: jest.fn(),
    replace: jest.fn(),
  },
}));
jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');
jest.mock('../src/components/shop', () => ({
  ShopHeader: 'Header',
  shop: { page: {} },
}));
jest.mock('../src/components/ui', () => ({
  AppText: 'Text',
  Button: 'Button',
  Feedback: 'Feedback',
  Loading: 'Loading',
}));

function renderGate() {
  let tree: ReactTestRenderer;
  act(() => {
    tree = create(
      React.createElement(
        AddressAccessGate,
        null,
        React.createElement('AddressContent'),
      ),
    );
  });
  return tree!;
}

afterEach(() => {
  mockStatus = 'guest';
});

test('guests see sign-in options without mounting address content or loading', () => {
  const tree = renderGate();
  expect(tree.root.findAllByType('AddressContent' as never)).toHaveLength(0);
  expect(tree.root.findAllByType('Loading' as never)).toHaveLength(0);
  const signIn = tree.root
    .findAllByType('Button' as never)
    .find(button => button.props.label === 'Sign in or create account');
  act(() => signIn!.props.onPress());
  expect(mockPush).toHaveBeenCalledWith('/login');
  act(() => tree.unmount());
});

test('address content mounts when the guest signs in', () => {
  const tree = renderGate();
  mockStatus = 'authenticated';
  act(() => {
    tree.update(
      React.createElement(
        AddressAccessGate,
        null,
        React.createElement('AddressContent'),
      ),
    );
  });
  expect(tree.root.findAllByType('AddressContent' as never)).toHaveLength(1);
  expect(tree.root.findAllByType('Button' as never)).toHaveLength(0);
  act(() => tree.unmount());
});

test('session restoration shows loading and session errors offer retry', () => {
  mockStatus = 'loading';
  const tree = renderGate();
  expect(tree.root.findAllByType('Loading' as never)).toHaveLength(1);
  mockStatus = 'error';
  act(() => {
    tree.update(React.createElement(AddressAccessGate));
  });
  act(() => tree.root.findByType('Feedback' as never).props.onRetry());
  expect(mockInitialize).toHaveBeenCalled();
  act(() => tree.unmount());
});
