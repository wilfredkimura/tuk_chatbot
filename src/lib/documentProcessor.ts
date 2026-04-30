import fs from "fs-extra";
import path from "path";
import { PDFParse } from "pdf-parse";
import { getEmbedding } from "./gemini";
import Knowledge from "@/models/Knowledge";
import dbConnect from "./db";

// Simple chunking utility
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  let currentPos = 0;

  while (currentPos < text.length) {
    let endPos = currentPos + maxChunkSize;
    if (endPos < text.length) {
      // Try to find a sentence end or newline to break cleanly
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
  return chunks.filter(c => c.length > 50); // Ignore tiny chunks
}


export async function processKnowledgeDirectory() {
  await dbConnect();
  const dirPath = path.join(process.cwd(), "data", "knowledge");
  
  if (!fs.existsSync(dirPath)) {
    console.log("No knowledge directory found at:", dirPath);
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
        // Modern pdf-parse usage (class-based)
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        content = result.text;
        // Clean up parser resources
        await parser.destroy();
      } else if (ext === ".json") {

        const data = await fs.readJson(filePath);
        content = JSON.stringify(data, null, 2);
      } else if (ext === ".txt" || ext === ".md") {
        content = await fs.readFile(filePath, "utf-8");
      } else {
        console.log(`Skipping unsupported file type: ${file}`);
        continue;
      }

      if (!content.trim()) continue;

      console.log(`Processing ${file} (${content.length} chars)...`);
      
      // Clear existing knowledge from this file to avoid duplicates
      await Knowledge.deleteMany({ category: file });

      const chunks = chunkText(content);
      
      for (const chunk of chunks) {
        const embedding = await getEmbedding(chunk);
        await Knowledge.create({
          content: chunk,
          category: file, // Use filename as category
          embedding: embedding
        });
      }

      totalProcessed++;
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }

  return { processed: totalProcessed };
}
