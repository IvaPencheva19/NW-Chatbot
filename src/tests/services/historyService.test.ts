import * as historyService from '../../services/historyService';
import { ConversationModel } from '../../models/historyModel';

jest.mock('../../models/historyModel');

describe('historyService', () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    describe('startSession', () => {
        it('should create a new session if it does not exist', async () => {
            (ConversationModel.findOne as jest.Mock).mockResolvedValue(null);
            (ConversationModel.create as jest.Mock).mockResolvedValue({ sessionId: '123', messages: [] });

            await historyService.startSession('123');

            expect(ConversationModel.findOne).toHaveBeenCalledWith({ sessionId: '123' });
            expect(ConversationModel.create).toHaveBeenCalledWith({
                sessionId: '123',
                messages: []
            });
        });

        it('should not create a session if it already exists', async () => {
            (ConversationModel.findOne as jest.Mock).mockResolvedValue({ sessionId: '123', messages: [] });
            (ConversationModel.create as jest.Mock).mockResolvedValue(null);

            await historyService.startSession('123');

            expect(ConversationModel.findOne).toHaveBeenCalledWith({ sessionId: '123' });
            expect(ConversationModel.create).not.toHaveBeenCalled();
        });
    });

    describe('addMessage', () => {
        it('should add a message to the session', async () => {
            (ConversationModel.updateOne as jest.Mock).mockResolvedValue({ acknowledged: true });

            const RealDate = Date;
            const now = new RealDate('2025-01-01T00:00:00Z');
            jest.spyOn(global, 'Date').mockImplementation(() => now);

            await historyService.addMessage('123', 'user', 'Hello', 'block1');

            expect(ConversationModel.updateOne).toHaveBeenCalledWith(
                { sessionId: '123' },
                {
                    $push: {
                        messages: {
                            sender: 'user',
                            message: 'Hello',
                            blockId: 'block1',
                            timestamp: now
                        }
                    }
                }
            );

            jest.restoreAllMocks();
        });
    });

    describe('getHistory', () => {
        it('should return the full session history', async () => {
            const mockSession = { sessionId: '123', messages: [{ sender: 'user', message: 'Hi' }] };
            (ConversationModel.findOne as jest.Mock).mockResolvedValue(mockSession);

            const result = await historyService.getHistory('123');

            expect(ConversationModel.findOne).toHaveBeenCalledWith({ sessionId: '123' });
            expect(result).toEqual(mockSession);
        });
    });

    describe('getAllSessions', () => {
        it('should return all sessions sorted by most recent message', async () => {
            const mockSessions = [
                { sessionId: '1', messages: [] },
                { sessionId: '2', messages: [] }
            ];
            const sortMock = jest.fn().mockResolvedValue(mockSessions);
            (ConversationModel.find as jest.Mock).mockReturnValue({ sort: sortMock });

            const result = await historyService.getAllSessions();

            expect(ConversationModel.find).toHaveBeenCalledWith({}, { sessionId: 1, messages: 1 });
            expect(sortMock).toHaveBeenCalledWith({ 'messages.timestamp': -1 });
            expect(result).toEqual(mockSessions);
        });
    });

    describe('getConversationPaginated', () => {
        it('should return a paginated slice of messages', async () => {
            const mockSession = {
                sessionId: '123',
                messages: [
                    { sender: 'user', message: 'msg1' },
                    { sender: 'bot', message: 'msg2' }
                ]
            };

            (ConversationModel.findOne as jest.Mock).mockResolvedValue(mockSession);

            const result = await historyService.getConversationPaginated('123', 0, 2);

            expect(ConversationModel.findOne).toHaveBeenCalledWith(
                { sessionId: '123' },
                { messages: { $slice: [0, 2] } }
            );
            expect(result).toEqual(mockSession);
        });
    });
});
