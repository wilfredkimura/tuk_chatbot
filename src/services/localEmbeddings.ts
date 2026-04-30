import { pipeline } from '@xenova/transformers';

let extractor: any = null;

/**
 * Initializes and returns the local embedding extractor.
 * Uses the industry-standard all-MiniLM-L6-v2 model.
 */
async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

/**
 * Generates a vector embedding for the given text LOCALLY.
 * No API calls, 100% private and free.
 */
export async function getLocalEmbedding(text: string): Promise<number[]> {
  try {
    const extract = await getExtractor();
    const output = await extract(text, { pooling: 'mean', normalize: true });
    
    // Convert Float32Array to standard number array
    return Array.from(output.data);
  } catch (error) {
    console.error("Local Embedding Error:", error);
    throw error;
  }
}
