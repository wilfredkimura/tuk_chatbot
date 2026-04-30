import mongoose, { Schema, Document } from "mongoose";

export interface IKnowledge extends Document {
  content: string;
  category: string;
  embedding: number[];
  createdAt: Date;
}

const KnowledgeSchema: Schema = new Schema({
  content: { type: String, required: true },
  category: { type: String, required: true },
  embedding: { type: [Number], required: true },
  createdAt: { type: Date, default: Date.now },
});

// For local similarity search if Vector Index is not set up
// We can still use this to store and retrieve
export default mongoose.models.Knowledge || mongoose.model<IKnowledge>("Knowledge", KnowledgeSchema);
