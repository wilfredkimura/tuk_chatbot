import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";
import Memory from "@/models/Memory";
import systemPromptData from "@/lib/system_prompt.json";

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    // Connect to DB
    await dbConnect();

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

    // Build system prompt from JSON
    const systemInstruction = systemPromptData.system_instructions + memoryContext;

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: systemInstruction,
    });

    // Convert history for Gemini
    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const aiContent = result.response.text();

    if (!aiContent) {
      return NextResponse.json(
        { error: "Failed to get response from Gemini" },
        { status: 500 }
      );
    }

    // Save the user message and AI response to MongoDB
    if (userId) {
      const lastUserMessage = messages[messages.length - 1]?.content || "";
      if (messages[messages.length - 1]?.role === "user") {
        await Chat.create({
          userId,
          role: "user",
          content: lastUserMessage,
        });
      }

      await Chat.create({
        userId,
        role: "assistant",
        content: aiContent,
      });

      // Update memory: store a rolling summary of key user details
      await updateMemory(userId, messages, aiContent);
    }

    return NextResponse.json({ content: aiContent });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── Memory updater ───────────────────────────────────────────────
async function updateMemory(userId: string, messages: Message[], aiResponse: string) {
  try {
    const lastUserMsg = messages[messages.length - 1]?.content || "";

    // Extract simple key details from the conversation
    const keyDetails: string[] = [];

    // Detect programme interest
    const programmeMatch = lastUserMsg.match(
      /\b(engineering|computer science|IT|information technology|architecture|medicine|nursing|business|law|nursing|biology|chemistry|physics|math)\b/i
    );
    if (programmeMatch) {
      keyDetails.push(`Interested in ${programmeMatch[0]}`);
    }

    // Detect admission-related queries
    if (/admission|apply|application|intake|join|enroll/i.test(lastUserMsg)) {
      keyDetails.push("Asked about admissions");
    }

    // Detect fee-related queries
    if (/fee|fees|cost|payment|scholarship/i.test(lastUserMsg)) {
      keyDetails.push("Asked about fees or funding");
    }

    // Build a short context summary from the last few exchanges
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
    // Non-critical — don't let memory errors break the response
    console.error("Memory update error:", err);
  }
}