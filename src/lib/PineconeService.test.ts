import { upsertChunks, querySimilarChunks, adjustEmbeddingDimension } from './PineconeService';

jest.mock('@pinecone-database/pinecone', () => {
  return {
    Pinecone: jest.fn().mockImplementation(() => ({
      index: jest.fn(() => ({
        upsert: jest.fn(async () => ({})),
        query: jest.fn(async () => ({ matches: [{ id: 'test', score: 0.9, metadata: { foo: 'bar', id: 'test' } }] }))
      }))
    }))
  };
});

describe('PineconeService', () => {
  it('should upsert chunks without error', async () => {
    await expect(upsertChunks([
      { id: 'test', embedding: [0, 1, 2], metadata: { foo: 'bar', id: 'test' } }
    ])).resolves.not.toThrow();
  });

  it('should query similar chunks and return matches', async () => {
    const matches = await querySimilarChunks([0, 1, 2], 1);
    expect(matches).toBeDefined();
    expect(matches.length).toBeGreaterThan(0);
    if (matches[0] && matches[0].metadata) {
      expect(matches[0].id).toBe('test');
      expect(matches[0].metadata.foo).toBe('bar');
    }
  });

  it('should pad or truncate embeddings to 1024', () => {
    const short = adjustEmbeddingDimension([1, 2, 3], 1024);
    expect(short.length).toBe(1024);
    const long = adjustEmbeddingDimension(Array(2000).fill(1), 1024);
    expect(long.length).toBe(1024);
  });

  it('should handle empty input for upsert', async () => {
    await expect(upsertChunks([])).resolves.not.toThrow();
  });

  it('should handle empty input for query', async () => {
    const matches = await querySimilarChunks([], 1);
    expect(Array.isArray(matches)).toBe(true);
  });
}); 