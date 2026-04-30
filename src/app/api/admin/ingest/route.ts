import { NextRequest, NextResponse } from "next/server";
import { processKnowledgeDirectory } from "@/lib/rag/processor";

/**
 * Admin endpoint to trigger manual knowledge ingestion.
 * Scans the data/knowledge directory and populates the vector database.
 */
export async function GET(req: NextRequest) {
  try {
    const result = await processKnowledgeDirectory();
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Knowledge base synchronized successfully.", 
      filesProcessed: result.processed 
    });
  } catch (error: any) {
    console.error("Ingestion endpoint error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
