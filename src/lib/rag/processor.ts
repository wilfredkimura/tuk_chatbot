import { readFile } from "fs/promises";
import { join } from "path";
import { readdirSync } from "fs";
import { getLocalEmbedding } from "@/services/localEmbeddings";
import dbConnect from "@/lib/mongodb";
import Knowledge from "@/models/Knowledge";

const KNOWLEDGE_DIR = join(process.cwd(), "data", "knowledge");

export async function processFile(filename: string) {
  const filePath = join(KNOWLEDGE_DIR, filename);
  const content = await readFile(filePath, "utf-8");
  
  // Simple chunking logic (by paragraphs)
  const chunks = content
    .split(/\n\n+/)
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 50);

  console.log(`Processing ${filename}: ${chunks.length} chunks found.`);

  await dbConnect();

  for (const chunk of chunks) {
    try {
      // Use local embedding instead of cloud API
      const embedding = await getLocalEmbedding(chunk);
      
      await Knowledge.findOneAndUpdate(
        { content: chunk },
        {
          content: chunk,
          category: filename,
          embedding: embedding,
          updatedAt: new Date()
        },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (err) {
      console.error(`Error processing chunk in ${filename}:`, err);
    }
  }
}

export async function processKnowledgeDirectory() {
  const files = readdirSync(KNOWLEDGE_DIR);
  let processedCount = 0;

  for (const file of files) {
    if (file.endsWith(".txt") || file.endsWith(".json")) {
      await processFile(file);
      processedCount++;
    }
  }

  return { processed: processedCount };
}
