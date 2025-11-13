import WebSocket, { WebSocketServer } from 'ws';
import { ChatbotService } from '../services/chatbotService';
import { readConfigFile } from '../utils/fileManager';

interface ClientSession {
    id: string;
    socket: WebSocket;
    chatbot: ChatbotService;
    state: {
        currentBlockId: string;
        history: Array<{ sender: 'user' | 'bot'; message: string }>;
    };
}

const clients: Record<string, ClientSession> = {};

export const initializeWebSocketServer = (server: any) => {
    const wss = new WebSocketServer({ server });
    console.log('WebSocket server initialized');

    wss.on('connection', (socket: WebSocket) => {
        const sessionId = `session_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`;

        const chatbotConfig = readConfigFile();
        const chatbot = new ChatbotService();

        const startBlockId = chatbotConfig?.start_block || 'welcome';

        clients[sessionId] = {
            id: sessionId,
            socket,
            chatbot,
            state: {
                currentBlockId: startBlockId,
                history: []
            }
        };

        console.log(`Client connected: ${sessionId}`);


        const startBlock = chatbotConfig.blocks[startBlockId];
        console.log("Start block", startBlock)

        if (startBlock && startBlock.type === 'write_message') {
            socket.send(
                JSON.stringify({
                    type: 'bot_message',
                    message: startBlock.message
                })
            );

            if (startBlock.next) {
                clients[sessionId].state.currentBlockId = startBlock.next;
            }
        }

        socket.on('message', async (data: WebSocket.RawData) => {
            const userMessage = data.toString();
            const session = clients[sessionId];

            try {
                const result = await session.chatbot.processMessage(
                    session.state,
                    userMessage
                );

                session.state.currentBlockId = result.nextBlockId;

                if (result.botMessage) {
                    socket.send(
                        JSON.stringify({
                            type: 'bot_message',
                            message: result.botMessage
                        })
                    );
                } else {
                    socket.send(
                        JSON.stringify({
                            type: 'info',
                            message: 'Waiting for your response...'
                        })
                    );
                }
            } catch (err) {
                console.error('Chatbot processing error:', err);
                socket.send(
                    JSON.stringify({
                        type: 'error',
                        message: 'Something went wrong while processing your message.'
                    })
                );
            }
        });

        socket.on('close', () => {
            console.log(`Client disconnected: ${sessionId}`);
            delete clients[sessionId];
        });
    });
};
