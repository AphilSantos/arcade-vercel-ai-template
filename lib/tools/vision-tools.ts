import { tool } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const describeImageTool = tool({
    description: 'Analyze and describe images uploaded by the user',
    parameters: z.object({
        imageUrls: z.array(z.string()).describe('URLs of images to analyze'),
        question: z.string().optional().describe('Specific question about the image(s)'),
    }),
    execute: async ({ imageUrls, question }) => {
        try {
            console.log(`[VisionTool] Analyzing ${imageUrls.length} image(s)`);

            if (imageUrls.length === 0) {
                return {
                    success: false,
                    error: 'No images provided for analysis',
                };
            }

            // Process each image
            const imageAnalyses = [];

            for (let i = 0; i < imageUrls.length; i++) {
                const imageUrl = imageUrls[i];
                console.log(`[VisionTool] Processing image ${i + 1}: ${imageUrl.substring(0, 50)}...`);

                try {
                    // Convert blob URL to base64 if needed
                    let processedUrl = imageUrl;
                    if (imageUrl.startsWith('https://') && imageUrl.includes('vercel-storage.com')) {
                        console.log(`[VisionTool] Converting blob URL to base64...`);
                        const response = await fetch(imageUrl);
                        if (response.ok) {
                            const buffer = await response.arrayBuffer();
                            const base64 = Buffer.from(buffer).toString('base64');
                            const contentType = response.headers.get('content-type') || 'image/jpeg';
                            processedUrl = `data:${contentType};base64,${base64}`;
                            console.log(`[VisionTool] Converted to base64 (${buffer.byteLength} bytes)`);
                        }
                    }

                    // Use GPT-4o (vision model) to analyze the image
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
                        maxTokens: 500,
                    });

                    imageAnalyses.push({
                        imageIndex: i + 1,
                        description: result.text,
                        success: true,
                    });

                    console.log(`[VisionTool] Successfully analyzed image ${i + 1}`);

                } catch (imageError) {
                    console.error(`[VisionTool] Failed to analyze image ${i + 1}:`, imageError);
                    imageAnalyses.push({
                        imageIndex: i + 1,
                        error: imageError instanceof Error ? imageError.message : 'Unknown error',
                        success: false,
                    });
                }
            }

            const successfulAnalyses = imageAnalyses.filter(a => a.success);
            const failedAnalyses = imageAnalyses.filter(a => !a.success);

            return {
                success: successfulAnalyses.length > 0,
                totalImages: imageUrls.length,
                successfulAnalyses: successfulAnalyses.length,
                failedAnalyses: failedAnalyses.length,
                analyses: imageAnalyses,
                summary: successfulAnalyses.length > 0
                    ? `Successfully analyzed ${successfulAnalyses.length} out of ${imageUrls.length} image(s)`
                    : 'Failed to analyze any images',
            };

        } catch (error) {
            console.error('[VisionTool] Vision analysis failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Vision analysis failed',
            };
        }
    },
});

export const editImageWithVisionTool = tool({
    description: 'Edit images with AI guidance using vision analysis',
    parameters: z.object({
        imageUrls: z.array(z.string()).describe('URLs of images to edit'),
        editPrompt: z.string().describe('How to edit the image'),
    }),
    execute: async ({ imageUrls, editPrompt }) => {
        try {
            // First, analyze the images to understand what we're working with
            const analysisResult = await describeImageTool.execute(
                {
                    imageUrls,
                    question: `Analyze this image to help with editing. The user wants to: ${editPrompt}`,
                },
                {}
            );

            if (!analysisResult.success) {
                return {
                    success: false,
                    error: 'Failed to analyze images for editing',
                    details: analysisResult.error,
                };
            }

            // Use the existing image editing tool
            const { editImageTool } = await import('./image-tools');
            const editResult = await editImageTool.execute(
                {
                    prompt: editPrompt,
                    imageUrls,
                },
                {}
            );

            return {
                success: editResult.success,
                analysis: analysisResult.analyses,
                editResult: editResult,
                message: editResult.success
                    ? 'Successfully analyzed and edited the image(s)'
                    : 'Image analysis succeeded but editing failed',
            };

        } catch (error) {
            console.error('[VisionEditTool] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Vision-guided editing failed',
            };
        }
    },
});