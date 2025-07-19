import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { attachments } = await req.json();

        console.log('=== ATTACHMENT DEBUG ===');
        console.log('Number of attachments:', attachments?.length || 0);

        if (attachments && attachments.length > 0) {
            for (let i = 0; i < attachments.length; i++) {
                const attachment = attachments[i];
                console.log(`Attachment ${i + 1}:`, {
                    url: attachment.url,
                    name: attachment.name,
                    contentType: attachment.contentType,
                });

                // Test if we can fetch the attachment
                try {
                    const response = await fetch(attachment.url);
                    console.log(`Fetch test for attachment ${i + 1}:`, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: Object.fromEntries(response.headers.entries()),
                        contentLength: response.headers.get('content-length'),
                    });

                    // Try to get a small portion of the content
                    const buffer = await response.arrayBuffer();
                    console.log(`Content size: ${buffer.byteLength} bytes`);

                } catch (fetchError) {
                    console.error(`Failed to fetch attachment ${i + 1}:`, fetchError);
                }
            }
        }

        return NextResponse.json({
            success: true,
            attachmentCount: attachments?.length || 0,
            message: 'Debug info logged to console'
        });

    } catch (error) {
        console.error('Debug attachments error:', error);
        return NextResponse.json(
            { error: 'Failed to debug attachments' },
            { status: 500 }
        );
    }
}