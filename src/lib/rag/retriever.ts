import dbConnect from "@/lib/mongodb";
import Knowledge from "@/models/Knowledge";
import { getLocalEmbedding } from "@/services/localEmbeddings";

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  if (!magA || !magB) return 0;
  return dotProduct / (magA * magB);
}

let knowledgeCache: any[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export async function getRelevantContext(query: string, limit: number = 3): Promise<string> {
  try {
    // Get embedding locally using Transformers.js
    const queryEmbedding = await getLocalEmbedding(query);
    
    await dbConnect();

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
