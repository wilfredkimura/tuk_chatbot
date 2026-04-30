import { GoogleGenAI } from "@google/genai";

/**
 * Central AI Service
 * Initialized with the AI_API_KEY from environment variables.
 * Used for text generation and reasoning.
 */
export const ai = new GoogleGenAI({
  apiKey: process.env.AI_API_KEY!
});
