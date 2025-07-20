import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { arcadeServer } from '@/lib/arcade/server';
import { formatOpenAIToolNameToArcadeToolName } from '@/lib/arcade/utils';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { toolName } = await request.json();
    if (!toolName) {
      return NextResponse.json({ error: 'Missing tool name' }, { status: 400 });
    }

    if (!arcadeServer) {
      return NextResponse.json(
        { error: 'Arcade server not initialized' },
        { status: 500 },
      );
    }

    const formattedToolName = formatOpenAIToolNameToArcadeToolName(toolName);
    const authResponse = await arcadeServer.client.tools.authorize({
      tool_name: formattedToolName,
      user_id: session.user.id,
    });

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Error in auth check endpoint', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}