import { readFile } from "fs/promises";
import { join } from "path";
import { readdirSync } from "fs";
import { getLocalEmbedding } from "@/services/localEmbeddings";
import dbConnect from "@/lib/mongodb";
import Knowledge from "@/models/Knowledge";

const KNOWLEDGE_DIR = join(process.cwd(), "data", "knowledge");

/**
 * Maximum characters per chunk.
 * ~1500 chars keeps each chunk well under the BSON 16 MB limit
 * and produces higher-quality embeddings than huge blobs.
 */
const MAX_CHUNK_CHARS = 1500;

/**
 * Split a long string into chunks of roughly `maxLen` characters,
 * breaking at sentence boundaries when possible.
 */
function splitIntoChunks(text: string, maxLen = MAX_CHUNK_CHARS): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    // Try to break at the last sentence-ending punctuation within maxLen
    let breakpoint = -1;
    const slice = remaining.slice(0, maxLen);

    // Prefer breaking at ". " or ".\n"
    const lastPeriod = slice.lastIndexOf(". ");
    const lastNewline = slice.lastIndexOf(".\n");
    breakpoint = Math.max(lastPeriod, lastNewline);

    if (breakpoint === -1) {
      // Fallback: break at last space
      breakpoint = slice.lastIndexOf(" ");
    }
    if (breakpoint === -1) {
      // Absolute fallback: hard cut
      breakpoint = maxLen;
    } else {
      breakpoint += 1; // include the period/space
    }

    chunks.push(remaining.slice(0, breakpoint).trim());
    remaining = remaining.slice(breakpoint).trim();
  }

  return chunks.filter((c) => c.length > 30);
}

/**
 * Extract meaningful text from a scraped-data JSON entry.
 */
function extractTextFromEntry(entry: any): string {
  const parts: string[] = [];

  if (entry.title) parts.push(entry.title);
  if (entry.url) parts.push(`Source: ${entry.url}`);
  if (entry.content) parts.push(entry.content);

  // Include heading text
  if (Array.isArray(entry.headings)) {
    for (const h of entry.headings) {
      if (h.text) parts.push(h.text);
    }
  }

  // Flatten table data
  if (Array.isArray(entry.tables)) {
    for (const table of entry.tables) {
      if (Array.isArray(table)) {
        for (const row of table) {
          if (Array.isArray(row)) {
            parts.push(row.join(" | "));
          }
        }
      }
    }
  }

  return parts.join("\n");
}

/**
 * Process a JSON file: parse entries, chunk, embed, and upsert.
 */
async function processJsonFile(filename: string) {
  const filePath = join(KNOWLEDGE_DIR, filename);
  const raw = await readFile(filePath, "utf-8");
  const data = JSON.parse(raw);

  const entries: any[] = Array.isArray(data) ? data : [data];
  console.log(`[JSON] ${filename}: ${entries.length} entries found.`);

  let chunkCount = 0;

  for (let i = 0; i < entries.length; i++) {
    const text = extractTextFromEntry(entries[i]);
    if (!text || text.length < 50) continue;

    const chunks = splitIntoChunks(text);

    for (const chunk of chunks) {
      try {
        const embedding = await getLocalEmbedding(chunk);

        await Knowledge.findOneAndUpdate(
          { content: chunk },
          {
            content: chunk,
            category: filename,
            embedding: embedding,
            updatedAt: new Date(),
          },
          { upsert: true, returnDocument: "after" }
        );
        chunkCount++;
      } catch (err) {
        console.error(
          `Error processing chunk ${chunkCount} in ${filename}:`,
          err
        );
      }
    }

    // Progress logging every 10 entries
    if ((i + 1) % 10 === 0) {
      console.log(
        `  [${filename}] Processed ${i + 1}/${entries.length} entries (${chunkCount} chunks so far)`
      );
    }
  }

  console.log(`[JSON] ${filename}: Done — ${chunkCount} chunks ingested.`);
}

/**
 * Process a plain text file by paragraph-based chunking.
 */
async function processTextFile(filename: string) {
  const filePath = join(KNOWLEDGE_DIR, filename);
  const content = await readFile(filePath, "utf-8");

  // Split by double-newlines, then further chunk if needed
  const paragraphs = content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 50);

  const allChunks: string[] = [];
  for (const para of paragraphs) {
    allChunks.push(...splitIntoChunks(para));
  }

  console.log(`[TXT] ${filename}: ${allChunks.length} chunks found.`);

  await dbConnect();

  for (const chunk of allChunks) {
    try {
      const embedding = await getLocalEmbedding(chunk);

      await Knowledge.findOneAndUpdate(
        { content: chunk },
        {
          content: chunk,
          category: filename,
          embedding: embedding,
          updatedAt: new Date(),
        },
        { upsert: true, returnDocument: "after" }
      );
    } catch (err) {
      console.error(`Error processing chunk in ${filename}:`, err);
    }
  }

  console.log(`[TXT] ${filename}: Done.`);
}

export async function processFile(filename: string) {
  await dbConnect();

  if (filename.endsWith(".json")) {
    await processJsonFile(filename);
  } else {
    await processTextFile(filename);
  }
}

export async function processKnowledgeDirectory() {
  await dbConnect();

  // Wipe existing knowledge before re-ingesting
  const deleteResult = await Knowledge.deleteMany({});
  console.log(
    `🗑️  Cleared existing knowledge: ${deleteResult.deletedCount} documents deleted.`
  );

  const files = readdirSync(KNOWLEDGE_DIR);
  let processedCount = 0;

  for (const file of files) {
    if (file.endsWith(".txt") || file.endsWith(".json")) {
      await processFile(file);
      processedCount++;
    }
  }

  const totalDocs = await Knowledge.countDocuments();
  console.log(`✅ Ingestion complete: ${totalDocs} documents now in database.`);

  return { processed: processedCount, totalDocuments: totalDocs };
}
