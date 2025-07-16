'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlan } from '@/lib/subscription';

interface SubscriptionStatusProps {
  plan: UserPlan;
  remainingConversations?: number;
  onUpgradeClick?: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * Component to display the user's subscription status and remaining conversations
 * Includes an upgrade button for free users
 */
export function SubscriptionStatus({
  plan,
  remainingConversations = 0,
  onUpgradeClick,
  isLoading = false,
}: SubscriptionStatusProps) {
  const [upgrading, setUpgrading] = useState(false);
  const router = useRouter();

  const handleUpgradeClick = async () => {
    if (onUpgradeClick) {
      setUpgrading(true);
      try {
        await onUpgradeClick();
      } catch (error) {
        console.error('Failed to start upgrade process:', error);
      } finally {
        setUpgrading(false);
      }
    } else {
      // Default behavior - redirect to a subscription API route
      setUpgrading(true);
      try {
        const response = await fetch('/api/subscription/create', {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error('Failed to create subscription');
        }
        
        const data = await response.json();
        
        // Redirect to PayPal checkout
        if (data.approvalUrl) {
          router.push(data.approvalUrl);
        }
      } catch (error) {
        console.error('Failed to create subscription:', error);
      } finally {
        setUpgrading(false);
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Subscription Plan</CardTitle>
          {plan === 'paid' ? (
            <Badge variant="default" className="bg-green-600">Premium</Badge>
          ) : (
            <Badge variant="secondary">Free</Badge>
          )}
        </div>
        <CardDescription>
          {plan === 'paid'
            ? 'You have unlimited conversations with our AI assistant.'
            : 'Free plan includes 20 conversations per day.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {plan === 'free' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Remaining today:</span>
              <span className={`font-bold ${remainingConversations <= 5 ? 'text-amber-500' : ''} ${remainingConversations === 0 ? 'text-red-500' : ''}`}>
                {remainingConversations} / 20
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className={`h-2.5 rounded-full ${
                  remainingConversations <= 5 
                    ? 'bg-amber-500' 
                    : remainingConversations === 0 
                      ? 'bg-red-500' 
                      : 'bg-blue-600'
                }`}
                style={{ width: `${(remainingConversations / 20) * 100}%` }}
              ></div>
            </div>
            
            {remainingConversations <= 5 && remainingConversations > 0 && (
              <p className="text-sm text-amber-500">
                You&apos;re running low on conversations today. Consider upgrading to our premium plan.
              </p>
            )}
            
            {remainingConversations === 0 && (
              <p className="text-sm text-red-500">
                You&apos;ve reached your daily limit. Upgrade to continue chatting.
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {plan === 'free' && (
          <Button 
            onClick={handleUpgradeClick} 
            disabled={upgrading || isLoading}
          >
            {upgrading ? 'Redirecting to PayPal...' : 'Upgrade to Premium ($10/month)'}
          </Button>
        )}
        {plan === 'paid' && (
          <Button 
            variant="outline" 
            onClick={() => router.push('/account/subscription')}
          >
            Manage Subscription
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * Server component wrapper to fetch subscription data and render the SubscriptionStatus component
 */
export async function SubscriptionStatusServer({ userId }: { userId: string }) {
  // This would be implemented when the API routes are created
  // For now, we'll just return a placeholder
  return (
    <div className="p-4">
      <p className="text-sm text-muted-foreground mb-2">
        This is a server component placeholder. The actual implementation would fetch data from the API.
      </p>
    </div>
  );
}