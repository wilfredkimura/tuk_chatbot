import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Chat from "@/models/Chat";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const userId = req.nextUrl.searchParams.get("userId");
    let sessionId = req.nextUrl.searchParams.get("sessionId");
    
    if (sessionId) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(sessionId);
      const query = isObjectId 
        ? { _id: sessionId } 
        : { sessionId };

      const messages = await Chat.find(query).sort({ createdAt: 1 });
      
      // If we only found one legacy message, also include the assistant's reply if it exists
      if (messages.length === 1 && isObjectId) {
        const assistantReply = await Chat.findOne({
          userId: messages[0].userId,
          role: "assistant",
          createdAt: { $gt: messages[0].createdAt }
        }).sort({ createdAt: 1 });
        if (assistantReply) messages.push(assistantReply);
      }

      return NextResponse.json({ messages });
    }

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Fetch unique sessions for this user using aggregation
    const pastConvos = await Chat.aggregate([
      { $match: { userId, role: "user" } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          // If sessionId exists, group by it. If not, treat each message as its own session.
          _id: { $ifNull: ["$sessionId", { $toString: "$_id" }] },
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
