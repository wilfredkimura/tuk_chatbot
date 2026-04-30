import Knowledge from "@/models/Knowledge";
import { getEmbedding } from "@/services/gemini";

/**
 * Calculates the cosine similarity between two vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

let knowledgeCache: any[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

/**
 * Retrieves the most relevant knowledge chunks for a given user query.
 */
export async function getRelevantContext(query: string, limit: number = 3): Promise<string> {
  try {
    const queryEmbedding = await getEmbedding(query);
    
    // Refresh cache if empty or expired
    if (!knowledgeCache || (Date.now() - lastCacheUpdate > CACHE_TTL)) {
      knowledgeCache = await Knowledge.find({});
      lastCacheUpdate = Date.now();
    }
    
    if (!knowledgeCache || knowledgeCache.length === 0) {
      return "";
    }


    const scoredKnowledge = knowledgeCache.map(k => ({
      content: k.content,
      similarity: cosineSimilarity(queryEmbedding, k.embedding)
    }));

    scoredKnowledge.sort((a, b) => b.similarity - a.similarity);
    
    // Log top match for debugging
    if (scoredKnowledge.length > 0) {
      console.log(`Top RAG Match (${scoredKnowledge[0].similarity.toFixed(4)}): ${scoredKnowledge[0].content.slice(0, 100)}...`);
    }

    const topResults = scoredKnowledge.slice(0, limit);
    return topResults.map(k => k.content).join("\n\n");


  } catch (error) {
    console.error("Context Retrieval Error:", error);
    return "";
  }
}
