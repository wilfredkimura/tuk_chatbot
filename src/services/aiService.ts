import { GoogleGenAI } from "@google/genai";

// The client automatically gets the API key from the environment variable `AI_API_KEY`.
const ai = new GoogleGenAI({
  apiKey: process.env.AI_API_KEY!
});

/**
 * Generates vector embeddings for a given text using the local embedding model.
 * (Note: We use the local model in the processor, but this service can still 
 * provide AI-based utilities if needed).
 */
export async function getEmbedding(text: string): Promise<number[]> {
  // We are now using local embeddings via Transformers.js in the processor/retriever.
  // This function is kept for backward compatibility if needed for other AI tasks.
  throw new Error("Using local embeddings now. See localEmbeddings.ts");
}

export const aiModel = ai;
