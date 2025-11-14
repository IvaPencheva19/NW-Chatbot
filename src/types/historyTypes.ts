import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
    sender: 'user' | 'bot';
    message: string;
    blockId: string;
    timestamp: Date;
}

export interface IConversation extends Document {
    sessionId: string;
    messages: IMessage[];
}

const MessageSchema = new Schema<IMessage>({
    sender: { type: String, enum: ['user', 'bot'], required: true },
    message: { type: String, required: true },
    blockId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const ConversationSchema = new Schema<IConversation>({
    sessionId: { type: String, required: true, unique: true },
    messages: { type: [MessageSchema], default: [] }
});

export const ConversationModel =
    mongoose.model<IConversation>('Conversation', ConversationSchema);
