import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { subscriptionService } from '@/lib/subscription';

/**
 * Increment the daily conversation usage for the authenticated user
 * 
 * This is an internal API endpoint used by the chat system
 * It should only be called when a new conversation is started
 */
export async function POST(req: NextRequest) {
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
    
    // Check if user can start a conversation
    const canStart = await subscriptionService.canStartConversation(userId);
    
    if (!canStart) {
      return NextResponse.json(
        { 
          error: 'Daily conversation limit reached',
          message: 'You have reached your daily conversation limit. Please upgrade to a paid plan for unlimited conversations.'
        },
        { status: 403 }
      );
    }
    
    // Increment usage counter
    await subscriptionService.incrementDailyUsage(userId);
    
    // Get updated remaining count
    const remaining = await subscriptionService.getDailyUsageRemaining(userId);
    
    return NextResponse.json({
      success: true,
      remaining,
    });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return NextResponse.json(
      { error: 'Failed to increment usage' },
      { status: 500 }
    );
  }
}