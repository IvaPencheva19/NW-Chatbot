import restify from 'restify';
import { getChatbotConfig, uploadChatbotConfig } from './controllers/chatbotConfigController';
import { initializeWebSocketServer } from './controllers/websocketController';

const server = restify.createServer({
    name: 'ChatbotBackend',
    version: '1.0.0'
});

server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

server.get('/config', getChatbotConfig);
server.post('/config', uploadChatbotConfig);

const PORT = process.env.PORT || 4000;
const httpServer = server.listen(PORT, () => {
    console.log(`Restify server is running on port ${PORT}`);
});

initializeWebSocketServer(httpServer);