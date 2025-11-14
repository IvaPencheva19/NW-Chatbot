import { Request, Response, Next } from 'restify';
import { HistoryService } from '../services/historyService';

const historyService = new HistoryService();

export class HistoryController {

    async getSessionHistory(req: Request, res: Response, next: Next) {
        try {
            const sessionId = req.params.sessionId;
            const data = await historyService.getHistory(sessionId);

            if (!data) {
                res.send(404, { error: "Session not found" });
                return next();
            }

            res.send(200, data);
            return next();
        } catch (err) {
            console.error("Error fetching session:", err);
            res.send(500, { error: "Failed to load session history" });
            return next();
        }
    }

    async getAllSessions(req: Request, res: Response, next: Next) {
        try {
            const sessions = await historyService.getAllSessions();
            res.send(200, sessions);
            return next();
        } catch (err) {
            console.error("Error fetching sessions:", err);
            res.send(500, { error: "Failed to fetch sessions" });
            return next();
        }
    }

    async getPaginated(req: Request, res: Response, next: Next) {
        try {
            const sessionId = req.params.sessionId;
            const skip = Number(req.query.skip || 0);
            const limit = Number(req.query.limit || 20);

            const result = await historyService.getConversationPaginated(
                sessionId,
                skip,
                limit
            );

            if (!result) {
                res.send(404, { error: "Session not found" });
                return next();
            }

            res.send(200, result);
            return next();
        } catch (err) {
            console.error("Error fetching paginated history:", err);
            res.send(500, { error: "Failed to load paginated history" });
            return next();
        }
    }
}

export const historyController = new HistoryController();
