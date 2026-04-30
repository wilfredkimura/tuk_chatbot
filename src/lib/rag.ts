import Knowledge from "@/models/Knowledge";
import { getEmbedding } from "@/lib/gemini";

function dotProduct(vecA: number[], vecB: number[]) {
  return vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
}

function magnitude(vec: number[]) {
  return Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
}

function cosineSimilarity(vecA: number[], vecB: number[]) {
  const dot = dotProduct(vecA, vecB);
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export async function getRelevantContext(query: string, limit: number = 3) {
  try {
    const queryEmbedding = await getEmbedding(query);
    
    // Fetch all knowledge chunks
    const allKnowledge = await Knowledge.find({});
    
    if (allKnowledge.length === 0) {
      console.log("RAG: No knowledge found in database. Run ingestion first.");
      return "";
    }

    const scoredKnowledge = allKnowledge.map(k => ({
      content: k.content,
      similarity: cosineSimilarity(queryEmbedding, k.embedding)
    }));

    // Sort by similarity and take top results
    scoredKnowledge.sort((a, b) => b.similarity - a.similarity);
    
    // Filter out low similarity results (optional threshold)
    const topResults = scoredKnowledge.slice(0, limit);
    
    console.log(`RAG: Found ${topResults.length} relevant chunks for query: "${query.slice(0, 50)}..."`);
    
    return topResults.map(k => k.content).join("\n\n");
  } catch (error) {
    console.error("RAG Error:", error);
    return "";
  }
}

