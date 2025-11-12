import { Request, Response, Next } from 'restify';
import { readConfigFile, writeConfigFile } from '../utils/fileManager';

export const getChatbotConfig = (req: Request, res: Response, next: Next) => {
    const config = readConfigFile();

    if (!config) {
        res.send(500, { error: 'Failed to load chatbot configuration.' });
        return next();
    }

    res.send(200, config);
    return next();
};

export const uploadChatbotConfig = (req: Request, res: Response, next: Next) => {
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
};
