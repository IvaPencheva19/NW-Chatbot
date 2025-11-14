import WebSocket, { WebSocketServer } from 'ws';
import { ChatbotService } from '../services/chatbotService';
import { readConfigFile } from '../utils/fileManager';

import { HistoryService } from '../services/historyService';

const history = new HistoryService();
const clients: Record<string, any> = {};


export const initializeWebSocketServer = (server: any) => {
    const wss = new WebSocketServer({ server });
    console.log('WebSocket server initialized');

    wss.on('connection', async (socket: WebSocket) => {
        const sessionId = `session_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`;

        const chatbotConfig = readConfigFile();
        const chatbot = new ChatbotService();

        const startBlockId = chatbotConfig?.start_block || 'welcome';

        await history.startSession(sessionId);

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

            await history.addMessage(
                sessionId,
                'bot',
                startBlock.message,
                startBlock.id
            );

            if (startBlock.next) {
                clients[sessionId].state.currentBlockId = startBlock.next;
            }
        }

        socket.on('message', async (data: WebSocket.RawData) => {
            const userMessage = data.toString();
            const session = clients[sessionId];

            await history.addMessage(
                sessionId,
                'user',
                userMessage,
                session.state.currentBlockId
            );

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
                    await history.addMessage(
                        sessionId,
                        'bot',
                        result.botMessage,
                        result.nextBlockId
                    );
                } else {
                    socket.send(
                        JSON.stringify({
                            type: 'info',
                            message: 'Waiting for your response...'
                        })
                    );
                    await history.addMessage(
                        sessionId,
                        'bot',
                        result.botMessage,
                        result.nextBlockId
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
                await history.addMessage(
                    sessionId,
                    'bot',
                    'Something went wrong while processing your message.',
                    session.state.currentBlockId
                );
            }
        });

        socket.on('close', () => {
            console.log(`Client disconnected: ${sessionId}`);
            delete clients[sessionId];
        });
    });
};
