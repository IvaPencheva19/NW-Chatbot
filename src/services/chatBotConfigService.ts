// src/services/chatbotConfig.service.ts
import { ChatbotConfigModel } from '../types/chatbotConfigModel';

export class ChatbotConfigService {
    async getConfig(id: string) {
        return await ChatbotConfigModel.findOne({ id }).lean();
    }

    async updateConfig(id: string, newConfig: any) {
        return await ChatbotConfigModel.findOneAndUpdate(
            { id },
            newConfig,
            { upsert: true, new: true }
        );
    }
}
