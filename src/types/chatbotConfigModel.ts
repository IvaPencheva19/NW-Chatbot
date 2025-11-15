import mongoose, { Schema, model } from 'mongoose';

const ChatbotConfigSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  description: String,
  start_block: String,
  blocks: Schema.Types.Mixed,
});

export const ChatbotConfigModel = model('ChatbotConfig', ChatbotConfigSchema);