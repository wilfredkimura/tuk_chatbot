import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).email; // Use email as unique identifier for now

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    await dbConnect();

    // 1. Store user message in DB
    await Chat.create({ userId, role: "user", content: lastMessage });

    // 2. Fetch last 10 messages for memory
    const history = await Chat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Reverse to get chronological order
    const memory = history.reverse().map((msg: any) => 
      `${msg.role === 'user' ? 'User' : 'Bot'}: ${msg.content}`
    ).join("\n");

    const fullPrompt = `
      You are the "College Bot". 
      Here is the recent conversation history for context:
      ${memory}
      
      User's latest message: ${lastMessage}
      
      Respond as the College Bot:
    `;

    // 3. Generate response
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fullPrompt,
    });

    const botReply = response.text;

    // 4. Store bot response in DB
    await Chat.create({ userId, role: "assistant", content: botReply });

    return NextResponse.json({ content: botReply });
  } catch (error) {
    console.error("Gemini/DB Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch response" },
      { status: 500 }
    );
  }
}
