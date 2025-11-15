import { Request, Response } from 'restify';
import { ChatbotConfigService } from '../services/chatBotConfigService';

const service = new ChatbotConfigService();

export const getChatbotConfig = async (req: Request, res: Response) => {
    try {
        const config = await service.getConfig('travel_assistant_v1');
        if (!config) return res.send(404, { error: 'Config not found' });
        res.send(200, config);
    } catch (err) {
        console.error(err);
        res.send(500, { error: 'Failed to load config' });
    }
};

export const uploadChatbotConfig = async (req: Request, res: Response) => {
    try {
        const body = req.body;
        if (!body || typeof body !== 'object') return res.send(400, { error: 'Invalid body' });
        await service.updateConfig('travel_assistant_v1', body);
        res.send(200, { message: 'Config saved' });
    } catch (err) {
        console.error(err);
        res.send(500, { error: 'Failed to save config' });
    }
};
