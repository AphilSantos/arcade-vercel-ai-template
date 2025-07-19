import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { subscriptionService } from '@/lib/subscription';
import { paypalService } from '@/lib/paypal';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user } from '@/lib/db/schema';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Get the current subscription status for the authenticated user
 * 
 * Returns plan type, remaining usage for free users, and subscription details for paid users
 */
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
    
    try {
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
        const [userData] = await db
          .select({ paypalSubscriptionId: user.paypalSubscriptionId })
          .from(user)
          .where(eq(user.id, userId));
        
        if (userData?.paypalSubscriptionId) {
          try {
            const subscriptionDetails = await paypalService.getSubscriptionDetails(
              userData.paypalSubscriptionId
            );
            
            response.subscription = {
              id: subscriptionDetails.id,
              status: subscriptionDetails.status,
              // Note: In a real implementation, you would extract the next billing date
              // from the PayPal subscription details
              nextBillingDate: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString().split('T')[0], // Placeholder: 30 days from now
            };
          } catch (error) {
            console.error('Failed to get subscription details from PayPal:', error);
            // Continue without subscription details
          }
        }
      }
    
      return NextResponse.json(response);
    } catch (error) {
      console.error('Error processing subscription data:', error);
      return NextResponse.json(
        { error: 'Failed to process subscription data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to get subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}