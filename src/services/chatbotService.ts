import {
    ChatbotConfig,
    ChatbotBlock,
    WriteMessageBlock,
    WaitForResponseBlock,
    DetectIntentBlock,
} from '../types/chatbotTypes';
import { readConfigFile } from '../utils/fileManager';
import { detectIntent } from './openAIService';

export interface ConversationState {
    currentBlockId: string;
    history: Array<{ sender: 'user' | 'bot'; message: string }>;
}

export class ChatbotService {
    private config: ChatbotConfig;

    constructor() {
        const cfg = readConfigFile();
        if (!cfg) throw new Error('Chatbot config not found');
        this.config = cfg;
    }

    private getBlock(blockId: string): ChatbotBlock {
        const block = this.config.blocks[blockId];
        if (!block) throw new Error(`Block not found: ${blockId}`);
        return block;
    }

    public async processMessage(
        state: ConversationState,
        userMessage: string
    ): Promise<{ botMessage: string; nextBlockId: string }> {
        let currentBlock = this.getBlock(state.currentBlockId);
        let botMessage = '';
        let nextBlock: ChatbotBlock | undefined;

        if (currentBlock.type === 'wait_for_response' || currentBlock.type === 'detect_intent') {
            state.history.push({ sender: 'user', message: userMessage });
        }

        switch (currentBlock.type) {
            case 'write_message': {
                const block = currentBlock as WriteMessageBlock;
                botMessage = block.message;
                state.history.push({ sender: 'bot', message: botMessage });

                if (block.next) {
                    state.currentBlockId = block.next;
                    nextBlock = this.getBlock(block.next);
                }
                break;
            }

            case 'wait_for_response': {
                const block = currentBlock as WaitForResponseBlock;
                if (block.next) {
                    state.currentBlockId = block.next;
                    return this.processMessage(state, userMessage);
                }
                break;
            }

            case 'detect_intent': {
                const block = currentBlock as DetectIntentBlock;
                const detectedIntent = await detectIntent(userMessage, block.intents);

                if (detectedIntent) {
                    nextBlock = this.getBlock(detectedIntent.next);
                } else if (block.fallback_next) {
                    nextBlock = this.getBlock(block.fallback_next);
                }

                if (nextBlock?.type === 'write_message') {
                    botMessage = (nextBlock as WriteMessageBlock).message;
                    state.history.push({ sender: 'bot', message: botMessage });

                    while (nextBlock?.next) {
                        const followBlock = this.getBlock(nextBlock.next);
                        if (followBlock.type === 'write_message') {
                            botMessage += '\n ' + followBlock.message;
                            state.history.push({ sender: 'bot', message: followBlock.message });
                            nextBlock = followBlock.next ? this.getBlock(followBlock.next) : undefined;
                        } else {
                            nextBlock = followBlock;
                            break;
                        }
                    }
                }

                if (nextBlock) {
                    state.currentBlockId = nextBlock.id;
                }

                break;
            }

            case 'end':
                botMessage = 'Thanks, bye!';
                break;

            default:
                throw new Error(`Unsupported block type: ${(currentBlock as any).type}`);
        }

        return { botMessage, nextBlockId: state.currentBlockId };
    }

}
