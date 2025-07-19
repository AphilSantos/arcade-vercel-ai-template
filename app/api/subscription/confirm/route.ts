import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { subscriptionService } from '@/lib/subscription';
import { SubscriptionError, SubscriptionErrors, handleSubscriptionError } from '@/lib/errors/subscription-errors';

/**
 * Confirm a PayPal subscription for the authenticated user
 * 
 * This endpoint is called after the user approves the subscription in PayPal
 * and updates the user's subscription status in the database
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
    
    // Get the subscription ID from the request body
    let subscriptionId;
    try {
      const body = await req.json();
      subscriptionId = body.subscriptionId;
    } catch (e) {
      const error = SubscriptionErrors.validationError('subscriptionId', 'missing');
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    
    if (!subscriptionId) {
      const error = SubscriptionErrors.validationError('subscriptionId', subscriptionId);
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    
    try {
      // Update the user's subscription status in the database
      await subscriptionService.upgradeToPaid(userId, subscriptionId);
      
      return NextResponse.json({
        success: true,
        message: 'Subscription confirmed successfully.'
      });
    } catch (error) {
      console.error('Failed to confirm subscription:', error);
      
      // Convert to SubscriptionError if it's not already
      const subscriptionError = error instanceof SubscriptionError 
        ? error 
        : handleSubscriptionError(error, 'confirmSubscription');
      
      return NextResponse.json(
        subscriptionError.toJSON(),
        { status: subscriptionError.statusCode }
      );
    }
  } catch (error) {
    console.error('Failed to confirm subscription:', error);
    
    // Convert to SubscriptionError if it's not already
    const subscriptionError = error instanceof SubscriptionError 
      ? error 
      : handleSubscriptionError(error, 'confirmSubscription');
    
    return NextResponse.json(
      subscriptionError.toJSON(),
      { status: subscriptionError.statusCode }
    );
  }
}