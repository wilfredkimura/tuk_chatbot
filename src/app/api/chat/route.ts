import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";
import Memory from "@/models/Memory";
import systemPrompt from "@/lib/system_prompt.json";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    const { messages, userId: providedUserId } = await req.json();
    
    // Identify user (Session or Guest)
    const userId = session?.user?.email || providedUserId || "anonymous";

    if (!messages || messages.length === 0) {
       return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1].content;

    await dbConnect();

    // 1. Fetch Memory (Context from past conversations)
    const userMemory = await Memory.findOne({ userId });
    const memoryContext = userMemory?.contextSummary || "No previous interaction history found.";

    // 2. Store current user message in DB
    await Chat.create({ userId, role: "user", content: lastMessage });

    // 3. Fetch last few messages for immediate context
    const history = await Chat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();
    
    const recentHistory = history.reverse().map((msg: any) => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join("\n");

    // 4. Construct System Prompt with Long-term Memory
    const fullPrompt = `
${systemPrompt.system_instructions}

Long-term Memory (Past Interactions):
${memoryContext}

Knowledge Base (TUK):
- Name: ${systemPrompt.university_data.official_name}
- Mission: ${systemPrompt.university_data.mission}
- Faculties: ${systemPrompt.university_data.faculties.map(f => f.name).join(", ")}
- Portals: Student (${systemPrompt.university_data.portals.student})

Recent Conversation:
${recentHistory}

User's Latest Request: ${lastMessage}

Respond naturally as ${systemPrompt.name}. After your response, on a NEW LINE starting with "MEMORY_UPDATE:", provide a brief 1-sentence summary of what you learned about the user or the topic discussed to update the long-term memory.
    `;

    // 5. Generate response
    const aiResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fullPrompt,
    });

    const fullText = aiResponse.text || "";
    
    // Separate bot response from memory update instruction
    const parts = fullText.split("MEMORY_UPDATE:");
    const botReply = parts[0].trim();
    const newContextSnippet = parts[1]?.trim() || "";

    // 6. Store bot response in DB
    await Chat.create({ userId, role: "assistant", content: botReply });

    // 7. Update Long-term Memory
    if (newContextSnippet) {
       const updatedSummary = `${memoryContext}\n- ${newContextSnippet}`.slice(-1000); // Keep last 1000 chars
       await Memory.findOneAndUpdate(
         { userId },
         { 
           contextSummary: updatedSummary,
           updatedAt: new Date()
         },
         { upsert: true }
       );
    }

    return NextResponse.json({ content: botReply });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
