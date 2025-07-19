import { type NextRequest, NextResponse } from 'next/server';
import { paypalService } from '@/lib/paypal';
import { subscriptionService } from '@/lib/subscription';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user } from '@/lib/db/schema';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * PayPal webhook handler
 * 
 * Processes webhook events from PayPal for subscription management:
 * - BILLING.SUBSCRIPTION.CREATED: Upgrade user to paid plan
 * - BILLING.SUBSCRIPTION.CANCELLED: Downgrade user to free plan
 * - BILLING.SUBSCRIPTION.PAYMENT.FAILED: Handle payment failures
 */
export async function POST(req: NextRequest) {
  try {
    // Get the raw request body for signature verification
    const rawBody = await req.text();
    
    // Verify webhook signature
    const headers = Object.fromEntries(req.headers.entries());
    const isValid = await paypalService.verifyWebhook(headers, rawBody);
    
    if (!isValid) {
      console.error('Invalid PayPal webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }
    
    // Parse the webhook event
    const event = JSON.parse(rawBody);
    const eventType = event.event_type;
    const resource = event.resource;
    
    console.log(`Processing PayPal webhook event: ${eventType}`);
    
    // Handle different event types
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.CREATED':
        await handleSubscriptionCreated(resource);
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(resource);
        break;
        
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handlePaymentFailed(resource);
        break;
        
      default:
        console.log(`Ignoring unhandled event type: ${eventType}`);
    }
    
    return NextResponse.json({ status: 'success' });
    
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    
    // Log the error but return 200 to prevent PayPal from retrying
    // In a production environment, you might want to implement retry logic
    return NextResponse.json(
      { status: 'error', message: 'Error processing webhook' },
      { status: 200 }
    );
  }
}

/**
 * Handle subscription created event
 * @param resource - The subscription resource from PayPal
 */
async function handleSubscriptionCreated(resource: any) {
  try {
    const subscriptionId = resource.id;
    
    // Get subscription details to verify status and get subscriber info
    const subscription = await paypalService.getSubscriptionDetails(subscriptionId);
    
    if (subscription.status === 'ACTIVE' || subscription.status === 'APPROVED') {
      // For subscription created events, we need to find the user by email or other identifier
      // Since we don't have a direct user mapping, we'll log this for manual processing
      // In a production system, you'd want to store a mapping during subscription creation
      console.log(`Active subscription ${subscriptionId} created for email: ${subscription.subscriber?.emailAddress}`);
      
      // Find user by email
      if (subscription.subscriber?.emailAddress) {
        const [userData] = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.email, subscription.subscriber.emailAddress));
        
        if (userData) {
          // Upgrade user to paid plan with data preservation
          await subscriptionService.upgradeToPaid(userData.id, subscriptionId);
          console.log(`User ${userData.id} upgraded to paid plan with subscription ${subscriptionId}`);
          
          // Note: In a production environment, you might want to notify the user about the successful upgrade
          // This could be done via email, in-app notification, etc.
          // We'll handle this in the frontend with the plan change notification component
        } else {
          console.log(`No user found with email ${subscription.subscriber.emailAddress}`);
        }
      }
    } else {
      console.log(`Subscription ${subscriptionId} created but not active (status: ${subscription.status})`);
    }
  } catch (error) {
    console.error('Error handling subscription created event:', error);
    throw error; // Rethrow to be caught by the main handler
  }
}

/**
 * Handle subscription cancelled event
 * @param resource - The subscription resource from PayPal
 */
async function handleSubscriptionCancelled(resource: any) {
  try {
    const subscriptionId = resource.id;
    
    // Find user with this subscription ID
    const [userData] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.paypalSubscriptionId, subscriptionId));
    
    if (!userData) {
      console.error(`No user found with subscription ID ${subscriptionId}`);
      return;
    }
    
    // Downgrade user to free plan
    await subscriptionService.downgradeToFree(userData.id);
    console.log(`User ${userData.id} downgraded to free plan after subscription ${subscriptionId} cancellation`);
  } catch (error) {
    console.error('Error handling subscription cancelled event:', error);
    throw error; // Rethrow to be caught by the main handler
  }
}

/**
 * Handle payment failed event
 * @param resource - The subscription resource from PayPal
 */
async function handlePaymentFailed(resource: any) {
  try {
    const subscriptionId = resource.id;
    
    // Find user with this subscription ID
    const [userData] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.paypalSubscriptionId, subscriptionId));
    
    if (!userData) {
      console.error(`No user found with subscription ID ${subscriptionId}`);
      return;
    }
    
    // Get subscription details to check status
    const subscription = await paypalService.getSubscriptionDetails(subscriptionId);
    
    // If subscription is suspended or cancelled due to payment failure, downgrade user
    if (subscription.status === 'SUSPENDED' || subscription.status === 'CANCELLED') {
      await subscriptionService.downgradeToFree(userData.id);
      console.log(`User ${userData.id} downgraded to free plan after payment failure for subscription ${subscriptionId}`);
    } else {
      console.log(`Payment failed for subscription ${subscriptionId} but status is ${subscription.status}, not downgrading user yet`);
    }
    
    // Note: In a production environment, you might want to notify the user about the payment failure
    // This could be done via email, in-app notification, etc.
  } catch (error) {
    console.error('Error handling payment failed event:', error);
    throw error; // Rethrow to be caught by the main handler
  }
}