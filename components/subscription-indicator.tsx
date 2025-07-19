'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Crown, AlertTriangle, Info, } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { UserPlan } from '@/lib/subscription';

interface SubscriptionIndicatorProps {
  plan: UserPlan;
  remainingConversations?: number;
  isLoading?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Compact subscription status indicator for integration into chat interface
 */
export function SubscriptionIndicator({
  plan,
  remainingConversations = 0,
  isLoading = false,
  compact = false,
  className,
}: SubscriptionIndicatorProps) {
  const [upgrading, setUpgrading] = useState(false);
  const router = useRouter();

  const handleUpgradeClick = () => {
    setUpgrading(true);
    try {
      // Navigate to account settings page instead of PayPal checkout
      router.push('/account');
      toast.success('Redirecting to account settings');
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Unable to navigate to account settings. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-6 bg-muted rounded w-24" />
      </div>
    );
  }

  // Compact version for header/toolbar
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {plan === 'paid' ? (
          <Badge variant="default" className="bg-green-600 text-white">
            <Crown className="size-3 mr-1" />
            Premium
          </Badge>
        ) : (
          <Badge 
            variant={remainingConversations <= 5 ? (remainingConversations === 0 ? 'destructive' : 'outline') : 'secondary'}
            className={cn(
              "cursor-pointer",
              remainingConversations <= 5 && remainingConversations > 0 && "border-amber-500 text-amber-500",
              upgrading && "opacity-70"
            )}
            onClick={upgrading ? undefined : handleUpgradeClick}
          >
            {upgrading ? (
              <Loader2 className="size-3 mr-1 animate-spin" />
            ) : remainingConversations <= 5 && remainingConversations > 0 && (
              <AlertTriangle className="size-3 mr-1" />
            )}
            {remainingConversations}/5
          </Badge>
        )}
      </div>
    );
  }

  // Full version for dedicated display
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {plan === 'paid' ? (
              <>
                <Crown className="size-4 text-yellow-500" />
                <Badge variant="default" className="bg-green-600">Premium</Badge>
              </>
            ) : (
              <>
                <Info className="size-4 text-blue-500" />
                <Badge variant="secondary">Free</Badge>
              </>
            )}
          </div>
          
          {plan === 'free' && (
            <Button 
              size="sm" 
              onClick={handleUpgradeClick}
              disabled={upgrading}
              className="h-7 px-3 text-xs"
            >
              {upgrading ? 'Loading...' : 'Upgrade'}
            </Button>
          )}
        </div>

        {plan === 'free' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Daily conversations:</span>
              <span className={cn(
                'font-medium',
                remainingConversations <= 5 && remainingConversations > 0 && 'text-amber-500',
                remainingConversations === 0 && 'text-red-500'
              )}>
                {remainingConversations} / 5
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  remainingConversations <= 5 
                    ? 'bg-amber-500' 
                    : remainingConversations === 0 
                      ? 'bg-red-500' 
                      : 'bg-blue-600'
                )}
                style={{ width: `${(remainingConversations / 5) * 100}%` }}
              />
            </div>
            
            {remainingConversations <= 5 && remainingConversations > 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="size-3" />
                Running low on conversations today
              </p>
            )}
            
            {remainingConversations === 0 && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="size-3" />
                Daily limit reached. Upgrade to continue chatting.
              </p>
            )}
          </div>
        )}

        {plan === 'paid' && (
          <p className="text-sm text-muted-foreground">
            Unlimited conversations included
          </p>
        )}
      </CardContent>
    </Card>
  );
}