import * as chatBotConfigService from '../../services/chatBotConfigService';
import { ChatbotConfigModel } from '../../models/chatbotConfigModel';

jest.mock('../../models/chatbotConfigModel');

describe('chatBotConfigService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getConfig', () => {
        it('should return the config for a given id', async () => {
            const mockConfig = { id: 'test_config', name: 'Test Config' };

            (ChatbotConfigModel.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockConfig)
            });

            const result = await chatBotConfigService.getConfig('test_config');

            expect(ChatbotConfigModel.findOne).toHaveBeenCalledWith({ id: 'test_config' });
            expect(result).toEqual(mockConfig);
        });

        it('should return null if no config is found', async () => {
            (ChatbotConfigModel.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(null)
            });

            const result = await chatBotConfigService.getConfig('nonexistent');

            expect(ChatbotConfigModel.findOne).toHaveBeenCalledWith({ id: 'nonexistent' });
            expect(result).toBeNull();
        });
    });

    describe('updateConfig', () => {
        it('should update and return the config', async () => {
            const newConfig = { id: 'test_config', name: 'Updated Config' };

            (ChatbotConfigModel.findOneAndUpdate as jest.Mock).mockResolvedValue(newConfig);

            const result = await chatBotConfigService.updateConfig('test_config', newConfig);

            expect(ChatbotConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
                { id: 'test_config' },
                newConfig,
                { upsert: true, new: true }
            );

            expect(result).toEqual(newConfig);
        });

        it('should upsert a new config if it does not exist', async () => {
            const newConfig = { id: 'new_config', name: 'New Config' };

            (ChatbotConfigModel.findOneAndUpdate as jest.Mock).mockResolvedValue(newConfig);

            const result = await chatBotConfigService.updateConfig('new_config', newConfig);

            expect(ChatbotConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
                { id: 'new_config' },
                newConfig,
                { upsert: true, new: true }
            );

            expect(result).toEqual(newConfig);
        });
    });
});
