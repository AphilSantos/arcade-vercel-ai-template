import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { processAttachmentsForAI } from '@/lib/utils/attachment-processor';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { attachments, testMessage } = await req.json();

        console.log('=== IMAGE PROCESSING DEBUG ===');
        console.log('Original attachments:', attachments?.length || 0);

        if (!attachments || attachments.length === 0) {
            return NextResponse.json({ error: 'No attachments provided' }, { status: 400 });
        }

        // Test 1: Process attachments
        console.log('Step 1: Processing attachments...');
        const processedAttachments = await processAttachmentsForAI(attachments);
        console.log('Processed attachments:', processedAttachments.length);

        // Test 2: Check if we can access the original blob
        console.log('Step 2: Testing blob access...');
        for (let i = 0; i < attachments.length; i++) {
            const attachment = attachments[i];
            try {
                const response = await fetch(attachment.url);
                console.log(`Blob ${i + 1} fetch:`, {
                    status: response.status,
                    contentType: response.headers.get('content-type'),
                    contentLength: response.headers.get('content-length'),
                });
            } catch (error) {
                console.error(`Blob ${i + 1} fetch failed:`, error);
            }
        }

        // Test 3: Try to send to AI model directly
        console.log('Step 3: Testing AI model with processed attachments...');
        try {
            const testMessages = [
                {
                    role: 'user' as const,
                    content: testMessage || 'What do you see in this image?',
                    experimental_attachments: processedAttachments,
                }
            ];

            const result = await streamText({
                model: myProvider.languageModel('chat-model'),
                messages: testMessages,
                maxTokens: 100,
            });

            // Collect the response
            let aiResponse = '';
            for await (const chunk of result.textStream) {
                aiResponse += chunk;
            }

            console.log('AI Response:', aiResponse);

            return NextResponse.json({
                success: true,
                originalAttachments: attachments.length,
                processedAttachments: processedAttachments.length,
                aiResponse: aiResponse,
                processedAttachmentSample: processedAttachments[0] ? {
                    name: processedAttachments[0].name,
                    contentType: processedAttachments[0].contentType,
                    urlType: processedAttachments[0].url.startsWith('data:') ? 'base64' : 'url',
                    urlLength: processedAttachments[0].url.length,
                } : null,
            });

        } catch (aiError) {
            console.error('AI model test failed:', aiError);
            return NextResponse.json({
                success: false,
                error: 'AI model failed to process image',
                details: aiError instanceof Error ? aiError.message : 'Unknown AI error',
                originalAttachments: attachments.length,
                processedAttachments: processedAttachments.length,
            });
        }

    } catch (error) {
        console.error('Debug image processing error:', error);
        return NextResponse.json(
            { error: 'Failed to debug image processing', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}