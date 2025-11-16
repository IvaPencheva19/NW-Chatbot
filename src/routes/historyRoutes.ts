import { Server } from 'restify';
import * as historyController from '../controllers/historyController';

export const historyRoutes = (server: Server) => {

    server.get('/chatbot/history', (req, res, next) =>
        historyController.getAllSessions(req, res, next)
    );

    server.get('/chatbot/history/:sessionId', (req, res, next) =>
        historyController.getSessionHistory(req, res, next)
    );

    server.get('/chatbot/history/:sessionId/paginated', (req, res, next) =>
        historyController.getPaginated(req, res, next)
    );
};
