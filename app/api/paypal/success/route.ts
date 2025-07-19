import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { paypalService } from '@/lib/paypal';
import { subscriptionService } from '@/lib/subscription';

/**
 * Handle successful PayPal subscription approval
 * 
 * This endpoint is called when the user successfully approves the subscription
 * and upgrades them to the paid plan
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get('subscription_id');
    
    if (!subscriptionId) {
      return NextResponse.redirect(new URL('/subscription?error=missing_subscription_id', req.url));
    }
    
    // Get subscription details to verify it's active
    const subscription = await paypalService.getSubscriptionDetails(subscriptionId);
    
    if (subscription.status === 'ACTIVE' || subscription.status === 'APPROVED') {
      // Upgrade user to paid plan
      await subscriptionService.upgradeToPaid(userId, subscriptionId);
      
      console.log(`User ${userId} successfully upgraded to paid plan with subscription ${subscriptionId}`);
      
      // Redirect to success page
      return NextResponse.redirect(new URL('/subscription?success=true', req.url));
    } else {
      console.error(`Subscription ${subscriptionId} is not active (status: ${subscription.status})`);
      return NextResponse.redirect(new URL('/subscription?error=subscription_not_active', req.url));
    }
    
  } catch (error) {
    console.error('Error processing PayPal success callback:', error);
    return NextResponse.redirect(new URL('/subscription?error=processing_failed', req.url));
  }
}