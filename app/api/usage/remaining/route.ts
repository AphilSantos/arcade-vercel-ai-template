import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

import { subscriptionService } from '@/lib/subscription';
import { SubscriptionError, SubscriptionErrors, handleSubscriptionError } from '@/lib/errors/subscription-errors';

/**
 * Get the remaining daily chat messages for the authenticated user
 * 
 * Returns:
 * - For free users: Number of remaining chat messages (0-20)
 * - For paid users: -1 (indicating unlimited)
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    
    if (!session?.user?.id) {
      const error = SubscriptionErrors.authenticationRequired();
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }

    const userId = session.user.id;
    
    try {
      // Get user's plan
      const plan = await subscriptionService.getUserPlan(userId);
      
      // Get remaining chat messages
      const remaining = await subscriptionService.getDailyUsageRemaining(userId);
      
      return NextResponse.json({
        plan,
        remaining,
        unlimited: plan === 'paid',
      });
    } catch (serviceError) {
      // Handle specific subscription service errors
      if (serviceError instanceof SubscriptionError) {
        return NextResponse.json(
          serviceError.toJSON(),
          { status: serviceError.statusCode }
        );
      }
      throw serviceError; // Re-throw for general error handling
    }
  } catch (error) {
    console.error('Error getting remaining chat messages:', error);
    
    // Convert to SubscriptionError if it's not already
    const subscriptionError = error instanceof SubscriptionError 
      ? error 
      : handleSubscriptionError(error, 'getRemainingChatMessages');
    
    return NextResponse.json(
      subscriptionError.toJSON(),
      { status: subscriptionError.statusCode }
    );
  }
}