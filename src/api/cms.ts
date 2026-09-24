import { api, ApiError } from './client';
import { record, string } from './discovery';

export type CmsPage = {
  title: string;
  content: string;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

export function parseCmsPage(value: unknown): CmsPage {
  const p = record(value);
  if (!string(p.title)) {
    throw new ApiError('Unable to read this page.');
  }
  return { title: string(p.title), content: string(p.content) };
}

export async function fetchCmsPage(slug: string, signal?: AbortSignal) {
  const res = await api.get(`site/cms/page/${slug}`, { signal });
  return parseCmsPage(res.data?.data);
}

export function parseFaq(value: unknown): Faq {
  const f = record(value);
  if (!string(f._id) || !string(f.question)) {
    throw new ApiError('Unable to read this FAQ entry.');
  }
  return { id: string(f._id), question: string(f.question), answer: string(f.answer) };
}

export async function fetchFaqs(signal?: AbortSignal): Promise<Faq[]> {
  const res = await api.get('site/cms/faqs', { signal, params: { limit: 100 } });
  const data = record(res.data?.data);
  if (!Array.isArray(data.docs)) {
    throw new ApiError('Unable to read the FAQ list.');
  }
  return data.docs.map(parseFaq);
}

export type ContactUsPayload = {
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message?: string;
};

export async function submitContactUs(payload: ContactUsPayload): Promise<void> {
  await api.post('site/contact-us/submit', payload);
}
