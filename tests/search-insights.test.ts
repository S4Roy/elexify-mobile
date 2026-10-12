jest.mock('axios', () => ({ __esModule: true, default: { create: jest.fn(() => ({ post: jest.fn() })) } }));
jest.mock('../src/api/config', () => ({ apiConfig: { baseUrl: 'https://example.test/', publicKey: 'public' } }));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => '2cf75338-fc04-4f40-aecb-f82b65b57645') }));
import axios from 'axios';
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createSearchVisit } from '../src/features/search/searchVisit';
import { submitSearch, selectSearchSuggestion, useSearchVisit } from '../src/features/search/insights';
const post = (axios.create as jest.Mock).mock.results[0].value.post as jest.Mock;
const id = '2cf75338-fc04-4f40-aecb-f82b65b57645';
beforeEach(() => { post.mockReset(); post.mockResolvedValue({}); });
test('one successful first-page view records the full count and ignores retries, sort and pagination', () => {
  const send = jest.fn();
  const visit = createSearchVisit('plug', id, 'mobile', 'submitted', { search_key: 'plug' }, send);
  visit.results(30, { search_key: 'plug', page: 2 });
  expect(send).not.toHaveBeenCalled();
  visit.results(30, { search_key: 'plug', page: 1 });
  visit.results(30, { search_key: 'plug', page: 1, sort_by: 'price' });
  expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][0]).toMatchObject({ action: 'results_viewed', query: 'plug', result_count: 30 });
});
test('errors and changed filters do not become zero-result searches; retry may record genuine zero', () => {
  const send = jest.fn();
  const visit = createSearchVisit('battery', id, 'mobile', 'submitted', { category: 'cells' }, send);
  visit.results(undefined, { category: 'cells' });
  visit.results(0, { category: 'other' });
  expect(send).not.toHaveBeenCalled();
  visit.results(0, { category: 'cells' });
  expect(send.mock.calls[0][0]).toMatchObject({ result_count: 0, filters: { category: 'cells' } });
});
test('submission and selection have separate event types and do not block navigation on failure', async () => {
  post.mockRejectedValue(new Error('offline'));
  expect(submitSearch('plug')).toBe(id);
  expect(() => selectSearchSuggestion('plug', 'product1')).not.toThrow();
  await new Promise(resolve => setTimeout(resolve, 0));
  const calls = post.mock.calls.map(call => call[1]);
  expect(calls.filter(value => value.action === 'submitted')).toHaveLength(2);
  expect(calls.filter(value => value.action === 'suggestion_selected')).toHaveLength(2);
  expect(new Set(calls.map(value => value.event_id))).toEqual(new Set([id]));
});
test('blank input generates no event', () => {
  submitSearch('  ');
  selectSearchSuggestion('', 'product1');
  expect(post).not.toHaveBeenCalled();
});

test('synchronous transport failure does not block result handling or submission', () => {
  post.mockImplementation(() => { throw new Error('transport unavailable'); });
  expect(() => createSearchVisit('plug', id, 'mobile', 'submitted', {}, () => { throw new Error('transport unavailable'); }).results(0, {})).not.toThrow();
  expect(submitSearch('plug')).toBe(id);
});

test('late responses after a new query or navigation do not record results', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  let results!: ReturnType<typeof useSearchVisit>;
  function Probe({ query }: { query: string }) {
    results = useSearchVisit(query, undefined, {});
    return null;
  }
  let screen!: ReactTestRenderer;
  await act(async () => { screen = create(React.createElement(Probe, { query: 'plug' })); });
  const stale = results;
  await act(async () => { screen.update(React.createElement(Probe, { query: 'battery' })); });
  stale(0, {});
  expect(post).not.toHaveBeenCalled();
  results(8, {});
  expect(post.mock.calls[0][1]).toMatchObject({ query: 'battery', result_count: 8 });
  await act(async () => { screen.update(React.createElement(Probe, { query: 'cable' })); });
  const afterNavigation = results;
  await act(async () => { screen.unmount(); });
  afterNavigation(0, {});
  expect(post).toHaveBeenCalledTimes(1);
});
