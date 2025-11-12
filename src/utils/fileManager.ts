import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(__dirname, '../config/chatbotConfig.json');

export const readConfigFile = (): any => {
    try {
        const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading chatbot configuration', err);
        return null;
    }
};

export const writeConfigFile = (config: any): boolean => {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error('Error writing chatbot configuration file', err);
        return false;
    }
};
