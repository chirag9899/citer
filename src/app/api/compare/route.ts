import { NextRequest, NextResponse } from 'next/server';
import apiService from '@/lib/ApiService';
import { ChunkMetadata } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { chunkIdsA, chunkIdsB } = await req.json();
    if (!Array.isArray(chunkIdsA) || !Array.isArray(chunkIdsB) || chunkIdsA.length === 0 || chunkIdsB.length === 0) {
      return NextResponse.json({ error: 'chunkIdsA and chunkIdsB must be non-empty arrays' }, { status: 400 });
    }
    const chunksA: ChunkMetadata[] = await apiService.getChunksByIds(chunkIdsA);
    const chunksB: ChunkMetadata[] = await apiService.getChunksByIds(chunkIdsB);
    if (!chunksA.length || !chunksB.length) {
      return NextResponse.json({ error: 'No chunks found for provided IDs' }, { status: 404 });
    }

    // Format the chunks for comparison with clear separation
    const setAText = chunksA.map((chunk, i) =>
      `Document A${i + 1} (${chunk.source_doc_id} - ${chunk.section_heading}):\n${chunk.text}`
    ).join('\n\n');

    const setBText = chunksB.map((chunk, i) =>
      `Document B${i + 1} (${chunk.source_doc_id} - ${chunk.section_heading}):\n${chunk.text}`
    ).join('\n\n');

    // Create a custom prompt for comparison
    const prompt = `You are a research assistant tasked with comparing two sets of documents. Please analyze the content below and provide a detailed comparison highlighting similarities, differences, and notable findings.

SET A DOCUMENTS:
${setAText}

SET B DOCUMENTS:
${setBText}

Please provide a comprehensive comparison that includes:
1. **Similarities**: What common themes, concepts, or information appear in both sets?
2. **Differences**: What unique aspects, approaches, or information exist in each set?
3. **Key Findings**: What are the most notable insights when comparing these document sets?
4. **Context**: What topics or domains do these documents cover?

Comparison Analysis:`;

    console.log('Sending comparison prompt to LLM');
    
    // Use Gemini directly instead of getLLMAnswer since we have a custom prompt structure
    const { geminiClient } = await import('@/lib/geminiClient');
    const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';
    
    if (!geminiClient) {
      return NextResponse.json({ error: 'LLM service not available' }, { status: 503 });
    }

    const response = await geminiClient.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
    });
    
    const comparison = response.text || "No comparison generated";
    return NextResponse.json({ comparison });
  } catch (e) {
    console.error('Compare error:', e);
    return NextResponse.json({ error: 'Failed to generate comparison' }, { status: 500 });
  }
} 