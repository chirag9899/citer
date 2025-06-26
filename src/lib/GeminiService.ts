import { GenerateContentResponse } from "@google/genai";
import { SimilaritySearchResult } from '@/lib/types';
import { geminiClient } from './geminiClient';

const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';

// Get an LLM answer from Gemini based on a question and context chunks
export const getLLMAnswer = async (question: string, contextChunks: SimilaritySearchResult[]): Promise<string> => {
    if (!geminiClient) {
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
        return "Gemini API key is missing or invalid. Please configure it in your environment.";
    }
    if (contextChunks.length === 0) {
        return "No relevant documents found in the provided context.";
    }
    // Format context for the LLM
    const contextText = contextChunks.map((chunk, i) =>
        `Citation ${i + 1} (Source Document ID: ${chunk.metadata.source_doc_id}, Section: \"${chunk.metadata.section_heading}\"):\n${chunk.metadata.text}`
    ).join('\n\n---\n\n');

    const prompt = `You are a research assistant. Use ONLY the provided context below to answer the user's question. If none of the context is relevant to the question, reply: 'No relevant information found in the provided context.' Otherwise, answer as best as possible using only the context. Do NOT make up information or use outside knowledge.

Context:
${contextText}

Question: ${question}

Answer:`;

    try {
        const response: GenerateContentResponse = await geminiClient.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: prompt,
        });
        return response.text || "No response generated";
    } catch {
        return "An error occurred while communicating with the AI model.";
    }
};
