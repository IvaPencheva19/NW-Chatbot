import WebSocket, { WebSocketServer } from 'ws';
import { readConfigFile } from '../utils/fileManager';

interface ClientSession {
    id: string;
    socket: WebSocket;
    state: {
        currentBlockId?: string;
        history: Array<{ sender: 'user' | 'bot'; message: string }>;
    };
}

const clients: Record<string, ClientSession> = {};

export const initializeWebSocketServer = (server: any) => {
    const wss = new WebSocketServer({ server });

    console.log('WebSocket server initialized');

    wss.on('connection', (socket: WebSocket) => {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const chatbotConfig = readConfigFile();

        clients[sessionId] = {
            id: sessionId,
            socket,
            state: {
                currentBlockId: chatbotConfig?.start_block || null,
                history: []
            }
        };

        console.log(`Client connected: ${sessionId}`);

        if (chatbotConfig && chatbotConfig.start_block) {
            const startBlock = chatbotConfig.blocks[chatbotConfig.start_block];
            if (startBlock && startBlock.type === 'write_message') {
                socket.send(JSON.stringify({
                    type: 'bot_message',
                    message: startBlock.message
                }));
            }
        }

        socket.on('message', (data: WebSocket.RawData) => {
            const message = data.toString();
            console.log(`Message from ${sessionId}:`, message);

            socket.send(JSON.stringify({
                type: 'bot_message',
                message: `User message ${message}`
            }));

        });

        socket.on('close', () => {
            console.log(`Client disconnected: ${sessionId}`);
            delete clients[sessionId];
        });

        socket.on('error', (err) => {
            console.error(`WebSocket error for ${sessionId}:`, err);
        });
    });
};
