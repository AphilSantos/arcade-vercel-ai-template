import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { paypalService } from '@/lib/paypal';
import { subscriptionService } from '@/lib/subscription';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user } from '@/lib/db/schema';
import { SubscriptionError, SubscriptionErrors, handleSubscriptionError } from '@/lib/errors/subscription-errors';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Cancel a user's PayPal subscription
 * 
 * This endpoint cancels the subscription in PayPal and updates the user's plan
 * to revert to free at the end of the billing period
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    
    if (!session?.user?.id) {
      const error = SubscriptionErrors.authenticationRequired();
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    
    const userId = session.user.id;
    
    // Get the reason from the request body
    let reason;
    try {
      const body = await req.json();
      reason = body.reason;
    } catch (e) {
      // If request body parsing fails, use default reason
      reason = 'User requested cancellation';
    }
    
    // Get user's PayPal subscription ID
    const [userData] = await db
      .select({ paypalSubscriptionId: user.paypalSubscriptionId })
      .from(user)
      .where(eq(user.id, userId));
    
    if (!userData?.paypalSubscriptionId) {
      const error = SubscriptionErrors.subscriptionNotFound(userId);
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    
    try {
      // Cancel subscription in PayPal
      await paypalService.cancelSubscription(
        userData.paypalSubscriptionId,
        reason || 'User requested cancellation'
      );
      
      // Note: We don't immediately downgrade the user to free plan
      // The webhook handler will handle this when PayPal sends the cancellation event
      // This ensures the user maintains access until the end of their billing period
      
      return NextResponse.json({
        message: 'Subscription cancelled successfully',
        note: 'Your subscription will remain active until the end of the current billing period',
        redirectUrl: '/account?planChanged=true&status=downgraded'
      });
    } catch (paypalError) {
      // Handle PayPal-specific errors
      if (paypalError instanceof Error) {
        const message = paypalError.message.toLowerCase();
        
        if (message.includes('timeout') || message.includes('network')) {
          const error = SubscriptionErrors.paypalServiceUnavailable();
          return NextResponse.json(error.toJSON(), { status: error.statusCode });
        }
      }
      
      throw paypalError; // Re-throw for general error handling
    }
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    
    // Convert to SubscriptionError if it's not already
    const subscriptionError = error instanceof SubscriptionError 
      ? error 
      : handleSubscriptionError(error, 'cancelSubscription');
    
    return NextResponse.json(
      subscriptionError.toJSON(),
      { status: subscriptionError.statusCode }
    );
  }
}