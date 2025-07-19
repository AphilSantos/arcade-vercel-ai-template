import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { editImages } from '@/lib/imagerouter';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const prompt = formData.get('prompt') as string;
        const imageFiles = formData.getAll('images') as File[];
        const maskFiles = formData.getAll('masks') as File[];

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        if (!imageFiles || imageFiles.length === 0) {
            return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
        }

        // Edit images
        const result = await editImages(
            prompt,
            imageFiles,
            maskFiles.length > 0 ? maskFiles : undefined
        );

        return NextResponse.json({
            ...result,
            model_used: 'HiDream-ai/HiDream-I1-Full:free'
        });

    } catch (error) {
        console.error('Image editing error:', error);
        return NextResponse.json(
            { error: 'Failed to edit images' },
            { status: 500 }
        );
    }
}