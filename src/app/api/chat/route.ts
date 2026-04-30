import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Chat from "@/models/Chat";
import Memory from "@/models/Memory";
import systemPromptData from "@/constants/systemPrompt.json";
import { getRelevantContext } from "@/lib/rag/retriever";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!
});

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userId, sessionId: incomingSessionId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    // Connect to DB
    await dbConnect();

    // Generate or use existing sessionId
    const sessionId = incomingSessionId || crypto.randomUUID();

    // Get the latest user message for RAG retrieval
    const userMessage = messages[messages.length - 1]?.content || "";

    // OPTIMIZATION: Skip RAG for short greetings to save time (near-instant response)
    const isGreeting = userMessage.length < 15 && /^(hello|hi|hey|how are you|good morning|good afternoon|good evening|yo|hola|greetings)/i.test(userMessage);

    // FETCH RELEVANT KNOWLEDGE (RAG)
    const relevantContext = isGreeting ? "" : await getRelevantContext(userMessage);


    // Load memory context for this user
    let memoryContext = "";
    if (userId) {
      const memory = await Memory.findOne({ userId });
      if (memory?.contextSummary) {
        memoryContext = `\n\n## User Context (from previous sessions)\n${memory.contextSummary}`;
        if (memory.keyDetails?.length > 0) {
          memoryContext += `\nKey details about this user: ${memory.keyDetails.join(", ")}`;
        }
      }
    }

    // Build system prompt from Constant + RAG Context
    const systemInstruction = systemPromptData.system_instructions + "\n\n" + relevantContext + memoryContext;

    // Convert chat history to Gemini format (model/user)
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // Start generating streaming response
    const streamResult = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: systemInstruction
      }
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";
        try {
          for await (const chunk of streamResult) {
            const text = chunk.text || "";



            if (text) {
              fullText += text;
              controller.enqueue(encoder.encode(text));
            }
          }

          // Save to DB in background after stream completes
          if (userId) {
            // Run background tasks without blocking the response
            (async () => {
              try {
                if (messages[messages.length - 1]?.role === "user") {
                  await Chat.create({ userId, sessionId, role: "user", content: userMessage });
                }
                await Chat.create({ userId, sessionId, role: "assistant", content: fullText });
                await updateMemory(userId, messages, fullText);
              } catch (e) {
                console.error("Background save error:", e);
              }
            })();
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "X-Session-ID": sessionId
      }
    });

  } catch (error: any) {

    console.error("Chat API Error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 });
  }
}

// ─── Memory updater ───────────────────────────────────────────────
async function updateMemory(userId: string, messages: any[], aiResponse: string) {
  try {
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const keyDetails: string[] = [];

    const programmeMatch = lastUserMsg.match(
      /\b(engineering|computer science|IT|information technology|architecture|medicine|nursing|business|law|biology|chemistry|physics|math)\b/i
    );
    if (programmeMatch) {
      keyDetails.push(`Interested in ${programmeMatch[0]}`);
    }

    if (/admission|apply|application|intake|join|enroll/i.test(lastUserMsg)) {
      keyDetails.push("Asked about admissions");
    }

    if (/fee|fees|cost|payment|scholarship/i.test(lastUserMsg)) {
      keyDetails.push("Asked about fees or funding");
    }

    const recentExchange = messages
      .slice(-4)
      .map((m) => `${m.role === "user" ? "Student" : "TUK Bot"}: ${m.content.slice(0, 120)}`)
      .join("\n");

    const contextSummary = `Recent conversation:\n${recentExchange}\n\nBot last replied: ${aiResponse.slice(0, 200)}`;

    await Memory.findOneAndUpdate(
      { userId },
      {
        $set: { contextSummary, updatedAt: new Date() },
        $addToSet: { keyDetails: { $each: keyDetails } },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("Memory update error:", err);
  }
}