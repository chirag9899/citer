import { NextRequest, NextResponse } from 'next/server';
import { upsertChunks, index } from '@/lib/PineconeService';
import { generateGeminiDocumentEmbedding } from '@/lib/geminiClient';

// Validate chunk structure
function isValidChunk(chunk: unknown): boolean {
  if (!chunk || typeof chunk !== 'object') return false;
  const c = chunk as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.source_doc_id === 'string' &&
    typeof c.section_heading === 'string' &&
    typeof c.journal === 'string' &&
    (typeof c.publish_year === 'string' || typeof c.publish_year === 'number') &&
    typeof c.usage_count === 'number' &&
    Array.isArray(c.attributes) &&
    typeof c.link === 'string' &&
    typeof c.text === 'string'
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chunks = Array.isArray(body) ? body : body.chunks;
    if (!Array.isArray(chunks)) {
      return NextResponse.json({ error: 'Request body must be an array of chunk objects or { chunks: [...] }.' }, { status: 400 });
    }
    // Check for invalid structure
    for (const chunk of chunks) {
      if (!isValidChunk(chunk)) {
        return NextResponse.json({ error: 'Each chunk must have id, source_doc_id, section_heading, journal, publish_year, usage_count, attributes, link, and text.' }, { status: 400 });
      }
    }
    // Check for duplicate IDs in upload batch
    const ids = new Set();
    for (const chunk of chunks) {
      if (ids.has(chunk.id)) {
        return NextResponse.json({ error: `Duplicate chunk id found in upload batch: ${chunk.id}` }, { status: 400 });
      }
      ids.add(chunk.id);
    }
    // Use Pinecone's fetch API to check for existing IDs
    const uploadIds = chunks.map(chunk => chunk.id);
    const fetchResult = await index.fetch(uploadIds);
    const existingIds = new Set(Object.keys(fetchResult.records || {}));
    // Filter out chunks whose IDs already exist in Pinecone
    const newChunks = chunks.filter(chunk => !existingIds.has(chunk.id));
    const skippedChunks = chunks.filter(chunk => existingIds.has(chunk.id)).map(chunk => chunk.id);
    // Generate embeddings and upsert only new chunks
    let upsertedCount = 0;
    if (newChunks.length > 0) {
      const toUpsert = await Promise.all(newChunks.map(async (chunk) => ({
        id: chunk.id,
        embedding: await generateGeminiDocumentEmbedding(chunk.text),
        metadata: { ...chunk }
      })));
      await upsertChunks(toUpsert);
      upsertedCount = toUpsert.length;
    }
    return NextResponse.json({
      message: `Successfully uploaded ${upsertedCount} new chunks.${skippedChunks.length > 0 ? ' Skipped ' + skippedChunks.length + ' redundant chunks.' : ''}`,
      chunks_added: upsertedCount,
      skipped_ids: skippedChunks
    }, { status: 202 });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: 'Failed to process upload.' }, { status: 500 });
  }
}