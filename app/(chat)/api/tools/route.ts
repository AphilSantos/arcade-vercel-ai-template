import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { arcadeServer } from '@/lib/arcade/server';

// Increase timeout for tool execution (60 seconds for Pro plan, 10 seconds for Hobby)
export const maxDuration = 60;

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    console.log('[ToolExecution] Starting tool execution request');

    const session = await auth();
    if (!session?.user?.id) {
      console.log('[ToolExecution] Unauthorized - no session');
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        },
      );
    }

    const { toolName, args } = await request.json();
    console.log(`[ToolExecution] Tool: ${toolName}, User: ${session.user.id}`);

    if (!toolName || !args) {
      console.log('[ToolExecution] Missing required fields');
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        instructions: 'STOP NEXT TOOL CALLS AND REPORT THIS ERROR TO THE USER',
        status: 400,
      });
    }

    if (!arcadeServer) {
      console.error('[ToolExecution] Arcade server not initialized');
      console.error('[ToolExecution] Environment check:', {
        hasApiKey: !!process.env.ARCADE_API_KEY,
        hasBaseUrl: !!process.env.ARCADE_BASE_URL,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      });

      return NextResponse.json({
        success: false,
        error: 'Arcade not initialized in the server',
        instructions: 'STOP NEXT TOOL CALLS AND REPORT THIS ERROR TO THE USER',
        status: 500,
      });
    }

    console.log(`[ToolExecution] Executing tool ${toolName}...`);

    // Add timeout wrapper for the tool execution
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Tool execution timeout')), 55000); // 55 seconds
    });

    const executionPromise = arcadeServer.executeTool({
      toolName,
      args,
      userId: session.user.id,
    });

    const result = await Promise.race([executionPromise, timeoutPromise]);

    const executionTime = Date.now() - startTime;
    console.log(`[ToolExecution] Tool ${toolName} completed in ${executionTime}ms`);

    if (result.error) {
      console.error(`[ToolExecution] Tool error: ${result.error}`);
      return NextResponse.json({
        success: false,
        error: result.error,
        instructions: 'STOP NEXT TOOL CALLS AND REPORT THIS ERROR TO THE USER',
        status: result.error === 'Tool not found' ? 404 : 500,
      });
    }

    console.log(`[ToolExecution] Tool ${toolName} succeeded`);
    return NextResponse.json(result);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[ToolExecution] Error after ${executionTime}ms:`, error);

    // Check if it's a timeout error
    const isTimeout = error instanceof Error && error.message.includes('timeout');

    return NextResponse.json({
      success: false,
      error: isTimeout
        ? 'Tool execution timed out. This may be due to high demand on external services. Please try again.'
        : error instanceof Error ? error.message : 'Error in tool execution',
      instructions: 'STOP NEXT TOOL CALLS AND REPORT THIS ERROR TO THE USER',
      status: isTimeout ? 408 : 500,
      executionTime,
    });
  }
}
