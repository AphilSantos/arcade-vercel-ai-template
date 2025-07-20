import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { arcadeServer } from '@/lib/arcade/server';
import { formatOpenAIToolNameToArcadeToolName } from '@/lib/arcade/utils';

// Increase timeout for tool authorization
export const maxDuration = 60;

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    console.log('[ToolAuth] Starting authorization request');

    const session = await auth();
    if (!session?.user?.id) {
      console.log('[ToolAuth] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { toolName } = await request.json();
    if (!toolName) {
      console.log('[ToolAuth] Missing tool name');
      return NextResponse.json({ error: 'Missing tool name' }, { status: 400 });
    }

    console.log(`[ToolAuth] Authorizing tool: ${toolName}, User: ${session.user.id}`);

    if (!arcadeServer) {
      console.error('[ToolAuth] Arcade server not initialized');
      console.error('[ToolAuth] Environment check:', {
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

    const formattedToolName = formatOpenAIToolNameToArcadeToolName(toolName);
    console.log(`[ToolAuth] Formatted tool name: ${formattedToolName}`);

    // Execute authorization directly - let Vercel's maxDuration handle timeouts
    const authResponse = await arcadeServer.client.tools.authorize({
      tool_name: formattedToolName,
      user_id: session.user.id,
    });

    const executionTime = Date.now() - startTime;
    console.log(`[ToolAuth] Authorization completed in ${executionTime}ms:`, authResponse);

    return NextResponse.json(authResponse);
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[ToolAuth] Error after ${executionTime}ms:`, error);

    const isTimeout = error instanceof Error && error.message.includes('timeout');

    return NextResponse.json(
      {
        error: isTimeout
          ? 'Authorization timed out. Please try again.'
          : 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      },
      { status: isTimeout ? 408 : 500 },
    );
  }
}
