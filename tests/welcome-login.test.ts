jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWelcome } from '../src/features/auth/welcome';

beforeEach(async () => {
  await AsyncStorage.clear();
  useWelcome.setState({ phase: 'checking' });
});

test('shows the skippable login to a guest on first launch only', async () => {
  await useWelcome.getState().decide('guest');
  expect(useWelcome.getState().phase).toBe('show');
  useWelcome.getState().finish();

  // Next launch: never prompted again.
  useWelcome.setState({ phase: 'checking' });
  await useWelcome.getState().decide('guest');
  expect(useWelcome.getState().phase).toBe('done');
});

test('never prompts someone already signed in', async () => {
  await useWelcome.getState().decide('authenticated');
  expect(useWelcome.getState().phase).toBe('done');
  expect(await AsyncStorage.getItem('onboarding.welcomeLogin.v1')).toBeNull();
});

test('decides once per launch', async () => {
  await useWelcome.getState().decide('guest');
  useWelcome.getState().finish();
  await useWelcome.getState().decide('guest');
  expect(useWelcome.getState().phase).toBe('done');
});
