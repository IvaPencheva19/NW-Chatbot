import { Server } from 'restify';
import { chatbotConfigController } from '../controllers/chatbotConfigController';

export const chatbotConfigRoutes = (server: Server) => {

    server.get(
        '/chatbot/config',
        (req, res, next) => chatbotConfigController.getChatbotConfig(req, res, next)
    );

    server.post(
        '/chatbot/config',
        (req, res, next) => chatbotConfigController.uploadChatbotConfig(req, res, next)
    );
};
