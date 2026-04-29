import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const userId = req.nextUrl.searchParams.get("userId");
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    
    if (sessionId) {
      // Fetch all messages for a specific session
      const messages = await Chat.find({ sessionId }).sort({ createdAt: 1 });
      return NextResponse.json({ messages });
    }

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Fetch unique sessions for this user using aggregation
    // We get the first 'user' message for each unique sessionId to use as the title
    const pastConvos = await Chat.aggregate([
      { $match: { userId, role: "user" } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$sessionId",
          content: { $first: "$content" },
          createdAt: { $first: "$createdAt" },
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 50 }
    ]);

    return NextResponse.json({ convos: pastConvos });
  } catch (error) {
    console.error("History Error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
