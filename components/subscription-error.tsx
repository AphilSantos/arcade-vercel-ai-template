'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionErrorProps {
  title?: string;
  message: string;
  code?: string;
  retryable?: boolean;
  onRetry?: () => void;
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  className?: string;
}

/**
 * Component for displaying subscription-related errors with appropriate styling and actions
 */
export function SubscriptionError({
  title,
  message,
  code,
  retryable = false,
  onRetry,
  variant = 'default',
  className,
}: SubscriptionErrorProps) {
  // Determine icon based on variant
  const Icon = variant === 'destructive' 
    ? AlertTriangle 
    : variant === 'warning' 
      ? AlertCircle 
      : Info;

  // Determine title if not provided
  const errorTitle = title || (
    variant === 'destructive' 
      ? 'Error' 
      : variant === 'warning' 
        ? 'Warning' 
        : 'Information'
  );

  return (
    <Alert 
      variant={variant === 'info' ? 'default' : variant} 
      className={cn(
        variant === 'info' && 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <AlertTitle className="mb-1">{errorTitle}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <div>{message}</div>
        
        {code && (
          <div className="text-xs opacity-70">
            Error code: {code}
          </div>
        )}
        
        {retryable && onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className={cn(
              "w-fit",
              variant === 'info' && 'border-blue-200 hover:bg-blue-100 hover:text-blue-900'
            )}
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}