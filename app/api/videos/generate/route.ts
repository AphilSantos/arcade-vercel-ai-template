import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateVideo } from '@/lib/imagerouter';

export const maxDuration = 300; // 5 minutes for video generation

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prompt } = await req.json();

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Generate video
        const result = await generateVideo(prompt);

        return NextResponse.json({
            ...result,
            model_used: 'minimax/hailuo-02-standard'
        });

    } catch (error) {
        console.error('Video generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate video' },
            { status: 500 }
        );
    }
}