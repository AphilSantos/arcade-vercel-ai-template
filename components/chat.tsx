'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';
import type { Session } from 'next-auth';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { useLocalStorage } from 'usehooks-ts';
import { DEFAULT_TOOLKITS, LOCAL_STORAGE_KEY } from './toolkit-selector';
import { useSubscription } from '@/hooks/use-subscription';

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
  user,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  user: Session['user'] | undefined;
}) {
  const { mutate } = useSWRConfig();
  const [selectedToolkits] = useLocalStorage<string[]>(
    LOCAL_STORAGE_KEY,
    DEFAULT_TOOLKITS,
  );

  // Get subscription data for the current user
  const subscription = useSubscription(user?.id);
  
  // Show subscription status in UI if needed
  useEffect(() => {
    if (subscription.plan === 'free' && subscription.remainingConversations <= 3 && !subscription.isLoading) {
      toast.info(
        `You have ${subscription.remainingConversations} conversation${
          subscription.remainingConversations === 1 ? '' : 's'
        } remaining today.`,
        {
          id: 'subscription-status',
          duration: 5000,
        }
      );
    }
  }, [subscription.plan, subscription.remainingConversations, subscription.isLoading]);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    addToolResult,
  } = useChat({
    id,
    body: { id, selectedChatModel: selectedChatModel, selectedToolkits },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
      // Refresh subscription data after successful conversation
      if (subscription.refresh) {
        subscription.refresh();
      }
    },

    onError: (error) => {
      console.error('Chat error:', error);
      
      // Handle usage limit errors specifically
      if (error.message.includes('429') || error.message.includes('USAGE_LIMIT_EXCEEDED')) {
        toast.error('Daily conversation limit reached. Upgrade to continue chatting.', {
          action: {
            label: 'Upgrade',
            onClick: async () => {
              try {
                const response = await fetch('/api/subscription/create', {
                  method: 'POST',
                });
                
                if (response.ok) {
                  const data = await response.json();
                  if (data.approvalUrl) {
                    window.location.href = data.approvalUrl;
                  }
                } else {
                  const errorData = await response.json();
                  toast.error(`Failed to create subscription: ${errorData.error || 'Unknown error'}`);
                }
              } catch (error) {
                console.error('Failed to create subscription:', error);
                toast.error('Failed to create subscription. Please try again later.');
              }
            },
          },
          duration: 10000, // Show for 10 seconds to give user time to click
        });
      } else if (error.message.includes('401')) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.message.includes('500')) {
        toast.error('Server error. Our team has been notified and is working on it.');
      } else {
        toast.error('An error occurred, please try again!', {
          action: {
            label: 'Retry',
            onClick: () => reload(),
          },
        });
      }
      
      // Refresh subscription data after error to ensure UI is up-to-date
      if (subscription.refresh) {
        subscription.refresh();
      }
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
          user={user}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
          addToolResult={addToolResult}
          user={user}
        />

        {!isReadonly && (
          <MultimodalInput
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            status={status}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            setMessages={setMessages}
            append={append}
            user={user}
          />
        )}
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
        addToolResult={addToolResult}
      />
    </>
  );
}
