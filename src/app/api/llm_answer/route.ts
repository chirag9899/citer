import { NextRequest, NextResponse } from 'next/server';
import { getLLMAnswer } from '@/lib/GeminiService';
import { SimilaritySearchResult } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { question, contextChunks }: { question: string; contextChunks: Array<SimilaritySearchResult> } = await req.json();
    if (!question || !Array.isArray(contextChunks)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const answer = await getLLMAnswer(question, contextChunks);
    return NextResponse.json({ answer });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 