import { NextRequest, NextResponse } from 'next/server';
import { getLLMAnswer } from '@/lib/GeminiService';
import { fetchChunksByIds } from '@/lib/PineconeService';
import { ChunkMetadata } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { chunkIds } = await req.json();
    if (!Array.isArray(chunkIds) || chunkIds.length === 0) {
      return NextResponse.json({ error: 'chunkIds must be a non-empty array' }, { status: 400 });
    }
    const chunks: ChunkMetadata[] = await fetchChunksByIds(chunkIds);
    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ error: 'No chunks found for provided IDs' }, { status: 404 });
    }
    const context = chunks.map((chunk: ChunkMetadata) => ({ metadata: chunk, id: chunk.id || '', score: 1 }));
    const summary = await getLLMAnswer('Summarize the following content:', context);
    return NextResponse.json({ summary });
  } catch (e) {
    console.error('Summary error:', e);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
} 