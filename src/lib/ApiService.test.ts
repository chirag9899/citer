import apiService from './ApiService';
import { ChunkMetadata } from './types';

global.fetch = jest.fn();

describe('ApiService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('searchSimilar returns results on success', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ id: '1', metadata: { id: '1', source_doc_id: 'doc.pdf', section_heading: 'sec', journal: 'J', publish_year: 2020, link: '', text: '' }, score: 0.9 }] })
    });
    const results = await apiService.searchSimilar('query');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('1');
  });

  it('searchSimilar returns empty on error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const results = await apiService.searchSimilar('query');
    expect(results).toEqual([]);
  });

  it('getAllJournals returns unique journals', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ chunks: [ { journal: 'A' }, { journal: 'B' }, { journal: 'A' } ] })
    });
    const journals = await apiService.getAllJournals();
    expect(journals).toEqual(['A', 'B']);
  });

  it('getAllYears returns unique years as strings', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ chunks: [ { publish_year: 2020 }, { publish_year: 2021 }, { publish_year: 2020 } ] })
    });
    const years = await apiService.getAllYears();
    expect(years).toEqual(['2020', '2021']);
  });

  it('getAllAttributes returns unique attributes', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ chunks: [ { attributes: ['A', 'B'] }, { attributes: ['B', 'C'] } ] })
    });
    const attrs = await apiService.getAllAttributes();
    expect(attrs).toEqual(['A', 'B', 'C']);
  });

  it('getChunksByIds returns matching chunks', async () => {
    const chunks: ChunkMetadata[] = [
      { id: '1', source_doc_id: 'doc1', section_heading: '', journal: '', publish_year: 2020, link: '', text: '' },
      { id: '2', source_doc_id: 'doc2', section_heading: '', journal: '', publish_year: 2020, link: '', text: '' }
    ];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ chunks })
    });
    const found = await apiService.getChunksByIds(['2']);
    expect(found.length).toBe(1);
    expect(found[0].id).toBe('2');
  });

  it('getChunksByIds returns empty on error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const found = await apiService.getChunksByIds(['1']);
    expect(found).toEqual([]);
  });
}); 