import fs from "fs-extra";
import path from "path";
import { PDFParse } from "pdf-parse";
import { getEmbedding } from "@/services/gemini";
import Knowledge from "@/models/Knowledge";
import dbConnect from "@/lib/mongodb";

/**
 * Splits text into semantic chunks for better retrieval.
 */
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  let currentPos = 0;

  while (currentPos < text.length) {
    let endPos = currentPos + maxChunkSize;
    if (endPos < text.length) {
      const lastNewline = text.lastIndexOf("\n", endPos);
      if (lastNewline > currentPos + maxChunkSize * 0.8) {
        endPos = lastNewline + 1;
      } else {
        const lastPeriod = text.lastIndexOf(". ", endPos);
        if (lastPeriod > currentPos + maxChunkSize * 0.8) {
          endPos = lastPeriod + 2;
        }
      }
    }
    chunks.push(text.slice(currentPos, endPos).trim());
    currentPos = endPos;
  }
  return chunks.filter(c => c.length > 50);
}

/**
 * Scans the data/knowledge directory and indexes all documents into MongoDB.
 */
export async function processKnowledgeDirectory() {
  await dbConnect();
  const dirPath = path.join(process.cwd(), "data", "knowledge");
  
  if (!fs.existsSync(dirPath)) {
    return { processed: 0, error: "Directory not found" };
  }

  const files = await fs.readdir(dirPath);
  let totalProcessed = 0;

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const ext = path.extname(file).toLowerCase();
    let content = "";

    try {
      if (ext === ".pdf") {
        const buffer = await fs.readFile(filePath);
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        content = result.text;
        await parser.destroy();
      } else if (ext === ".json") {
        const data = await fs.readJson(filePath);
        content = JSON.stringify(data, null, 2);
      } else if (ext === ".txt" || ext === ".md") {
        content = await fs.readFile(filePath, "utf-8");
      } else {
        continue;
      }

      if (!content.trim()) continue;

      // Clean old records for this file to prevent duplicates
      await Knowledge.deleteMany({ category: file });

      const chunks = chunkText(content);
      for (const chunk of chunks) {
        const embedding = await getEmbedding(chunk);
        await Knowledge.create({
          content: chunk,
          category: file,
          embedding: embedding
        });
      }

      totalProcessed++;
    } catch (err) {
      console.error(`Failed to index ${file}:`, err);
    }
  }

  return { processed: totalProcessed };
}
