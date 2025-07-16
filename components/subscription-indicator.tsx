'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Crown, AlertTriangle, Info, AlertCircle } from 'lucide-react';
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

  const handleUpgradeClick = async () => {
    setUpgrading(true);
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Extract error message from response if available
        const errorMessage = data.message || data.error || 'Failed to create subscription';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      if (data.approvalUrl) {
        toast.success('Redirecting to PayPal for checkout');
        router.push(data.approvalUrl);
      } else {
        toast.error('No approval URL returned from payment service');
      }
    } catch (error) {
      console.error('Failed to create subscription:', error);
      toast.error('Unable to start the upgrade process. Please try again later.');
    } finally {
      setUpgrading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-6 bg-muted rounded w-24"></div>
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