import { NextRequest, NextResponse } from "next/server";
import { processKnowledgeDirectory } from "@/lib/documentProcessor";

export async function GET(req: NextRequest) {
  try {
    const result = await processKnowledgeDirectory();
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "RAG Ingestion complete", 
      filesProcessed: result.processed 
    });
  } catch (error: any) {
    console.error("Ingestion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
