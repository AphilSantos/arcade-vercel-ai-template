import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { arcadeServer } from '@/lib/arcade/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.log('Unauthorized: No user session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session user ID:', session.user.id);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('ARCADE_API_KEY exists:', !!process.env.ARCADE_API_KEY);
    console.log('ARCADE_BASE_URL:', process.env.ARCADE_BASE_URL);

    if (!arcadeServer) {
      const errorMsg = 'Arcade server not initialized - check if ARCADE_API_KEY is set';
      console.error(errorMsg);
      return NextResponse.json(
        { 
          error: 'Arcade not properly initialized',
          details: process.env.NODE_ENV === 'development' 
            ? 'Check if ARCADE_API_KEY is set in your environment variables'
            : 'Server configuration issue',
          environment: process.env.NODE_ENV,
          hasApiKey: !!process.env.ARCADE_API_KEY,
          hasBaseUrl: !!process.env.ARCADE_BASE_URL
        },
        { status: 500 },
      );
    }

    try {
      console.log('Fetching toolkits from Arcade server...');
      const toolkits = await arcadeServer.getToolkits();
      console.log('Received toolkits:', toolkits);
      
      if (!Array.isArray(toolkits)) {
        console.error('Unexpected toolkits format:', toolkits);
        return NextResponse.json(
          { 
            error: 'Invalid toolkits format',
            receivedType: typeof toolkits,
            receivedValue: toolkits
          },
          { status: 500 },
        );
      }

      console.log(`Returning ${toolkits.length} toolkits`);
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
