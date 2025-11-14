import restify from 'restify';
import { initializeWebSocketServer } from './controllers/websocketController';
import { historyRoutes } from './routes/historyRoutes';
import { chatbotConfigRoutes } from './routes/chatbotConfigRoutes';
import mongoose from 'mongoose';


const server = restify.createServer({
    name: 'ChatbotBackend',
    version: '1.0.0'
});

server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

historyRoutes(server);
chatbotConfigRoutes(server);


const PORT = process.env.PORT || 4000;
const httpServer = server.listen(PORT, () => {
    console.log(`Restify server is running on port ${PORT}`);
});

initializeWebSocketServer(httpServer);


mongoose
    .connect(process.env.MONGO_URL || 'mongodb://localhost:27017/chatbot')
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB error:", err));
