import { Request, Response, Next } from 'restify';
import { readConfigFile, writeConfigFile } from '../utils/fileManager';

export class ChatbotConfigController {

    getChatbotConfig(req: Request, res: Response, next: Next) {
        try {
            const config = readConfigFile();

            if (!config) {
                res.send(500, { error: 'Failed to load chatbot configuration.' });
                return next();
            }

            res.send(200, config);
            return next();
        } catch (err) {
            console.error("Error loading chatbot config:", err);
            res.send(500, { error: 'Server error while loading chatbot configuration.' });
            return next();
        }
    }

    uploadChatbotConfig(req: Request, res: Response, next: Next) {
        try {
            const newConfig = req.body;

            if (!newConfig || typeof newConfig !== 'object') {
                res.send(400, { error: 'Invalid or missing JSON body.' });
                return next();
            }

            const writeSuccess = writeConfigFile(newConfig);

            if (!writeSuccess) {
                res.send(500, { error: 'Failed to save chatbot configuration.' });
                return next();
            }

            res.send(200, { message: 'Chatbot configuration saved successfully.' });
            return next();
        } catch (err) {
            console.error("Error saving chatbot config:", err);
            res.send(500, { error: 'Server error while saving chatbot configuration.' });
            return next();
        }
    }
}

export const chatbotConfigController = new ChatbotConfigController();
