import { customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';

// Use OpenAI models for all environments
export const myProvider = customProvider({
  languageModels: {
    'chat-model': openai('gpt-4o-mini'),
    'chat-model-reasoning': openai('gpt-4o'),
    'title-model': openai('gpt-4o-mini'),
    'artifact-model': openai('gpt-4o-mini'),
  },
  imageModels: {
    'small-model': openai.image('dall-e-3'),
  },
});
