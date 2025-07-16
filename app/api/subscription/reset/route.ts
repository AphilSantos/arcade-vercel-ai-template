import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { subscriptionService } from '@/lib/subscription';
import { SubscriptionError, SubscriptionErrors, handleSubscriptionError } from '@/lib/errors/subscription-errors';

/**
 * Reset daily usage counters for all free users
 * This is a temporary endpoint for debugging purposes
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    
    if (!session?.user?.id) {
      const error = SubscriptionErrors.authenticationRequired();
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    
    try {
      // Reset daily counters for all free users
      await subscriptionService.resetDailyCounters();
      
      return NextResponse.json({
        message: 'Daily usage counters reset successfully',
      });
    } catch (error) {
      console.error('Failed to reset daily usage counters:', error);
      
      // Convert to SubscriptionError if it's not already
      const subscriptionError = error instanceof SubscriptionError 
        ? error 
        : handleSubscriptionError(error, 'resetDailyCounters');
      
      return NextResponse.json(
        subscriptionError.toJSON(),
        { status: subscriptionError.statusCode }
      );
    }
  } catch (error) {
    console.error('Failed to reset daily usage counters:', error);
    
    // Convert to SubscriptionError if it's not already
    const subscriptionError = error instanceof SubscriptionError 
      ? error 
      : handleSubscriptionError(error, 'resetDailyCounters');
    
    return NextResponse.json(
      subscriptionError.toJSON(),
      { status: subscriptionError.statusCode }
    );
  }
}