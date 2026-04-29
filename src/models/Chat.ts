import mongoose, { Schema, model, models } from "mongoose";

const ChatSchema = new Schema({
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, index: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Chat = models.Chat || model("Chat", ChatSchema);

export default Chat;
