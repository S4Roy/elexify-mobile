import { parseCmsPage, parseFaq } from '../src/api/cms';

jest.mock('../src/api/client', () => ({
  api: {},
  ApiError: class extends Error {},
}));

test('parseCmsPage reads title and content, and defaults missing content to empty', () => {
  expect(parseCmsPage({ title: 'Privacy Policy', content: '<p>We respect your data.</p>' })).toEqual({
    title: 'Privacy Policy',
    content: '<p>We respect your data.</p>',
    shortDescription: '',
  });
  expect(parseCmsPage({ title: 'About Us' })).toEqual({
    title: 'About Us',
    content: '',
    shortDescription: '',
  });
});

test('parseCmsPage maps the API short description for display', () => {
  expect(parseCmsPage({ title: 'About Us', short_description: 'Our story' })).toEqual({
    title: 'About Us',
    content: '',
    shortDescription: 'Our story',
  });
});

test('parseCmsPage rejects a response with no readable title', () => {
  expect(() => parseCmsPage({ content: '<p>Body only</p>' })).toThrow();
  expect(() => parseCmsPage({})).toThrow();
});

test('parseFaq reads question/answer and rejects malformed entries', () => {
  expect(parseFaq({ _id: 'f1', question: 'Do you ship internationally?', answer: 'Not yet.' })).toEqual({
    id: 'f1',
    question: 'Do you ship internationally?',
    answer: 'Not yet.',
  });
  expect(() => parseFaq({ question: 'No id' })).toThrow();
  expect(() => parseFaq({ _id: 'f2' })).toThrow();
});
