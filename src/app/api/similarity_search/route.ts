import { NextRequest, NextResponse } from 'next/server';
import { querySimilarChunks, index } from '@/lib/PineconeService';
import { generateGeminiQueryEmbedding } from '@/lib/geminiClient';

export async function POST(req: NextRequest) {
  try {
    const { query, k = 10, min_score = 0.0, publish_year, journal, attributes } = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required and must be a non-empty string' }, { status: 400 });
    }

    let queryEmbedding: number[];
    try {
      queryEmbedding = await generateGeminiQueryEmbedding(query);
    } catch (e) {
      console.error('Embedding error:', e);
      return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
    }

    let pineconeResults = await querySimilarChunks(queryEmbedding, Math.min(k, 100));

    // Apply filters
    if (publish_year) {
      pineconeResults = pineconeResults.filter((match) => {
        return match.metadata && String(match.metadata.publish_year) === String(publish_year);
      });
    }
    if (journal) {
      pineconeResults = pineconeResults.filter((match) => {
        return match.metadata && match.metadata.journal && typeof match.metadata.journal === 'string' && match.metadata.journal.toLowerCase() === journal.toLowerCase();
      });
    }
    if (attributes && Array.isArray(attributes) && attributes.length > 0) {
      pineconeResults = pineconeResults.filter((match) => {
        const attrs = Array.isArray(match.metadata?.attributes)
          ? match.metadata.attributes
          : (typeof match.metadata?.attributes === 'string' ? JSON.parse(match.metadata.attributes) : []);
        return attributes.every((attr: string) => attrs.includes(attr));
      });
    }

    // Format results to match previous API
    const results = (pineconeResults || []).map((match) => {
      return {
        id: match.id,
        score: match.score,
        metadata: match.metadata || {} // Ensure metadata is defined
      };
    });

    // Usage tracking: increment usage_count for each retrieved chunk
    await Promise.all(results.map(async (result) => {
      try {
        const currentUsage = Number(result.metadata.usage_count) || 0;
        await index.update({
          id: result.id,
          metadata: { ...result.metadata, usage_count: currentUsage + 1 }
        });
      } catch {
        // Ignore errors for usage tracking
      }
    }));

    return NextResponse.json({
      query,
      results,
      total_found: results.length,
      search_params: {
        k,
        min_score,
        publish_year,
        journal,
        attributes,
        timestamp: new Date().toISOString()
      },
      embedding: queryEmbedding
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
    return NextResponse.json({ error: 'Internal server error during search', details: error.message || 'Unknown error' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error during search', details: 'Unknown error' }, { status: 500 });
  }
}