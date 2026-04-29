import mongoose, { Schema, model, models } from "mongoose";

const MemorySchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  contextSummary: { type: String, default: "" },
  keyDetails: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

const Memory = models.Memory || model("Memory", MemorySchema);

export default Memory;
