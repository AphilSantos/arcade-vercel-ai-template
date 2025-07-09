'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface OverflowMenuProps {
  items: MenuItem[];
  className?: string;
}

export function OverflowMenu({ items, className }: OverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleItemClick = (item: { onClick: () => void }) => {
    item.onClick();
    setIsOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 p-0 relative z-10"
        onClick={() => setIsOpen(true)}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">More options</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tools</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {items.map((item) => (
              <button
                type="button"
                key={item.id}
                className="flex items-center rounded-lg p-3 text-left hover:bg-accent w-full"
                onClick={() => handleItemClick(item)}
              >
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                  {item.icon}
                </span>
                <div>
                  <div className="font-medium">{item.label}</div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
