import 'server-only';
import { type NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/subscription';
import { getToken } from 'next-auth/jwt';
import { SubscriptionError, SubscriptionErrors } from '@/lib/errors/subscription-errors';

/**
 * Middleware to check if a user can start a new conversation based on their subscription plan
 * 
 * @param req - The incoming request
 * @returns NextResponse with error or passes through to the next middleware/route handler
 */
export async function usageMiddleware(req: NextRequest) {
  try {
    // Get the user from the session
    const token = await getToken({ req });
    
    // If no user is authenticated, allow the request (auth middleware will handle this)
    if (!token || !token.sub) {
      return NextResponse.next();
    }
    
    const userId = token.sub;
    
    // Check if the user can start a conversation
    const canStart = await subscriptionService.canStartConversation(userId);
    
    if (!canStart) {
      // User has reached their daily limit
      const error = SubscriptionErrors.usageLimitExceeded();
      return NextResponse.json(
        error.toJSON(),
        { status: error.statusCode }
      );
    }
    
    // User can start a conversation, proceed with the request
    return NextResponse.next();
  } catch (error) {
    console.error('Error in usage middleware:', error);
    
    // Handle specific error types
    if (error instanceof SubscriptionError) {
      // For certain errors, we want to return a proper error response
      if (error.code === 'USER_NOT_FOUND' || error.code === 'VALIDATION_ERROR') {
        return NextResponse.json(
          error.toJSON(),
          { status: error.statusCode }
        );
      }
    }
    
    // For other errors, allow the request to proceed
    // This prevents users from being blocked due to technical issues
    return NextResponse.next();
  }
}

/**
 * Middleware to increment usage after a successful conversation start
 * 
 * @param userId - The user's ID
 */
export async function incrementUsage(userId: string): Promise<void> {
  try {
    await subscriptionService.incrementDailyUsage(userId);
  } catch (error) {
    console.error('Failed to increment usage for user:', userId, error);
    
    // Log detailed error information for monitoring
    if (error instanceof SubscriptionError) {
      console.error(`[SubscriptionError] Code: ${error.code}, Message: ${error.message}`);
      
      // For certain critical errors, we might want to implement additional handling
      // such as sending alerts to administrators
      if (error.code === 'DATABASE_ERROR') {
        // In a production environment, this could trigger an alert
        console.error('[CRITICAL] Database error in usage tracking');
      }
    }
    
    // Non-blocking error - we don't want to fail the request if tracking fails
  }
}