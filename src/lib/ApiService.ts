import { SimilaritySearchResult, ChunkMetadata } from './types';

// Use relative URLs for Next.js API routes

interface SimilaritySearchResponse {
  query: string;
  results: SimilaritySearchResult[];
  total_found: number;
  search_params: {
    k: number;
    min_score: number;
    timestamp: string;
  };
}

interface UploadResponse {
  message: string;
  chunks_added?: number;
  total_chunks?: number;
  schema_version?: string;
}

class ApiService {
  async searchSimilar(query: string, k: number = 5, minScore: number = 0.25): Promise<SimilaritySearchResult[]> {
    try {
      const response = await fetch(`/api/similarity_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          k,
          min_score: minScore
        })
      });
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }
      const data: SimilaritySearchResponse = await response.json();
      return data.results;
    } catch {
      return [];
    }
  }

  async uploadChunks(chunks: ChunkMetadata[]): Promise<UploadResponse> {
    const response = await fetch(`/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunks)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `Upload failed: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  async getStats() {
    try {
      const response = await fetch(`/api/stats`);
      if (!response.ok) {
        throw new Error(`Stats failed: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch {
      return { total_chunks: 0, status: 'unavailable' };
    }
  }

  async getAllJournals(): Promise<string[]> {
    try {
      const response = await fetch(`/api/journal/all`);
      if (!response.ok) return [];
      const data = await response.json();
      const journals = (data.chunks || []).map((c: ChunkMetadata) => c.journal).filter(Boolean);
      return Array.from(new Set(journals));
    } catch {
      return [];
    }
  }

  async getAllYears(): Promise<string[]> {
    try {
      const response = await fetch(`/api/journal/all`);
      if (!response.ok) return [];
      const data = await response.json();
      const years = (data.chunks || []).map((c: ChunkMetadata) => c.publish_year).filter(Boolean);
      return Array.from(new Set(years.map(String)));
    } catch {
      return [];
    }
  }

  async getAllAttributes(): Promise<string[]> {
    try {
      const response = await fetch(`/api/journal/all`);
      if (!response.ok) return [];
      const data = await response.json();
      const attrs = (data.chunks || []).flatMap((c: ChunkMetadata) => {
        if (typeof c.attributes === 'string') {
          try { return JSON.parse(c.attributes); } catch { return []; }
        }
        return c.attributes || [];
      }).filter(Boolean);
      return Array.from(new Set(attrs));
    } catch {
      return [];
    }
  }

  async getChunksByIds(chunkIds: string[]): Promise<ChunkMetadata[]> {
    try {
      const response = await fetch(`/api/journal/all`);
      if (!response.ok) return [];
      const data = await response.json();
      const allChunks: ChunkMetadata[] = data.chunks || [];
      return allChunks.filter(chunk => chunk.id && chunkIds.includes(chunk.id));
    } catch {
      return [];
    }
  }
}

const apiService = new ApiService();
export default apiService; 