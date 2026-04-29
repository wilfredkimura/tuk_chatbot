import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const userId = req.nextUrl.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Fetch the last 50 user messages — sidebar shows 6, modal scrolls the rest
    const pastConvos = await Chat.find({ userId, role: "user" })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ convos: pastConvos });
  } catch (error) {
    console.error("History Error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
