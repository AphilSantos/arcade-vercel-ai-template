'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';

const StockBotModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
        onClick={() => setIsOpen(true)}
      >
        <svg
          height="20"
          strokeLinejoin="round"
          viewBox="0 0 16 16"
          width="20"
          style={{ color: 'currentcolor' }}
        >
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M1 1v11.75A2.25 2.25 0 0 0 3.25 15H15v-1.5H3.25a.75.75 0 0 1-.75-.75V1H1Zm13.297 5.013.513-.547-1.094-1.026-.513.547-3.22 3.434-2.276-2.275a1 1 0 0 0-1.414 0L4.22 8.22l-.53.53 1.06 1.06.53-.53L7 7.56l2.287 2.287a1 1 0 0 0 1.437-.023l3.573-3.811Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
          <div className="flex-1 overflow-hidden">
            <iframe
              src="https://stockbot-powered-by-groq-nine-vert.vercel.app/"
              className="size-full border-0 rounded-lg"
              allow="clipboard-read; clipboard-write"
              allowFullScreen
              title="StockBot Interface"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { StockBotModal };
