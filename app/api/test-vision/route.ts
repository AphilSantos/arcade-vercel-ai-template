import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { imageUrl, question } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: 'No image URL provided' }, { status: 400 });
        }

        console.log('=== VISION TEST ===');
        console.log('Image URL:', imageUrl.substring(0, 100) + '...');
        console.log('Question:', question || 'Default description');

        // Convert blob URL to base64 if needed
        let processedUrl = imageUrl;
        if (imageUrl.startsWith('https://') && imageUrl.includes('vercel-storage.com')) {
            console.log('Converting blob URL to base64...');
            const response = await fetch(imageUrl);
            if (response.ok) {
                const buffer = await response.arrayBuffer();
                const base64 = Buffer.from(buffer).toString('base64');
                const contentType = response.headers.get('content-type') || 'image/jpeg';
                processedUrl = `data:${contentType};base64,${base64}`;
                console.log(`Converted to base64 (${buffer.byteLength} bytes)`);
            } else {
                console.error('Failed to fetch blob:', response.status, response.statusText);
                return NextResponse.json({
                    error: 'Failed to fetch image from blob storage',
                    status: response.status,
                    statusText: response.statusText
                }, { status: 400 });
            }
        }

        // Test with GPT-4o (vision model)
        const result = await generateText({
            model: openai('gpt-4o'),
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: question || 'Please describe this image in detail. What do you see?',
                        },
                        {
                            type: 'image',
                            image: processedUrl,
                        },
                    ],
                },
            ],
            maxTokens: 300,
        });

        console.log('Vision result:', result.text);

        return NextResponse.json({
            success: true,
            description: result.text,
            imageProcessed: processedUrl.startsWith('data:') ? 'base64' : 'url',
            model: 'gpt-4o',
        });

    } catch (error) {
        console.error('Vision test error:', error);
        return NextResponse.json(
            {
                error: 'Vision test failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}