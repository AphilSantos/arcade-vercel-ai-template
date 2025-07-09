import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { arcadeServer } from '@/lib/arcade/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!arcadeServer) {
      console.error('Arcade server not initialized - check if ARCADE_API_KEY is set');
      return NextResponse.json(
        { 
          error: 'Arcade not properly initialized',
          details: process.env.NODE_ENV === 'development' 
            ? 'Check if ARCADE_API_KEY is set in your environment variables'
            : undefined
        },
        { status: 500 },
      );
    }

    try {
      const toolkits = await arcadeServer.getToolkits();
      
      if (!Array.isArray(toolkits)) {
        console.error('Unexpected toolkits format:', toolkits);
        return NextResponse.json(
          { error: 'Invalid toolkits format' },
          { status: 500 },
        );
      }

      return NextResponse.json(toolkits);
    } catch (toolkitError) {
      console.error('Error fetching toolkits:', toolkitError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch toolkits',
          details: process.env.NODE_ENV === 'development' 
            ? toolkitError instanceof Error ? toolkitError.message : String(toolkitError)
            : undefined
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error in toolkits endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : String(error)
          : undefined
      },
      { status: 500 },
    );
  }
}
