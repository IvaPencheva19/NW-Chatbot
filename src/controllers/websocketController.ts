import WebSocket, { WebSocketServer } from 'ws';
import { ChatbotService } from '../services/chatbotService';
import * as historyService from '../services/historyService';

interface Client {
    id: string;
    socket: WebSocket;
    chatbot: ChatbotService;
    state: {
        currentBlockId: string;
        history: any[];
    };
}

const clients: Record<string, Client> = {};

export const initializeWebSocketServer = (server: any) => {
    const wss = new WebSocketServer({ server });
    console.log('WebSocket server initialized');

    wss.on('connection', async (socket: WebSocket) => {
        const sessionId = generateSessionId();
        const chatbot = new ChatbotService();
        await chatbot.init();

        const startBlockId = chatbot['config'].start_block || 'welcome';
        await historyService.startSession(sessionId);

        const client: Client = {
            id: sessionId,
            socket,
            chatbot,
            state: {
                currentBlockId: startBlockId,
                history: []
            }
        };

        clients[sessionId] = client;
        console.log(`Client connected: ${sessionId}`);

        await sendStartBlockMessage(client);

        socket.on('message', async (data: WebSocket.RawData) => {
            await handleUserMessage(client, data.toString());
        });

        socket.on('close', () => {
            console.log(`Client disconnected: ${sessionId}`);
            delete clients[sessionId];
        });
    });
};


const generateSessionId = () =>
    `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const sendStartBlockMessage = async (client: Client) => {
    const startBlock = client.chatbot['config'].blocks.welcome;

    if (!startBlock || startBlock.type !== 'write_message') return;

    client.socket.send(
        JSON.stringify({
            type: 'bot_message',
            message: startBlock.message
        })
    );

    await historyService.addMessage(
        client.id,
        'bot',
        startBlock.message,
        startBlock.id
    );

    if (startBlock.next) {
        client.state.currentBlockId = startBlock.next;
    }
};

const handleUserMessage = async (client: Client, userMessage: string) => {
    const { id: sessionId, state, chatbot, socket } = client;

    await historyService.addMessage(sessionId, 'user', userMessage, state.currentBlockId);

    try {
        const result = await chatbot.processMessage(state, userMessage);
        state.currentBlockId = result.nextBlockId;

        const botMessage = result.botMessage || 'Waiting for your response...';

        socket.send(
            JSON.stringify({
                type: result.botMessage ? 'bot_message' : 'info',
                message: botMessage
            })
        );

        await historyService.addMessage(sessionId, 'bot', botMessage, result.nextBlockId);
    } catch (err) {
        console.error('Chatbot processing error:', err);
        const errorMessage = 'Something went wrong while processing your message.';
        socket.send(JSON.stringify({ type: 'error', message: errorMessage }));
        await historyService.addMessage(sessionId, 'bot', errorMessage, state.currentBlockId);
    }
};
