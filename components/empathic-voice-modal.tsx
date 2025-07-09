'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useState } from 'react';

export function EmpathicVoiceModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-full hover:bg-accent"
        aria-label="Open empathic voice interface"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <div className="flex-1 overflow-hidden">
            <iframe
              src="https://empathic-voice-interface-starter-eight-psi.vercel.app/"
              className="w-full h-full border-0 rounded-lg"
              allow="microphone"
              title="Empathic Voice Interface"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
