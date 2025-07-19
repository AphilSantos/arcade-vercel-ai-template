import {
  type UIMessage,
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { readDocument } from '@/lib/ai/tools/read-document';
import { generateImageTool, editImageTool, generateVideoTool } from '@/lib/tools/image-tools';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { arcadeServer } from '@/lib/arcade/server';
import { getMaxToolkitsForPlan } from '@/lib/arcade/utils';
import { incrementUsage } from '@/middleware/usage-check';
import { processMessagesForAI } from '@/lib/utils/attachment-processor';

export const maxDuration = 300; // 5 minutes to accommodate video generation

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
      selectedToolkits,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
      selectedToolkits: string[];
    } = await request.json();

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check if the user can start a new conversation based on their subscription plan
    try {
      // Import directly to avoid dynamic import issues
      const { subscriptionService } = require('@/lib/subscription');

      // Log the user ID for debugging
      console.log(`Checking if user ${session.user.id} can start a conversation`);

      const canStart = await subscriptionService.canStartConversation(session.user.id);

      console.log(`User ${session.user.id} can start conversation: ${canStart}`);

      if (!canStart) {
        console.log(`User ${session.user.id} has reached their daily conversation limit`);
        return new Response(
          JSON.stringify({
            error: 'Daily conversation limit reached',
            code: 'USAGE_LIMIT_EXCEEDED',
            message: 'You have reached your daily conversation limit. Please upgrade to continue chatting.'
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (error) {
      console.error('Error checking conversation limits:', error);
      // Continue with the request if there's an error checking limits
      // This prevents users from being blocked due to technical issues
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    // Check toolkit limits based on user's subscription plan
    try {
      const { subscriptionService } = require('@/lib/subscription');
      const userPlan = await subscriptionService.getUserPlan(session.user.id);
      const maxToolkits = getMaxToolkitsForPlan(userPlan);

      if (selectedToolkits.length > maxToolkits) {
        return new Response(
          `You can only select up to ${maxToolkits} toolkits at a time. ${userPlan === 'free' ? 'Upgrade to premium for more toolkits!' : ''}`,
          { status: 400 },
        );
      }
    } catch (error) {
      console.error('Error checking toolkit limits:', error);
      // Fallback to free tier limits if there's an error
      if (selectedToolkits.length > 6) {
        return new Response(
          'You can only select up to 6 toolkits at a time',
          { status: 400 },
        );
      }
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: session.user.id, title });

      // Increment usage counter for new conversations only
      // This ensures we only count new conversations, not continuations of existing ones
      await incrementUsage(session.user.id);
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant' && lastMessage.parts.length > 0) {
      for (const part of lastMessage.parts) {
        if (
          part.type === 'tool-invocation' &&
          part.toolInvocation.state === 'result'
        ) {
          await saveMessages({
            messages: [
              {
                chatId: id,
                id: lastMessage.id,
                role: lastMessage.role,
                parts: lastMessage.parts,
                attachments: lastMessage.experimental_attachments ?? [],
                createdAt: new Date(),
              },
            ],
          });
        }
      }
    } else {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: userMessage.id,
            role: 'user',
            parts: userMessage.parts,
            attachments: userMessage.experimental_attachments ?? [],
            createdAt: new Date(),
          },
        ],
      });
    }

    const arcadeTools =
      (await arcadeServer?.getToolsByToolkits({
        userId: session.user.id,
        toolkits: selectedToolkits,
      })) ?? {};

    // Process messages to convert blob URLs to base64 data URLs for AI model access
    console.log('=== PROCESSING MESSAGES FOR AI ===');
    console.log('Original messages with attachments:', messages.filter(m => m.experimental_attachments && m.experimental_attachments.length > 0).length);

    const processedMessages = await processMessagesForAI(messages);

    console.log('Processed messages with attachments:', processedMessages.filter(m => m.experimental_attachments && m.experimental_attachments.length > 0).length);
    console.log('=== END PROCESSING ===');

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel }),
          messages: processedMessages,
          maxSteps: 5,
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            ...arcadeTools,
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
            readDocument: readDocument({ session, dataStream }),
            // ImageRouter tools - these will be prioritized over Arcade tools for image generation
            generateImage: generateImageTool,
            editImage: editImageTool,
            generateVideo: generateVideoTool,
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [userMessage],
                  responseMessages: response.messages,
                });

                // When we use addToolResult, this generates a new assistant message, but we want to save it on the original message
                // Check if the message has a tool-invocation part
                const hasToolInvocation = assistantMessage?.parts?.some(
                  (part) =>
                    part.type === 'tool-invocation' &&
                    part.toolInvocation.state === 'call',
                );

                // If the message has a tool-invocation part, and the previous message has a tool-result part at the end, we need to save on the original message
                const lastMessageLastPart =
                  lastMessage.parts[lastMessage.parts.length - 1];
                if (
                  hasToolInvocation &&
                  lastMessage.role === 'assistant' &&
                  lastMessage.parts.length > 0 &&
                  lastMessageLastPart.type === 'tool-invocation' &&
                  lastMessageLastPart.toolInvocation.state === 'result'
                ) {
                  const toolInvocationPart = assistantMessage?.parts?.find(
                    (part) => part.type === 'tool-invocation',
                  );
                  if (!toolInvocationPart) {
                    return;
                  }
                  const parts = lastMessage.parts.concat(toolInvocationPart);
                  await saveMessages({
                    messages: [
                      {
                        id: lastMessage.id,
                        chatId: id,
                        role: lastMessage.role,
                        parts,
                        attachments: lastMessage.experimental_attachments ?? [],
                        createdAt: new Date(),
                      },
                    ],
                  });
                  return;
                }
                await saveMessages({
                  messages: [
                    {
                      id: assistantMessage.id,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch (_) {
                console.error('Failed to save chat');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: (error) => {
        console.error('Error:', error);
        return error instanceof Error
          ? JSON.stringify(error)
          : 'Oops, an error occured!';
      },
    });
  } catch (error) {
    console.error('Error in chat route', error);
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
