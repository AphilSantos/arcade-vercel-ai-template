'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface PlanChangeNotificationProps {
  type: 'upgrade' | 'downgrade';
  className?: string;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  dismissTimeout?: number;
}

/**
 * Component to display notifications about data preservation during plan changes
 */
export function PlanChangeNotification({
  type,
  className,
  onDismiss,
  autoDismiss = true,
  dismissTimeout = 10000, // 10 seconds
}: PlanChangeNotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss && visible) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, dismissTimeout);
      
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, dismissTimeout, onDismiss, visible]);

  if (!visible) return null;

  const isUpgrade = type === 'upgrade';
  
  return (
    <Alert 
      variant="default"
      className={cn(
        isUpgrade 
          ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
          : 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
        className
      )}
    >
      {isUpgrade ? <Check className="size-4" /> : <Info className="size-4" />}
      <AlertTitle className="mb-1">
        {isUpgrade ? 'Plan Upgraded Successfully' : 'Plan Change Information'}
      </AlertTitle>
      <AlertDescription>
        {isUpgrade ? (
          <p>
            Your account has been upgraded to Premium. All your conversation history, 
            preferences, and settings have been preserved. You now have unlimited conversations!
          </p>
        ) : (
          <p>
            When you downgrade your plan, all your conversation history, preferences, and settings 
            will be preserved. You&apos;ll be limited to 20 conversations per day on the free plan.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}