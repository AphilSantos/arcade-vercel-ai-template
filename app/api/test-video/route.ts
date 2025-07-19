import { NextRequest, NextResponse } from 'next/server';
import { generateVideo } from '@/lib/imagerouter';

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json();

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        console.log(`Testing video generation with prompt: "${prompt}"`);

        // Test video generation
        const result = await generateVideo(prompt);

        return NextResponse.json({
            success: true,
            message: 'Video generation test successful',
            result: {
                ...result,
                model_used: 'minimax/hailuo-02-standard'
            }
        });

    } catch (error) {
        console.error('Video generation test error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            message: 'Video generation test failed'
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Video generation test endpoint',
        usage: 'POST with { "prompt": "your video prompt" }',
        model: 'minimax/hailuo-02-standard',
        endpoint: 'https://api.imagerouter.io/v1/openai/videos/generations'
    });
}