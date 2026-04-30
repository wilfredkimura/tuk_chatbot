import dbConnect from "../src/lib/mongodb";
import { processKnowledgeDirectory } from "../src/lib/rag/processor";

async function runIngestion() {
  console.log("Starting RAG Ingestion...");
  await dbConnect();
  const result = await processKnowledgeDirectory();
  console.log("Ingestion Result:", result);
  process.exit(0);
}

runIngestion();
