import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { arcadeServer } from '@/lib/arcade/server';

export const maxDuration = 120;

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    console.log('[AuthWait] Starting wait for completion request');

    const session = await auth();
    if (!session?.user?.id) {
      console.log('[AuthWait] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { authId } = await request.json();
    if (!authId) {
      console.log('[AuthWait] Missing auth ID');
      return NextResponse.json({ error: 'Missing auth ID' }, { status: 400 });
    }

    console.log(`[AuthWait] Waiting for auth completion: ${authId}, User: ${session.user.id}`);

    if (!arcadeServer) {
      console.error('[AuthWait] Arcade server not initialized');
      console.error('[AuthWait] Environment check:', {
        hasApiKey: !!process.env.ARCADE_API_KEY,
        hasBaseUrl: !!process.env.ARCADE_BASE_URL,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      });

      return NextResponse.json(
        { error: 'Arcade server not initialized' },
        { status: 500 },
      );
    }

    // Execute wait for completion directly - let Vercel's maxDuration handle timeouts
    const authResponse = await arcadeServer.client.auth.waitForCompletion(authId);

    const executionTime = Date.now() - startTime;
    console.log(`[AuthWait] Wait completed in ${executionTime}ms:`, authResponse);

    return NextResponse.json(authResponse);
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[AuthWait] Error after ${executionTime}ms:`, error);

    const isTimeout = error instanceof Error && error.message.includes('timeout');

    return NextResponse.json(
      {
        error: isTimeout
          ? 'Authorization wait timed out. The authorization may still be in progress.'
          : 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      },
      { status: isTimeout ? 408 : 500 },
    );
  }
}
