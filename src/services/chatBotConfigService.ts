import { ChatbotConfigModel } from '../models/chatbotConfigModel';


//Fetch chatbot config from DB
export const getConfig = async (id: string) => {
    return await ChatbotConfigModel.findOne({ id }).lean();
};

//Create new/update chatbot config in DB
export const updateConfig = async (id: string, newConfig: any) => {
    return await ChatbotConfigModel.findOneAndUpdate(
        { id },
        newConfig,
        { upsert: true, new: true }
    );
};
