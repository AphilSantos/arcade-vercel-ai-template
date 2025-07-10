'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { Paintbrush } from 'lucide-react';

const PaletteModal = () => {
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
        <Paintbrush className="h-5 w-5" />
      </button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
          <div className="flex-1 overflow-hidden">
            <iframe
              src="https://elaborate-cajeta-9dae74.netlify.app"
              className="size-full border-0 rounded-lg"
              allow="clipboard-read; clipboard-write"
              allowFullScreen
              title="Palette Interface"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { PaletteModal };
