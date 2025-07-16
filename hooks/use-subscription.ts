import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import type { UserPlan } from '@/lib/subscription';

interface SubscriptionData {
  plan: UserPlan;
  remainingConversations: number;
  isLoading: boolean;
  error?: string;
  refresh?: () => void;
}

/**
 * Custom hook to manage subscription data and state
 */
export function useSubscription(userId?: string): SubscriptionData {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    plan: 'free',
    remainingConversations: 5,
    isLoading: true,
  });

  // Fetch subscription data from API
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/subscription/status` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
      errorRetryCount: 3, // Retry failed requests up to 3 times
    }
  );

  useEffect(() => {
    if (data) {
      console.log('Subscription data received:', data);
      setSubscriptionData({
        plan: data.plan || 'free',
        remainingConversations: data.remaining !== undefined ? data.remaining : 5,
        isLoading: false,
      });
    } else if (error) {
      console.error('Error fetching subscription data:', error);
      setSubscriptionData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load subscription data',
      }));
    }
  }, [data, error]);

  // Return subscription data and helper functions
  return {
    ...subscriptionData,
    isLoading: isLoading || subscriptionData.isLoading,
    error: error ? 'Failed to load subscription data' : subscriptionData.error,
    // Helper function to refresh subscription data
    refresh: () => {
      console.log('Refreshing subscription data');
      return mutate();
    },
  } as SubscriptionData & { refresh: () => void };
}