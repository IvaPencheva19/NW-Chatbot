import { Server } from 'restify';
import * as chatbotConfigController from '../controllers/chatbotConfigController';

export const chatbotConfigRoutes = (server: Server) => {

    server.get('/chatbot/config', async (req, res) => {
        await chatbotConfigController.getChatbotConfig(req, res);
    });

    server.post('/chatbot/config', async (req, res) => {
        await chatbotConfigController.uploadChatbotConfig(req, res);
    });
};
