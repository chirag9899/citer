import { Pinecone } from '@pinecone-database/pinecone';
import type { RecordMetadata } from '@pinecone-database/pinecone';
import { ChunkMetadata } from './types';

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

export async function fetchChunksByIds(ids: string[]): Promise<ChunkMetadata[]> {
  if (!ids || ids.length === 0) return [];
  const result = await index.fetch(ids);
  // result.records is an object with id as key and {metadata, ...} as value
  return Object.values(result.records || {}).map((rec: any) => ({
    id: rec.id,
    source_doc_id: rec.metadata?.source_doc_id || '',
    section_heading: rec.metadata?.section_heading || '',
    journal: rec.metadata?.journal || '',
    publish_year: rec.metadata?.publish_year || '',
    link: rec.metadata?.link || '',
    text: rec.metadata?.text || '',
    chunk_index: rec.metadata?.chunk_index,
    doi: rec.metadata?.doi,
    usage_count: rec.metadata?.usage_count,
    attributes: rec.metadata?.attributes
  }));
} 