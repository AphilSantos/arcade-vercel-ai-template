'use client';

import { useFormStatus } from 'react-dom';

import { LoaderIcon } from '@/components/icons';

import { Button } from './ui/button';

interface SubmitButtonProps {
  children: React.ReactNode;
  isSuccessful: boolean;
  className?: string;
}

export function SubmitButton({
  children,
  isSuccessful,
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type={pending ? 'button' : 'submit'}
      aria-disabled={pending || isSuccessful}
      disabled={pending || isSuccessful}
      className={`${pending || isSuccessful ? 'opacity-75' : ''} ${className || ''} relative`}
    >
      {children}

      {(pending || isSuccessful) && (
        <span className="animate-spin absolute right-4">
          <LoaderIcon />
        </span>
      )}

      <output aria-live="polite" className="sr-only">
        {pending || isSuccessful ? 'Loading' : 'Submit form'}
      </output>
    </Button>
  );
}
