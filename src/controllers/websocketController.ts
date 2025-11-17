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

//Initialize WebSocket server
export const initializeWebSocketServer = (server: any) => {
    const wss = new WebSocketServer({ server });
    console.log('WebSocket server initialized');

    wss.on('connection', async (socket: WebSocket) => {
        const sessionId = generateSessionId();
        const chatbot = new ChatbotService();
        try {
            await chatbot.init();
        } catch (error) {
            console.error("Failed to initialize chatbot:", error);

            socket.send(JSON.stringify({
                type: "error",
                message: "Chatbot configuration not found."
            }));

            socket.close();
            return;
        }

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

            const parsed = JSON.parse(data.toString());

            console.log("parsed ", parsed.type)

            if (parsed.type === 'reset') {
                return resetConversation(client);
            }

            await handleUserMessage(client, parsed.message);
        });

        socket.on('close', () => {
            console.log(`Client disconnected: ${sessionId}`);
            delete clients[sessionId];
        });
    });
};


const generateSessionId = () =>
    `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;


//Send initial chatbot message
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

//Handle user message
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

//Reset conversation with chatbot
const resetConversation = async (client: Client) => {
    const { chatbot, id: sessionId } = client;

    client.state = chatbot.createInitialState();

    const startBlock = chatbot["config"].blocks[client.state.currentBlockId];

    await historyService.startSession(sessionId);
    await historyService.addMessage(sessionId, 'bot', startBlock.message, client.state.currentBlockId);
};
