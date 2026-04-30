import { processKnowledgeDirectory } from "../src/lib/rag/processor";
import dbConnect from "../src/lib/mongodb";
import Knowledge from "../src/models/Knowledge";

async function run() {
  console.log("Starting RAG Ingestion...");
  try {
    await dbConnect();
    
    console.log("Cleaning old data...");
    await Knowledge.deleteMany({});
    
    const result = await processKnowledgeDirectory();
    console.log("Ingestion Result:", result);
    process.exit(0);
  } catch (err) {
    console.error("Ingestion failed:", err);
    process.exit(1);
  }
}

run();
