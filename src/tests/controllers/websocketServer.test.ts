import { WebSocketServer } from 'ws';
import { initializeWebSocketServer } from '../../controllers/websocketController'; // adjust path
import { ChatbotService } from '../../services/chatbotService';
import * as historyService from '../../services/historyService';

jest.mock('ws');
jest.mock('../../services/chatbotService');
jest.mock('../../services/historyService');


describe('WebSocket Server', () => {
    let mockServer: any;
    let mockSocket: any;
    let mockChatbotInstance: any;
    let connectionCallback: (socket: any) => void;

    beforeEach(() => {
        jest.clearAllMocks();

        mockServer = {};

        mockSocket = {
            send: jest.fn(),
            on: jest.fn((event, cb) => {
                if (event === 'message') mockSocket._messageCb = cb;
                if (event === 'close') mockSocket._closeCb = cb;
            })
        };

        mockChatbotInstance = {
            init: jest.fn().mockResolvedValue(undefined),
            processMessage: jest.fn().mockResolvedValue({
                nextBlockId: 'next_block',
                botMessage: 'Hello!'
            }),
            config: {
                start_block: 'welcome',
                blocks: {
                    welcome: { type: 'write_message', message: 'Welcome!', id: 'welcome' }
                }
            }
        };
        (ChatbotService as jest.Mock).mockImplementation(() => mockChatbotInstance);

        (WebSocketServer as unknown as jest.Mock).mockImplementation(({ server }) => ({
            on: jest.fn((event, cb) => {
                if (event === 'connection') {
                    connectionCallback = cb;
                }
            })
        }));

        (historyService.startSession as jest.Mock).mockResolvedValue(undefined);
        (historyService.addMessage as jest.Mock).mockResolvedValue(undefined);
    });

    it('should initialize WebSocket server and handle client connection', async () => {
        await initializeWebSocketServer(mockServer);

        await connectionCallback(mockSocket);

        await new Promise(process.nextTick);

        expect(mockChatbotInstance.init).toHaveBeenCalled();
        expect(historyService.startSession).toHaveBeenCalled();
        expect(mockSocket.send).toHaveBeenCalledWith(
            JSON.stringify({ type: 'bot_message', message: 'Welcome!' })
        );

        await mockSocket._messageCb('User message');
        expect(mockChatbotInstance.processMessage).toHaveBeenCalled();
        expect(mockSocket.send).toHaveBeenCalledWith(
            JSON.stringify({ type: 'bot_message', message: 'Hello!' })
        );

        mockSocket._closeCb();
    });

    it('should handle chatbot processing errors gracefully', async () => {
        mockChatbotInstance.processMessage.mockRejectedValueOnce(new Error('Test error'));
        await initializeWebSocketServer(mockServer);

        await connectionCallback(mockSocket);
        await new Promise(process.nextTick);

        await mockSocket._messageCb('Error message');

        expect(mockSocket.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: 'error',
                message: 'Something went wrong while processing your message.'
            })
        );

        expect(historyService.addMessage).toHaveBeenCalledWith(
            expect.any(String),
            'bot',
            'Something went wrong while processing your message.',
            expect.any(String)
        );
    });
});