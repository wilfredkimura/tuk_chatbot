import { GoogleGenAI } from "@google/genai";

// The client automatically gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!
});

/**
 * Generates vector embeddings for a given text using the new Gemini Embedding API.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const result = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: [{ parts: [{ text }] }]
    });
    
    if (!result.embeddings || result.embeddings.length === 0) {
      throw new Error("No embeddings returned from Gemini API");
    }
    
    return result.embeddings[0].values as number[];

  } catch (error) {
    console.error("Gemini Embedding Error:", error);
    throw error;
  }
}
