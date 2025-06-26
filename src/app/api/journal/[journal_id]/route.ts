import { NextRequest, NextResponse } from 'next/server';
import { index } from '@/lib/PineconeService';

export async function GET(req: NextRequest, context: { params: Promise<{ journal_id?: string }> }) {
  try {
    const params = await context.params;
    const journalId = params?.journal_id;
    if (!journalId) {
      return NextResponse.json({ error: 'Missing journal_id' }, { status: 400 });
    }
    if (journalId && journalId !== 'all') {
      // Pinecone does not support direct metadata filtering, so fetch all and filter client-side (for demo)
      const all = await index.query({
        vector: Array(1024).fill(0), // match your index dimension
        topK: 1000,
        includeMetadata: true
      });
      const matches = (all.matches || []).filter((match) => {
        return match.metadata && match.metadata.journal && typeof match.metadata.journal === 'string' && match.metadata.journal.toLowerCase() === journalId.toLowerCase();
      });
      return NextResponse.json({
        journal_id: journalId,
        total_found: matches.length,
        chunks: matches.map((m) => m.metadata)
      });
    } else {
      // Return all chunks for /api/journal/all
      const all = await index.query({
        vector: Array(1024).fill(0), // match your index dimension
        topK: 1000,
        includeMetadata: true
      });
      return NextResponse.json({
        total_found: (all.matches || []).length,
        chunks: (all.matches || []).map((m) => m.metadata ?? {})
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 