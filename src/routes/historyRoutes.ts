import { Server } from 'restify';
import * as historyController from '../controllers/historyController';

export const historyRoutes = (server: Server) => {

    server.get('/history', (req, res, next) =>
        historyController.getAllSessions(req, res, next)
    );

    server.get('/history/:sessionId', (req, res, next) =>
        historyController.getSessionHistory(req, res, next)
    );

    server.get('/history/:sessionId/paginated', (req, res, next) =>
        historyController.getPaginated(req, res, next)
    );
};
