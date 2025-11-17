import { ChatbotService, ConversationState } from '../../services/chatbotService';
import * as chatBotConfigService from '../../services/chatBotConfigService';
import { detectIntent } from '../../services/openAIService';

jest.mock('../../services/chatBotConfigService');
jest.mock('../../services/openAIService');

const baseConfig = {
    id: 'travel_assistant_v1',
    start_block: 'welcome',
    blocks: {
        welcome: {
            id: 'welcome',
            type: 'write_message',
            message: "Hi! I'm your Travel Assistant. How can I help you today?",
            next: 'wait_for_user'
        },
        wait_for_user: {
            id: 'wait_for_user',
            type: 'wait_for_response',
            next: 'detect_intent_main'
        },
        detect_intent_main: {
            id: 'detect_intent_main',
            type: 'detect_intent',
            intents: [
                { name: 'weather', examples: ['weather'], next: 'weather_info' },
                { name: 'travel_offers', examples: ['travel'], next: 'travel_offer_info' }
            ],
            fallback_next: 'unknown_intent'
        },
        weather_info: {
            id: 'weather_info',
            type: 'write_message',
            message: 'The weather in Varna is cold and rainy.',
            next: 'ask_more'
        },
        travel_offer_info: {
            id: 'travel_offer_info',
            type: 'write_message',
            message: "The best offer is Paris!",
            next: 'ask_more'
        },
        ask_more: {
            id: 'ask_more',
            type: 'write_message',
            message: 'Do you need anything else?',
            next: 'wait_for_user'
        },
        unknown_intent: {
            id: 'unknown_intent',
            type: 'write_message',
            message: "Sorry, I didn’t quite get that. Could you rephrase?",
            next: 'wait_for_user'
        }
    }
};

describe('ChatbotService', () => {
    let service: ChatbotService;
    let state: ConversationState;

    beforeEach(async () => {
        (chatBotConfigService.getConfig as jest.Mock).mockResolvedValue(JSON.parse(JSON.stringify(baseConfig)));
        (detectIntent as jest.Mock).mockResolvedValue(null);

        service = new ChatbotService('travel_assistant_v1');
        await service.init();

        state = {
            currentBlockId: 'welcome',
            history: []
        };
    });

    test('initial welcome message is returned and moves to next block', async () => {
        const response = await service.processMessage(state, '');
        expect(response.botMessage).toBe("Hi! I'm your Travel Assistant. How can I help you today?");
        expect(state.currentBlockId).toBe('wait_for_user');
    });

    test('user message stored and flow remains at wait_for_user after user response', async () => {
        state.currentBlockId = 'wait_for_user';
        await service.processMessage(state, 'weather please');

        expect(state.currentBlockId).toBe('wait_for_user');
        expect(state.history.some(h => h.message === 'weather please')).toBe(true);
    });

    test('intent "weather" triggers weather_info → ask_more → wait_for_user', async () => {
        state.currentBlockId = 'detect_intent_main';
        (detectIntent as jest.Mock).mockResolvedValue({ next: 'weather_info' });

        const response = await service.processMessage(state, 'weather');

        expect(response.botMessage).toContain('The weather in Varna is cold and rainy.');
        expect(response.nextBlockId).toBe('wait_for_user');
    });

    test('fallback goes to unknown_intent and back to wait_for_user', async () => {
        state.currentBlockId = 'detect_intent_main';
        (detectIntent as jest.Mock).mockResolvedValue(null);

        const response = await service.processMessage(state, 'xyz');

        expect(response.botMessage).toContain("Sorry, I didn’t quite get that.");
        expect(response.nextBlockId).toBe('wait_for_user');
    });

    test('write_message chains correctly across multiple blocks (step by step)', async () => {
        const chainConfig = JSON.parse(JSON.stringify(baseConfig));
        chainConfig.blocks.start_chain = {
            id: 'start_chain',
            type: 'write_message',
            message: 'Hello',
            next: 'middle_chain'
        };
        chainConfig.blocks.middle_chain = {
            id: 'middle_chain',
            type: 'write_message',
            message: 'This is chained.',
            next: 'end_chain'
        };
        chainConfig.blocks.end_chain = {
            id: 'end_chain',
            type: 'end'
        };

        (chatBotConfigService.getConfig as jest.Mock).mockResolvedValue(chainConfig);
        const chainedService = new ChatbotService('travel_assistant_v1');
        await chainedService.init();

        state.currentBlockId = 'start_chain';

        const response1 = await chainedService.processMessage(state, '');
        expect(response1.botMessage).toBe('Hello');
        expect(state.currentBlockId).toBe('middle_chain');

        const response2 = await chainedService.processMessage(state, '');
        expect(response2.botMessage).toBe('This is chained.');
        expect(state.currentBlockId).toBe('end_chain');
    });
});
