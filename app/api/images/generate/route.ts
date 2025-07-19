import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateImages } from '@/lib/imagerouter';

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

        // Generate images using both models
        const results = await generateImages(prompt);

        // Combine results from both models
        const allImages = results.flatMap(result => result.data);

        return NextResponse.json({
            data: allImages,
            created: Date.now(),
            models_used: ['stabilityai/sdxl-turbo:free', 'black-forest-labs/FLUX-1-schnell:free']
        });

    } catch (error) {
        console.error('Image generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate images' },
            { status: 500 }
        );
    }
}