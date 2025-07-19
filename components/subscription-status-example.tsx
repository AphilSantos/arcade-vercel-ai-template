'use client';

import { useState } from 'react';
import { SubscriptionStatus } from './subscription-status';
import type { UserPlan } from '@/lib/subscription';

/**
 * Example component to demonstrate the SubscriptionStatus component
 */
export function SubscriptionStatusExample() {
  const [plan, setPlan] = useState<UserPlan>('free');
  const [remainingConversations, setRemainingConversations] = useState(15);

  const handleUpgradeClick = async () => {
    // This is just a mock implementation for the example
    // In a real application, this would call the API to create a PayPal subscription
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        alert('In a real app, this would redirect to PayPal checkout');
        resolve();
      }, 1000);
    });
  };

  const togglePlan = () => {
    setPlan(plan === 'free' ? 'paid' : 'free');
  };

  const decrementConversations = () => {
    setRemainingConversations(Math.max(0, remainingConversations - 1));
  };

  const resetConversations = () => {
    setRemainingConversations(20);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Subscription Status Example</h2>
      
      <div className="flex flex-col gap-4">
        <SubscriptionStatus 
          plan={plan} 
          remainingConversations={remainingConversations}
          onUpgradeClick={handleUpgradeClick}
        />
        
        <div className="flex gap-2 mt-4">
          <button 
            onClick={togglePlan}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Toggle Plan (Current: {plan})
          </button>
          
          {plan === 'free' && (
            <>
              <button 
                onClick={decrementConversations}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                disabled={remainingConversations === 0}
              >
                Use Conversation
              </button>
              
              <button 
                onClick={resetConversations}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Reset Conversations
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}