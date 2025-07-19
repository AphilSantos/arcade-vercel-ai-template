import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { paypalService } from '@/lib/paypal';
import { SubscriptionError, SubscriptionErrors, handleSubscriptionError } from '@/lib/errors/subscription-errors';

/**
 * Create a PayPal subscription for the authenticated user
 * 
 * This endpoint creates a subscription in PayPal and returns the subscription ID
 * for client-side approval flow
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
    
    // Get the plan ID from the request body or use default plan from environment variables
    let planId;
    try {
      const body = await req.json();
      planId = body.planId;
    } catch (e) {
      // If request body is empty, use default plan from environment variables
      planId = process.env.PAYPAL_PLAN_ID;
    }
    
    if (!planId) {
      console.error('No PayPal plan ID provided and PAYPAL_PLAN_ID environment variable is not set');
      const error = SubscriptionErrors.validationError('planId', 'missing');
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    
    console.log(`Using PayPal plan ID: ${planId}`);
    
    try {
      // Create subscription in PayPal
      const subscriptionId = await paypalService.createSubscription(planId);
      
      // Store the mapping between user and subscription for webhook processing
      // This will be handled when the user completes the approval flow
      
      // Construct the approval URL with a return URL that includes plan change notification parameters
      const baseApprovalUrl = `https://www.sandbox.paypal.com/webapps/billing/subscriptions?subscription_id=${subscriptionId}`;
      const returnUrl = encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || ''}/account?planChanged=true&status=upgraded`);
      
      return NextResponse.json({
        subscriptionId,
        approvalUrl: `${baseApprovalUrl}&returnUrl=${returnUrl}`,
        message: 'Subscription created successfully. Please complete the approval process.'
      });
    } catch (paypalError) {
      // Handle PayPal-specific errors
      if (paypalError instanceof Error) {
        const message = paypalError.message.toLowerCase();
        
        if (message.includes('timeout') || message.includes('network')) {
          const error = SubscriptionErrors.paypalServiceUnavailable();
          return NextResponse.json(error.toJSON(), { status: error.statusCode });
        }
        
        if (message.includes('payment') || message.includes('declined')) {
          const error = SubscriptionErrors.paymentFailed(paypalError.message);
          return NextResponse.json(error.toJSON(), { status: error.statusCode });
        }
      }
      
      throw paypalError; // Re-throw for general error handling
    }
  } catch (error) {
    console.error('Failed to create subscription:', error);
    
    // Convert to SubscriptionError if it's not already
    const subscriptionError = error instanceof SubscriptionError 
      ? error 
      : handleSubscriptionError(error, 'createSubscription');
    
    return NextResponse.json(
      subscriptionError.toJSON(),
      { status: subscriptionError.statusCode }
    );
  }
}