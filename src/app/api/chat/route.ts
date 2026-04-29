import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";
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

    const lastMessage = messages[messages.length - 1].content;

    await dbConnect();

    // 1. Store user message in DB
    await Chat.create({ userId, role: "user", content: lastMessage });

    // 2. Fetch last 10 messages for memory context
    const history = await Chat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    const memory = history.reverse().map((msg: any) => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join("\n");

    // 3. Construct the System-Aware Prompt
    const fullPrompt = `
${systemPrompt.system_instructions}

Knowledge Base (Technical University of Kenya):
- Name: ${systemPrompt.university_data.official_name}
- Mission: ${systemPrompt.university_data.mission}
- Vision: ${systemPrompt.university_data.vision}
- Location: ${systemPrompt.university_data.location}
- Motto: ${systemPrompt.university_data.motto}
- Faculties: ${systemPrompt.university_data.faculties.map(f => f.name).join(", ")}
- Portals: Student (${systemPrompt.university_data.portals.student}), Staff (${systemPrompt.university_data.portals.staff})

Constraints:
${systemPrompt.constraints.join("\n")}

Conversation context:
${memory}

User's latest request: ${lastMessage}

Respond as ${systemPrompt.name}:
    `;

    // 4. Generate response using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fullPrompt,
    });

    const botReply = response.text;

    // 5. Store bot response in DB
    await Chat.create({ userId, role: "assistant", content: botReply });

    return NextResponse.json({ content: botReply });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
