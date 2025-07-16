# Design Document

## Overview

The chat functionality issue appears to be related to the integration between the subscription system and the chat API route. The current implementation shows "Unknown test prompt!" instead of proper AI responses. This design document outlines the approach to fix this issue by ensuring proper integration between the subscription system and the chat functionality.

## Architecture

The chat system architecture consists of several key components:

1. **Chat Component (`components/chat.tsx`)**: The frontend component that handles user interactions and displays messages.
2. **Chat API Route (`app/(chat)/api/chat/route.ts`)**: The backend API that processes chat requests and generates AI responses.
3. **Subscription Service (`lib/subscription.ts`)**: Manages user subscription plans and usage tracking.
4. **Usage Middleware (`middleware/usage-check.ts`)**: Checks if users can start conversations based on their subscription plan.
5. **Subscription Status API (`app/api/subscription/status/route.ts`)**: Provides information about the user's current subscription status.

The issue appears to be in the integration between these components, particularly in how the chat API route interacts with the subscription service and how errors are handled.

## Components and Interfaces

### 1. Chat API Route

The chat API route needs to properly integrate with the subscription service to check if a user can start a conversation and handle errors appropriately:

```typescript
// app/(chat)/api/chat/route.ts
export async function POST(request: Request) {
  try {
    // ... existing code ...

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Check if the user can start a new conversation based on their subscription plan
    try {
      const canStart = await subscriptionService.canStartConversation(session.user.id);
      
      if (!canStart) {
        return new Response(
          JSON.stringify({
            error: 'Daily conversation limit reached',
            code: 'USAGE_LIMIT_EXCEEDED',
            message: 'You have reached your daily conversation limit. Please upgrade to continue chatting.'
          }),
          { 
            status: 429,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (error) {
      console.error('Error checking conversation limits:', error);
      // Continue with the request if there's an error checking limits
      // This prevents users from being blocked due to technical issues
    }

    // ... existing code ...

    // Increment usage counter for new conversations only
    if (!chat) {
      // ... existing code ...
      
      // Increment usage counter for new conversations only
      await incrementUsage(session.user.id);
    }

    // ... existing code ...
  } catch (error) {
    console.error('Error in chat route', error);
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
```

### 2. Chat Component

The chat component needs to properly handle subscription-related errors and display appropriate messages to the user:

```typescript
// components/chat.tsx
export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
  user,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  user: Session['user'] | undefined;
}) {
  // ... existing code ...

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    addToolResult,
  } = useChat({
    id,
    body: { id, selectedChatModel: selectedChatModel, selectedToolkits },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
      // Refresh subscription data after successful conversation
      if (subscription.refresh) {
        subscription.refresh();
      }
    },

    onError: (error) => {
      // Handle usage limit errors specifically
      if (error.message.includes('429') || error.message.includes('USAGE_LIMIT_EXCEEDED')) {
        toast.error('Daily conversation limit reached. Upgrade to continue chatting.', {
          action: {
            label: 'Upgrade',
            onClick: async () => {
              try {
                const response = await fetch('/api/subscription/create', {
                  method: 'POST',
                });
                
                if (response.ok) {
                  const data = await response.json();
                  if (data.approvalUrl) {
                    window.location.href = data.approvalUrl;
                  }
                }
              } catch (error) {
                console.error('Failed to create subscription:', error);
              }
            },
          },
        });
      } else {
        toast.error('An error occurred, please try again!');
      }
    },
  });

  // ... existing code ...
}
```

### 3. Subscription Hook

The subscription hook needs to properly fetch and refresh subscription data:

```typescript
// hooks/use-subscription.ts
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
    }
  );

  useEffect(() => {
    if (data) {
      setSubscriptionData({
        plan: data.plan,
        remainingConversations: data.remaining,
        isLoading: false,
      });
    } else if (error) {
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
    refresh: mutate,
  } as SubscriptionData & { refresh: () => void };
}
```

### 4. Subscription Status API

The subscription status API needs to return accurate information about the user's plan and usage:

```typescript
// app/api/subscription/status/route.ts
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get user's plan
    const plan = await subscriptionService.getUserPlan(userId);
    
    // Get subscription details
    const response: {
      plan: 'free' | 'paid';
      remaining?: number;
      subscription?: {
        id: string;
        status: string;
        nextBillingDate?: string;
      };
    } = { plan };
    
    if (plan === 'free') {
      // For free users, get remaining conversations
      const remaining = await subscriptionService.getDailyUsageRemaining(userId);
      
      // Debug log to help diagnose issues
      console.log(`API: User ${userId} has ${remaining} conversations remaining`);
      
      // Ensure we're returning the correct value
      response.remaining = remaining;
    } else {
      // For paid users, get subscription details from PayPal
      // ... existing code ...
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Failed to get subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}
```

## Data Models

The existing data models are sufficient for this fix. The key models are:

1. **User Plan**: `'free' | 'paid'`
2. **Subscription Data**:
   ```typescript
   interface SubscriptionData {
     plan: UserPlan;
     remainingConversations: number;
     isLoading: boolean;
     error?: string;
     refresh?: () => void;
   }
   ```

## Error Handling

### Chat API Errors

1. **Usage Limit Errors**: Return a 429 status code with a clear error message when a user reaches their daily conversation limit.
2. **Subscription Service Errors**: Log errors but allow the request to proceed to prevent users from being blocked due to technical issues.
3. **General Errors**: Return a 500 status code with a generic error message.

### Frontend Error Handling

1. **Usage Limit Errors**: Display a toast notification with an upgrade button.
2. **General Errors**: Display a generic error message and allow the user to retry.

## Verification Strategy

After implementing the fixes, we'll need to verify the functionality works correctly by:

1. Checking that free users can send messages when they have remaining conversations
2. Verifying that paid users can always send messages
3. Confirming that appropriate error messages are shown when limits are reached
4. Ensuring the subscription status is correctly displayed in the UI

## Implementation Plan

1. Fix the chat API route to properly integrate with the subscription service
2. Ensure the chat component properly handles subscription-related errors
3. Verify the subscription hook correctly fetches and refreshes subscription data
4. Test the integration between all components

## Security Considerations

1. Ensure proper authentication and authorization checks in all API routes
2. Validate user input to prevent injection attacks
3. Handle errors gracefully without exposing sensitive information

## Performance Considerations

1. Optimize subscription status checks to minimize latency
2. Use caching for subscription data to reduce database queries
3. Handle errors efficiently to prevent blocking the main thread