jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
import { addRecent } from '../src/stores/search';
test('recent searches deduplicate case-insensitively and are bounded', () => {
  expect(addRecent(['Board', 'Cable'], ' board ')).toEqual(['board', 'Cable']);
  expect(addRecent(['Board'], ' ')).toEqual(['Board']);
  expect(
    addRecent(
      Array.from({ length: 8 }, (_, i) => String(i)),
      'new',
    ),
  ).toHaveLength(8);
});
