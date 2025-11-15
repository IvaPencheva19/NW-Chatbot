import { Schema, model, Document } from 'mongoose';
import { BaseBlock } from './chatbotTypes';

export interface ChatbotConfig extends Document {
  id: string;
  name?: string;
  description?: string;
  start_block?: string;
  blocks?: BaseBlock;
}

const ChatbotConfigSchema = new Schema<ChatbotConfig>({
  id: { type: String, required: true, unique: true },
  name: { type: String },
  description: { type: String },
  start_block: { type: String },
  blocks: { type: Schema.Types.Mixed },
});

export const ChatbotConfigModel = model<ChatbotConfig>('ChatbotConfig', ChatbotConfigSchema);
