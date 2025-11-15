import mongoose, { Schema, Document } from 'mongoose';

export interface Message {
    sender: 'user' | 'bot';
    message: string;
    blockId: string;
    timestamp: Date;
}

export interface Conversation extends Document {
    sessionId: string;
    messages: Message[];
}

const MessageSchema = new Schema<Message>({
    sender: { type: String, enum: ['user', 'bot'], required: true },
    message: { type: String, required: true },
    blockId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const ConversationSchema = new Schema<Conversation>({
    sessionId: { type: String, required: true, unique: true },
    messages: { type: [MessageSchema], default: [] }
});

export const ConversationModel =
    mongoose.model<Conversation>('Conversation', ConversationSchema);
