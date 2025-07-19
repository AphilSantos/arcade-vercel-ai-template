import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        message: 'Debug endpoint working',
        timestamp: new Date().toISOString(),
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        return NextResponse.json({
            message: 'Debug POST endpoint working',
            receivedBody: body,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json({
            error: 'Failed to parse request body',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 400 });
    }
}