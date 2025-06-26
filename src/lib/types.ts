
export interface ChunkMetadata {
  id?: string; // Optional as per plan, but good for keys
  source_doc_id: string;
  section_heading: string;
  journal: string;
  publish_year: string | number;
  link: string;
  text: string;
  chunk_index?: number;
  doi?: string;
  usage_count?: number;
  attributes?: string[];
}

export interface SimilaritySearchResult {
  id: string;
  metadata: ChunkMetadata;
  score: number;
}

export type Citation = ChunkMetadata;

export interface ChartDataPoint {
  name: string; // source_doc_id
  count: number;
}
