import {
    ChatbotConfig,
    ChatbotBlock,
    WriteMessageBlock,
    WaitForResponseBlock,
    DetectIntentBlock,
} from '../models/chatbotTypes';
import * as chatBotConfigService from '../services/chatBotConfigService';

import { detectIntent } from './openAIService';


export interface ConversationState {
    currentBlockId: string;
    history: Array<{ sender: 'user' | 'bot'; message: string }>;
}


export class ChatbotService {
    private config: ChatbotConfig | any;
    private readonly configId: string;

    constructor(configId: string = 'travel_assistant_v1') {
        this.configId = configId;
    }

    //Load chatbot configuration
    public async init(): Promise<void> {
        this.config = await chatBotConfigService.getConfig(this.configId);
        if (!this.config) {
            throw new Error(`Chatbot config not found for ID: ${this.configId}`);
        }
    }

    private getBlock(blockId: string): ChatbotBlock {
        const block = this.config.blocks[blockId];
        if (!block) {
            throw new Error(`Block not found: ${blockId}`);
        }
        return block;
    }

    public async processMessage(
        state: ConversationState,
        userMessage: string
    ): Promise<{ botMessage: string; nextBlockId: string }> {
        let currentBlock = this.getBlock(state.currentBlockId);

        if (currentBlock.type === 'wait_for_response' || currentBlock.type === 'detect_intent') {
            state.history.push({ sender: 'user', message: userMessage });
        }

        let { botMessage, nextBlock } = await this.executeBlockLogic(currentBlock, state, userMessage);

        if (currentBlock.type === 'wait_for_response' && nextBlock) {
            state.currentBlockId = nextBlock.id;
            return this.processMessage(state, userMessage);
        }

        if (nextBlock) {
            state.currentBlockId = nextBlock.id;
        }

        return { botMessage, nextBlockId: state.currentBlockId };
    }

    //Execute the proper logic after detecting the current block
    private async executeBlockLogic(
        currentBlock: ChatbotBlock,
        state: ConversationState,
        userMessage: string
    ): Promise<{ botMessage: string; nextBlock: ChatbotBlock | undefined }> {
        let botMessage = '';
        let nextBlock: ChatbotBlock | undefined;

        switch (currentBlock.type) {
            case 'write_message':
                ({ botMessage, nextBlock } = this.handleWriteMessage(currentBlock as WriteMessageBlock, state));
                break;

            case 'wait_for_response':
                nextBlock = (currentBlock as WaitForResponseBlock).next
                    ? this.getBlock((currentBlock as WaitForResponseBlock).next!)
                    : undefined;
                break;

            case 'detect_intent':
                ({ botMessage, nextBlock } = await this.handleDetectIntent(currentBlock as DetectIntentBlock, state, userMessage));
                break;

            case 'end':
                botMessage = 'Thanks, bye!';
                break;

            default:
                throw new Error(`Unsupported block type: ${(currentBlock as any).type}`);
        }

        return { botMessage, nextBlock };
    }


    private handleWriteMessage(
        block: WriteMessageBlock,
        state: ConversationState
    ): { botMessage: string; nextBlock: ChatbotBlock | undefined } {
        const botMessage = block.message;
        state.history.push({ sender: 'bot', message: botMessage });

        let nextBlock: ChatbotBlock | undefined;
        if (block.next) {
            nextBlock = this.getBlock(block.next);
        }

        return { botMessage, nextBlock };
    }


    private async handleDetectIntent(
        block: DetectIntentBlock,
        state: ConversationState,
        userMessage: string
    ): Promise<{ botMessage: string; nextBlock: ChatbotBlock | undefined }> {
        let botMessage = '';
        let nextBlock: ChatbotBlock | undefined;

        const detectedIntent = await detectIntent(userMessage, block.intents);

        if (detectedIntent) {
            nextBlock = this.getBlock(detectedIntent.next);
        } else if (block.fallback_next) {
            nextBlock = this.getBlock(block.fallback_next);
        }

        if (nextBlock?.type === 'write_message') {
            ({ botMessage, nextBlock } = this.processMessageChain(nextBlock as WriteMessageBlock, state));
        }

        return { botMessage, nextBlock };
    }


    //Chain messages
    private processMessageChain(
        initialBlock: WriteMessageBlock,
        state: ConversationState
    ): { botMessage: string; nextBlock: ChatbotBlock | undefined } {
        let combinedMessage = initialBlock.message;
        state.history.push({ sender: 'bot', message: initialBlock.message });

        let currentBlock: ChatbotBlock = initialBlock;
        let finalNextBlock: ChatbotBlock | undefined;

        while (currentBlock.next) {
            const followBlock = this.getBlock(currentBlock.next);

            if (followBlock.type === 'write_message') {
                combinedMessage += '\n ' + followBlock.message;
                state.history.push({ sender: 'bot', message: followBlock.message });
                currentBlock = followBlock;
            } else {
                finalNextBlock = followBlock;
                break;
            }
        }

        if (!finalNextBlock && currentBlock.next) {
            finalNextBlock = this.getBlock(currentBlock.next);
        }

        return { botMessage: combinedMessage, nextBlock: finalNextBlock };
    }


    public createInitialState() {
        return {
            currentBlockId: this.config.start_block || 'welcome',
            history: []
        };
    }

}