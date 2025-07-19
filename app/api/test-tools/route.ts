import { NextResponse } from 'next/server';
import { generateImageTool } from '@/lib/tools/image-tools';

export async function POST() {
    try {
        console.log('[TestTools] Testing image generation tool...');

        const result = await generateImageTool.execute({ prompt: 'a simple test image' });

        console.log('[TestTools] Tool execution result:', result);

        return NextResponse.json({
            success: true,
            result: result,
        });

    } catch (error) {
        console.error('[TestTools] Error testing tools:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}