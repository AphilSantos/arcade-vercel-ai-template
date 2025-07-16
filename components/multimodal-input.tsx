'use client';

import type { Attachment, UIMessage } from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { Puzzle, Terminal, User } from 'lucide-react';
import { OverflowMenu } from './overflow-menu';
import { cn } from '@/lib/utils';
import { PreviewAttachment } from './preview-attachment';
import { StockBotModal } from './StockBotModal';
import { PaletteModal } from './PaletteModal';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { SuggestedActions } from './suggested-actions';
import { Dialog, DialogContent } from './ui/dialog';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { ToolkitSelector } from './toolkit-selector';
import { useSubscription } from '@/hooks/use-subscription';
import type { Session } from 'next-auth';

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  user,
}: {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  className?: string;
  user?: Session['user'];
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  
  // Get subscription data for usage limit checking
  const subscription = useSubscription(user?.id);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const [activeModal, setActiveModal] = useState<string | null>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const clearInput = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    setInput('');
    setLocalStorageInput('');

    setAttachments([]);
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [setAttachments, setLocalStorageInput, width, chatId, setInput]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  const submitForm = useCallback(
    (e?: React.FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      
      // Check if user has reached their daily limit
      if (subscription.plan === 'free' && subscription.remainingConversations === 0) {
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
                }
              } catch (error) {
                console.error('Failed to create subscription:', error);
              }
            },
          },
        });
        return;
      }
      
      handleSubmit(e, {
        experimental_attachments: attachments,
      });
      clearInput();
    },
    [attachments, handleSubmit, clearInput, subscription],
  );

  return (
    <form
      className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl"
      onSubmit={submitForm}
    >
      <div className="relative w-full flex flex-col gap-4">
        {messages.length === 0 &&
          attachments.length === 0 &&
          uploadQueue.length === 0 && (
            <SuggestedActions append={append} chatId={chatId} />
          )}

        <input
          type="file"
          className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
          ref={fileInputRef}
          multiple
          onChange={handleFileChange}
          tabIndex={-1}
        />

        {(attachments.length > 0 || uploadQueue.length > 0) && (
          <div
            data-testid="attachments-preview"
            className="flex flex-row gap-2 overflow-x-scroll items-end"
          >
            {attachments.map((attachment) => (
              <PreviewAttachment key={attachment.url} attachment={attachment} />
            ))}

            {uploadQueue.map((filename) => (
              <PreviewAttachment
                key={filename}
                attachment={{
                  url: '',
                  name: filename,
                  contentType: '',
                }}
                isUploading={true}
              />
            ))}
          </div>
        )}

        <Textarea
          data-testid="multimodal-input"
          ref={textareaRef}
          placeholder="Send a message..."
          value={input}
          onChange={handleInput}
          className={cx(
            'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted/40 pb-10 dark:border-zinc-700',
            className,
          )}
          rows={2}
          autoFocus
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();

              if (status === 'submitted' || status === 'streaming') {
                toast.error(
                  'Please wait for the model to finish its response!',
                );
              } else {
                submitForm();
              }
            }
          }}
        />

        <div className="absolute bottom-0 p-2 w-full flex flex-row justify-between items-center">
          <div className="flex-1 flex flex-row gap-1 overflow-x-auto no-scrollbar items-center">
            <AttachmentsButton fileInputRef={fileInputRef} status={status} />
            <ToolkitSelector />
            <StockBotModal />
            <PaletteModal />
            <OverflowMenu
              items={[
                {
                  id: 'empathic-voice',
                  label: 'Empathic Voice',
                  icon: <User className="h-4 w-4" />,
                  onClick: () => setActiveModal('empathic-voice'),
                },
                {
                  id: 'computer',
                  label: 'Computer',
                  icon: <Terminal className="h-4 w-4" />,
                  onClick: () => setActiveModal('computer'),
                },
                {
                  id: 'fragments',
                  label: 'Fragments',
                  icon: <Puzzle className="h-4 w-4" />,
                  onClick: () => setActiveModal('fragments'),
                },
              ]}
            />
          </div>
        </div>

        {/* Modals */}
        <EmpathicVoiceModal
          isOpen={activeModal === 'empathic-voice'}
          onOpenChange={(open) => !open && setActiveModal(null)}
        />
        <AISDKComputerModal
          isOpen={activeModal === 'computer'}
          onOpenChange={(open) => !open && setActiveModal(null)}
        />
        <FragmentsModal
          isOpen={activeModal === 'fragments'}
          onOpenChange={(open) => !open && setActiveModal(null)}
        />

        <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
          {status === 'submitted' || status === 'streaming' ? (
            <StopButton stop={stop} setMessages={setMessages} />
          ) : (
            <SendButton input={input} uploadQueue={uploadQueue} />
          )}
        </div>
      </div>
    </form>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;

    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers['status'];
}) {
  return (
    <Button
      type="button"
      data-testid="attachments-button"
      className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready'}
      variant="ghost"
    >
      <PaperclipIcon size={14} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

interface ModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

const Modal = ({ isOpen, onOpenChange, children, className }: ModalProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent
      className={cn('w-[98vw] h-[90vh] flex flex-col max-w-none', className)}
    >
      {children}
    </DialogContent>
  </Dialog>
);

const EmpathicVoiceModal = ({
  isOpen,
  onOpenChange,
}: { isOpen: boolean; onOpenChange: (open: boolean) => void }) => (
  <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
    <div className="flex-1 overflow-hidden">
      <iframe
        src="https://empathic-voice-interface-starter-eight-psi.vercel.app/"
        className="size-full border-0 rounded-lg"
        allow="microphone"
        title="Empathic Voice Interface"
      />
    </div>
  </Modal>
);

const AISDKComputerModal = ({
  isOpen,
  onOpenChange,
}: { isOpen: boolean; onOpenChange: (open: boolean) => void }) => (
  <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
    <div className="flex-1 overflow-hidden">
      <iframe
        src="https://ai-sdk-computer-use-ten-beta.vercel.app/"
        className="size-full border-0 rounded-lg"
        title="AI SDK Computer Interface"
      />
    </div>
  </Modal>
);

const FragmentsModal = ({
  isOpen,
  onOpenChange,
}: { isOpen: boolean; onOpenChange: (open: boolean) => void }) => (
  <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
    <div className="flex-1 overflow-hidden">
      <iframe
        src="https://enzostvs-deepsite.hf.space/projects/new"
        className="size-full border-0 rounded-lg"
        title="Fragments Interface"
      />
    </div>
  </Modal>
);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers['setMessages'];
}) {
  return (
    <Button
      type="button"
      data-testid="stop-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  input,
  uploadQueue,
}: {
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      data-testid="send-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if ((prevProps.input.length === 0) !== (nextProps.input.length === 0))
    return false;
  return true;
});
