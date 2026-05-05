import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Chat from "@/models/Chat";
import Memory from "@/models/Memory";
import systemPromptData from "@/constants/systemPrompt.json";
import { getRelevantContext } from "@/lib/rag/retriever";
import { ai } from "@/services/aiService";

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

    await dbConnect();
    const sessionId = incomingSessionId || crypto.randomUUID();
    const userMessage = messages[messages.length - 1]?.content || "";

    // OPTIMIZATION: Skip RAG for short greetings
    const isGreeting = userMessage.length < 15 && /^(hello|hi|hey|how are you|good morning|good afternoon|good evening|yo|hola|greetings)/i.test(userMessage);

    // Limit RAG context to top 2 results and max 3000 chars to save tokens
    const relevantContext = isGreeting ? "" : await getRelevantContext(userMessage, 2);

    let memoryContext = "";
    if (userId) {
      const memory = await Memory.findOne({ userId });
      if (memory?.contextSummary) {
        memoryContext = `\n\n## User Context\n${memory.contextSummary}`;
        if (memory.keyDetails?.length > 0) {
          memoryContext += `\nKey details: ${memory.keyDetails.slice(-5).join(", ")}`;
        }
      }
    }

    const systemInstruction = systemPromptData.system_instructions + "\n\n" + (relevantContext ? `### RELEVANT INFO:\n${relevantContext}` : "") + memoryContext;

    // LIMIT HISTORY: Only send last 6 messages to keep prompt size small
    const recentMessages = messages.slice(-6);
    const contents = recentMessages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // Start generating streaming response with retry logic
    const MODELS = ["gemini-3-flash-preview", "gemini-2.5-flash"];
    let streamResult: any = null;
    let lastError: any = null;

    for (const model of MODELS) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          streamResult = await ai.models.generateContentStream({
            model,
            contents: contents,
            config: {
              systemInstruction: systemInstruction.slice(0, 5000) // Safety cap
            }
          });
          break; // success
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code;
          if (status === 503 || status === 429) {
            console.warn(`[Gemini] ${model} attempt ${attempt}/2 failed (${status}). Retrying...`);
            await new Promise((r) => setTimeout(r, 1000 * attempt));
            continue;
          }
          if (status === 404) {
            console.warn(`[Gemini] ${model} not found, trying next model...`);
            break; // skip to next model
          }
          throw err; // non-retryable error
        }
      }
      if (streamResult) break;
    }

    if (!streamResult) {
      throw lastError || new Error("All Gemini models unavailable");
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";
        let finalUsage: any = null;

        try {
          for await (const chunk of streamResult) {
            const text = chunk.text || "";
            if (text) {
              fullText += text;
              controller.enqueue(encoder.encode(text));
            }
            if (chunk.usageMetadata) {
              finalUsage = chunk.usageMetadata;
            }
          }

          if (finalUsage) {
            console.log(`[Token Usage] Prompt: ${finalUsage.promptTokenCount}, Completion: ${finalUsage.candidatesTokenCount}, Total: ${finalUsage.totalTokenCount}`);
          }

          if (userId) {
            (async () => {
              try {
                if (messages[messages.length - 1]?.role === "user") {
                  await Chat.create({ 
                    userId, 
                    sessionId, 
                    role: "user", 
                    content: userMessage,
                    usage: {
                      promptTokens: finalUsage?.promptTokenCount || 0,
                      totalTokens: finalUsage?.promptTokenCount || 0
                    }
                  });
                }
                await Chat.create({ 
                  userId, 
                  sessionId, 
                  role: "assistant", 
                  content: fullText,
                  usage: {
                    promptTokens: finalUsage?.promptTokenCount || 0,
                    completionTokens: finalUsage?.candidatesTokenCount || 0,
                    totalTokens: finalUsage?.totalTokenCount || 0
                  }
                });
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

async function updateMemory(userId: string, messages: any[], aiResponse: string) {
  try {
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const keyDetails: string[] = [];

    const keywords = ["engineering", "computer science", "IT", "architecture", "medicine", "nursing", "business", "law"];
    keywords.forEach(kw => {
      if (lastUserMsg.toLowerCase().includes(kw)) keyDetails.push(`Interested in ${kw}`);
    });

    if (/admission|apply|application|intake|join|enroll/i.test(lastUserMsg)) {
      keyDetails.push("Asked about admissions");
    }

    const recentExchange = messages
      .slice(-2)
      .map((m) => `${m.role === "user" ? "Student" : "Bot"}: ${m.content.slice(0, 100)}`)
      .join("\n");

    const contextSummary = `Last exchange:\n${recentExchange}\nBot: ${aiResponse.slice(0, 150)}`;

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