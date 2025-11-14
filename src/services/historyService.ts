import { ConversationModel } from '../types/historyTypes';

export class HistoryService {

    /** Create session if it does not exist */
    async startSession(sessionId: string) {
        const existing = await ConversationModel.findOne({ sessionId });

        if (!existing) {
            await ConversationModel.create({
                sessionId,
                messages: []
            });
        }
    }

    /** Add a user/bot message to a session */
    async addMessage(
        sessionId: string,
        sender: 'user' | 'bot',
        message: string,
        blockId: string
    ) {
        await ConversationModel.updateOne(
            { sessionId },
            {
                $push: {
                    messages: {
                        sender,
                        message,
                        blockId,
                        timestamp: new Date()
                    }
                }
            }
        );
    }

    /** Get full history for a session */
    async getHistory(sessionId: string) {
        return ConversationModel.findOne({ sessionId });
    }

    /** List all sessions (sorted by most recent message) */
    async getAllSessions() {
        return ConversationModel
            .find({}, { sessionId: 1, messages: 1 })
            .sort({ "messages.timestamp": -1 });
    }

    /** Paginated conversation */
    async getConversationPaginated(
        sessionId: string,
        skip = 0,
        limit = 20
    ) {
        const result = await ConversationModel.findOne(
            { sessionId },
            {
                messages: { $slice: [skip, limit] }
            }
        );

        return result;
    }

}
