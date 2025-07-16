import { simulateReadableStream } from 'ai';
import { MockLanguageModelV1 } from 'ai/test';
import { getResponseChunksByPrompt } from '@/tests/prompts/utils';

// Helper function to generate dynamic responses based on the prompt
const generateDynamicResponse = (prompt: any) => {
  // Extract the user's message from the prompt
  const userMessage = prompt.find((msg: any) => msg.role === 'user')?.content?.[0]?.text || '';
  
  // Generate a response based on the content
  if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
    return 'Hello! How can I assist you today?';
  } else if (userMessage.toLowerCase().includes('help')) {
    return 'I\'d be happy to help you with that. What do you need assistance with?';
  } else if (userMessage.toLowerCase().includes('weather')) {
    return 'I can check the weather for you. Which location are you interested in?';
  } else if (userMessage.toLowerCase().includes('thank')) {
    return 'You\'re welcome! Is there anything else I can help you with?';
  } else {
    // Default response with some variation
    const responses = [
      'I understand your question. Let me help you with that.',
      'That\'s an interesting question. Here\'s what I know about it.',
      'I can provide some information on that topic.',
      'Let me address your question with the information I have.',
      'I\'d be happy to help with your request.'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
};

export const chatModel = new MockLanguageModelV1({
  doGenerate: async ({ prompt }) => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 20 },
    text: generateDynamicResponse(prompt),
  }),
  doStream: async ({ prompt }) => ({
    stream: simulateReadableStream({
      chunkDelayInMs: 50,
      initialDelayInMs: 100,
      chunks: getResponseChunksByPrompt(prompt),
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  }),
});

export const reasoningModel = new MockLanguageModelV1({
  doGenerate: async ({ prompt }) => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 20 },
    text: generateDynamicResponse(prompt),
  }),
  doStream: async ({ prompt }) => ({
    stream: simulateReadableStream({
      chunkDelayInMs: 50,
      initialDelayInMs: 500,
      chunks: getResponseChunksByPrompt(prompt, true),
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  }),
});

export const titleModel = new MockLanguageModelV1({
  doGenerate: async ({ prompt }) => {
    // Generate a title based on the user's message
    const userMessage = prompt.find((msg: any) => msg.role === 'user')?.content?.[0]?.text || '';
    const words = userMessage.split(' ').filter((word: string) => word.length > 3).slice(0, 3);
    const title = words.length > 0 
      ? `Chat about ${words.join(' ')}` 
      : 'New conversation';
      
    return {
      rawCall: { rawPrompt: null, rawSettings: {} },
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 20 },
      text: title,
    };
  },
  doStream: async ({ prompt }) => {
    // Generate a title based on the user's message
    const userMessage = prompt.find((msg: any) => msg.role === 'user')?.content?.[0]?.text || '';
    const words = userMessage.split(' ').filter((word: string) => word.length > 3).slice(0, 3);
    const title = words.length > 0 
      ? `Chat about ${words.join(' ')}` 
      : 'New conversation';
      
    return {
      stream: simulateReadableStream({
        chunkDelayInMs: 50,
        initialDelayInMs: 100,
        chunks: [
          { type: 'text-delta', textDelta: title },
          {
            type: 'finish',
            finishReason: 'stop',
            logprobs: undefined,
            usage: { completionTokens: 10, promptTokens: 3 },
          },
        ],
      }),
      rawCall: { rawPrompt: null, rawSettings: {} },
    };
  },
});

export const artifactModel = new MockLanguageModelV1({
  doGenerate: async ({ prompt }) => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 20 },
    text: generateDynamicResponse(prompt),
  }),
  doStream: async ({ prompt }) => ({
    stream: simulateReadableStream({
      chunkDelayInMs: 50,
      initialDelayInMs: 100,
      chunks: getResponseChunksByPrompt(prompt),
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  }),
});
