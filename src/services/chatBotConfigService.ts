import { ChatbotConfigModel } from '../models/chatbotConfigModel';

export const getConfig = async (id: string) => {
    return await ChatbotConfigModel.findOne({ id }).lean();
};

export const updateConfig = async (id: string, newConfig: any) => {
    return await ChatbotConfigModel.findOneAndUpdate(
        { id },
        newConfig,
        { upsert: true, new: true }
    );
};
