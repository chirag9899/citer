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
  const records = result.records as Record<string, { id: string; metadata: RecordMetadata }>;
  return Object.values(records || {}).map((rec) => {
    let publish_year: string | number = '';
    const py = rec.metadata?.publish_year;
    if (typeof py === 'string' || typeof py === 'number') {
      publish_year = py;
    } else if (py !== undefined && py !== null) {
      publish_year = String(py);
    }
    return {
      id: String(rec.id),
      source_doc_id: String(rec.metadata?.source_doc_id ?? ''),
      section_heading: String(rec.metadata?.section_heading ?? ''),
      journal: String(rec.metadata?.journal ?? ''),
      publish_year,
      link: String(rec.metadata?.link ?? ''),
      text: String(rec.metadata?.text ?? ''),
      chunk_index: typeof rec.metadata?.chunk_index === 'number' ? rec.metadata.chunk_index : undefined,
      doi: rec.metadata?.doi ? String(rec.metadata.doi) : undefined,
      usage_count: typeof rec.metadata?.usage_count === 'number' ? rec.metadata.usage_count : undefined,
      attributes: Array.isArray(rec.metadata?.attributes)
        ? rec.metadata.attributes.map(String)
        : typeof rec.metadata?.attributes === 'string'
          ? [rec.metadata.attributes]
          : []
    };
  });
} 