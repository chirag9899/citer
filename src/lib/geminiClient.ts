import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;
 
export const geminiClient = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null; 

export async function generateGeminiDocumentEmbedding(text: string): Promise<number[]> {
  if (!geminiClient) throw new Error('Gemini client not initialized');
  const response = await geminiClient.models.embedContent({
    model: 'models/text-embedding-004',
    contents: text,
    config: { taskType: 'RETRIEVAL_DOCUMENT' }
  });
  if (!response.embeddings || !response.embeddings[0]?.values) throw new Error('No embedding returned');
  return response.embeddings[0].values;
}

export async function generateGeminiQueryEmbedding(text: string): Promise<number[]> {
  if (!geminiClient) throw new Error('Gemini client not initialized');
  const response = await geminiClient.models.embedContent({
    model: 'models/text-embedding-004',
    contents: text,
    config: { taskType: 'RETRIEVAL_QUERY' }
  });
  if (!response.embeddings || !response.embeddings[0]?.values) throw new Error('No embedding returned');
  return response.embeddings[0].values;
} 