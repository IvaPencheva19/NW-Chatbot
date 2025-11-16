import { detectIntent } from "../../services/openAIService";
import { ChatbotIntent } from "../../models/chatbotTypes";
import OpenAI from "openai";


jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

const mockOpenAI = OpenAI as unknown as jest.Mock;
const mockCreate = mockOpenAI.mock.results[0]?.value.chat.completions.create as jest.Mock;


describe('detectIntent', () => {
  const mockIntents: ChatbotIntent[] = [
    {
      name: "weather",
      examples: ["What's the weather?", "Tell me the weather forecast", "Give me the weather"],
      next: "weather_info"
    },
    {
      name: "travel_offers",
      examples: ["Show me travel offers", "Any flight discounts?", "Vacation deals"],
      next: "travel_offer_info"
    },
    {
      name: "restaurant_recommendations",
      examples: ["Recommend a restaurant", "Where should I eat?", "Find restaurants nearby"],
      next: "restaurant_info"
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully detect a known intent (travel_offers)', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'travel_offers',
        },
      }],
    });

    const userMessage = "Are there any deals on flights to Europe this month?";
    const detectedIntent = await detectIntent(userMessage, mockIntents);

    expect(detectedIntent).toEqual(mockIntents[1]);

    expect(mockCreate).toHaveBeenCalledTimes(1);

    const [callArgs] = mockCreate.mock.calls[0];
    expect(callArgs.messages[1].content).toContain("travel_offers: Show me travel offers, Any flight discounts?, Vacation deals");
    expect(callArgs.messages[1].content).toContain(`User said: "${userMessage}"`);
  });

  test('should successfully detect a different known intent (restaurant_recommendations)', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'restaurant_recommendations',
        },
      }],
    });

    const userMessage = "I'm hungry, where should I grab lunch nearby?";
    const detectedIntent = await detectIntent(userMessage, mockIntents);

    expect(detectedIntent).toEqual(mockIntents[2]);
  });


  test('should return null if intent is classified as "unknown" by the model', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'unknown',
        },
      }],
    });

    const userMessage = "Which is the scariest movie?";
    const detectedIntent = await detectIntent(userMessage, mockIntents);

    expect(detectedIntent).toBeNull();
  });

  test('should return null on OpenAI API error (e.g., network failure, rate limit)', async () => {
    mockCreate.mockRejectedValue(new Error("API rate limit exceeded."));

    const userMessage = "What is the weather?";
    const detectedIntent = await detectIntent(userMessage, mockIntents);

    expect(detectedIntent).toBeNull();
  });

  test('should return null if API response is missing choices or content', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [],
    });

    const userMessage = "I need a deal.";
    const detectedIntent = await detectIntent(userMessage, mockIntents);

    expect(detectedIntent).toBeNull();
  });
});