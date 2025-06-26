import { Pinecone } from '@pinecone-database/pinecone';
import type { RecordMetadata } from '@pinecone-database/pinecone';

const apiKey = process.env.PINECONE_API_KEY!;
const indexName = process.env.PINECONE_INDEX!;

const pinecone = new Pinecone({ apiKey });
const index = pinecone.index(indexName);

export { index, pinecone };

export function adjustEmbeddingDimension(embedding: number[], targetDim: number): number[] {
  if (embedding.length === targetDim) return embedding;
  if (embedding.length > targetDim) return embedding.slice(0, targetDim);
  // Pad with zeros if too short
  return [...embedding, ...Array(targetDim - embedding.length).fill(0)];
}

export async function upsertChunks(chunks: Array<{ id: string, embedding: number[], metadata: RecordMetadata }>) {
  const targetDim = 1024; // Pinecone index expects 1024
  await index.upsert(
    chunks.map(chunk => ({
      id: chunk.id,
      values: adjustEmbeddingDimension(chunk.embedding, targetDim),
      metadata: { ...chunk.metadata, id: chunk.id }
    }))
  );
}

export async function querySimilarChunks(embedding: number[], topK = 5) {
  const targetDim = 1024;
  const result = await index.query({
    vector: adjustEmbeddingDimension(embedding, targetDim),
    topK,
    includeMetadata: true
  });
  return result.matches;
} 