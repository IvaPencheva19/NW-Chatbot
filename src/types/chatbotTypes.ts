export type BlockType = 'write_message' | 'wait_for_response' | 'detect_intent' | 'end';

export interface ChatbotIntent {
    name: string;
    examples: string[];
    next: string;
}

export interface BaseBlock {
    id: string;
    type: BlockType;
    next?: string;
}

export interface WriteMessageBlock extends BaseBlock {
    type: 'write_message';
    message: string;
}

export interface EndBlock extends BaseBlock {
    type: 'end';
    message: string;
}

export interface WaitForResponseBlock extends BaseBlock {
    type: 'wait_for_response';
}


export interface DetectIntentBlock extends BaseBlock {
    type: 'detect_intent';
    intents: ChatbotIntent[];
    fallback_next: string;
}

export type ChatbotBlock =
    | WriteMessageBlock
    | WaitForResponseBlock
    | DetectIntentBlock
    | AskForNextQuestionBlock;

export interface ChatbotConfig {
    id: string;
    name: string;
    description?: string;
    start_block: string;
    blocks: Record<string, ChatbotBlock>;
}
