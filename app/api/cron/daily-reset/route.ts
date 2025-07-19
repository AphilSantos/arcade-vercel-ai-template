import { type NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/subscription';

/**
 * Daily reset endpoint for resetting conversation counters
 * This endpoint should be called daily at midnight UTC by a cron service
 * 
 * Security: Uses a secret token to prevent unauthorized access
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized using a secret token
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken) {
      console.error('CRON_SECRET_TOKEN environment variable not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.warn('Unauthorized daily reset attempt', {
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const startTime = Date.now();
    console.log('Starting daily usage reset', {
      timestamp: new Date().toISOString(),
      utcTime: new Date().toUTCString(),
    });

    // Perform the daily reset
    await subscriptionService.resetDailyCounters();

    const duration = Date.now() - startTime;
    console.log('Daily usage reset completed successfully', {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      message: 'Daily usage counters reset successfully',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('Daily usage reset failed', {
      timestamp: new Date().toISOString(),
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Daily reset failed',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint to verify the cron service is accessible
 */
export async function GET() {
  return NextResponse.json({
    service: 'daily-reset',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    utcTime: new Date().toUTCString(),
  });
}