import { GET } from './[journal_id]/route';
import { NextRequest } from 'next/server';

// Mock a minimal NextRequest-like object
const mockRequest = {
  method: 'GET',
  url: 'http://localhost/api/journal/JOURNAL1',
  headers: new Headers(),
  cookies: {},
  nextUrl: {},
  page: {},
  ua: '',
  [Symbol.for('INTERNALS')]: {},
} as unknown as NextRequest;

jest.mock('@/lib/PineconeService', () => {
  return {
  index: {
    query: jest.fn(async () => ({ matches: [
      { metadata: { journal: 'JOURNAL1', foo: 'bar' } },
      { metadata: { journal: 'JOURNAL2', foo: 'baz' } }
      ] }))
  }
  };
});

describe('API /api/journal/[journal_id]', () => {
  it('returns 200 and filtered chunks for valid journal_id', async () => {
    const res = await GET(mockRequest, { params: Promise.resolve({ journal_id: 'JOURNAL1' }) } as { params: Promise<{ journal_id: string }> });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.journal_id).toBe('JOURNAL1');
    expect(data.chunks.length).toBe(1);
    expect(data.chunks[0].foo).toBe('bar');
  });

  it('returns 400 for missing journal_id', async () => {
    const res = await GET(mockRequest, { params: Promise.resolve({}) } as { params: Promise<Record<string, unknown>> });
    expect(res.status).toBe(400);
  });
}); 