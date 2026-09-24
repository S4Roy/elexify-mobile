jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
import { useReviewPromptStore } from '../src/stores/reviewPrompt';

beforeEach(() => {
  useReviewPromptStore.setState({ lastPromptedAt: null, promptCount: 0 });
});

test('allows the first prompt with no history', () => {
  expect(useReviewPromptStore.getState().canPrompt()).toBe(true);
});

test('blocks a second prompt within the cooldown window', () => {
  useReviewPromptStore.getState().recordPrompt();
  expect(useReviewPromptStore.getState().canPrompt()).toBe(false);
});

test('allows another prompt once the cooldown has elapsed', () => {
  useReviewPromptStore.setState({
    lastPromptedAt: new Date(Date.now() - 61 * 86_400_000).toISOString(),
    promptCount: 1,
  });
  expect(useReviewPromptStore.getState().canPrompt()).toBe(true);
});

test('stops prompting after the lifetime cap even outside the cooldown', () => {
  useReviewPromptStore.setState({
    lastPromptedAt: new Date(Date.now() - 365 * 86_400_000).toISOString(),
    promptCount: 3,
  });
  expect(useReviewPromptStore.getState().canPrompt()).toBe(false);
});

test('recordPrompt increments the count and stamps the time', () => {
  useReviewPromptStore.getState().recordPrompt();
  const state = useReviewPromptStore.getState();
  expect(state.promptCount).toBe(1);
  expect(state.lastPromptedAt).not.toBeNull();
});
