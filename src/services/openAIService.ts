import OpenAI from "openai";
import dotenv from "dotenv";
import { ChatbotIntent } from "../models/chatbotTypes";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


/* OpenAI integration. Detect user intent. */
export const detectIntent = async (
    userMessage: string,
    intents: ChatbotIntent[]
): Promise<ChatbotIntent | null> => {
    try {
        const intentNames = intents.map((i) => i.name);

        const intentExamples = intents
            .map((i) => `${i.name}: ${i.examples.join(", ")}`)
            .join("\n");

        const prompt = `You are an AI assistant that classifies user intents. 
        Here are the possible intents and example phrases: ${intentExamples}. User said: "${userMessage}".
        Respond with only the name of the intent that best matches, or "unknown" if unsure.
        Possible intents: ${intentNames.join(", ")}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",  //use better version for better results
            messages: [
                { role: "system", content: "You are a precise intent detection AI." },
                { role: "user", content: prompt },
            ],
            temperature: 0,
        });


        const reply = response.choices[0]?.message?.content?.trim().toLowerCase();

        const matched = intents.find((intent) =>
            reply?.includes(intent.name.toLowerCase())
        );

        return matched || null;
    } catch (error) {
        console.error("OpenAI API error:", error);
        return null;
    }
};