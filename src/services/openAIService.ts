import OpenAI from "openai";
import dotenv from "dotenv";
import { ChatbotIntent } from "../types/chatbotTypes";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const detectIntent = async (
    userMessage: string,
    intents: ChatbotIntent[]
): Promise<ChatbotIntent | null> => {
    try {
        const intentNames = intents.map((i) => i.name);

        console.log("Intent names", intentNames)
        const intentExamples = intents
            .map((i) => `${i.name}: ${i.examples.join(", ")}`)
            .join("\n");

        const prompt = `You are an AI assistant that classifies user intents. 
        Here are the possible intents and example phrases: ${intentExamples}. User said: "${userMessage}".
        Respond with only the name of the intent that best matches, or "unknown" if unsure.
        Possible intents: ${intentNames.join(", ")}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a precise intent detection AI." },
                { role: "user", content: prompt },
            ],
            temperature: 0,
        });

        console.log(response.choices[0]?.message);

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
// export const detectIntent = async (userMessage: string,
//     intents: ChatbotIntent[]) => {
//     console.log("HEREEE")
//     const lower = userMessage.toLowerCase();
//     console.log(lower)
//     if (lower.includes('weather')) return intents.find(i => i.name === 'weather')!;
//     if (lower.includes('offer')) return intents.find(i => i.name === 'travel_offers')!;
//     if (lower.includes('restaurant')) return intents.find(i => i.name === 'restaurant_recommendations')!;
//     return null;
// };