import { tool, generateText } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

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
            console.log(`[VisionEditTool] Starting vision-guided editing for ${imageUrls.length} image(s)`);

            // First, analyze the images to understand what we're working with
            const imageAnalyses = [];

            for (let i = 0; i < imageUrls.length; i++) {
                const imageUrl = imageUrls[i];
                console.log(`[VisionEditTool] Analyzing image ${i + 1} for editing guidance...`);

                try {
                    // Convert blob URL to base64 if needed
                    let processedUrl = imageUrl;
                    if (imageUrl.startsWith('https://') && imageUrl.includes('vercel-storage.com')) {
                        const response = await fetch(imageUrl);
                        if (response.ok) {
                            const buffer = await response.arrayBuffer();
                            const base64 = Buffer.from(buffer).toString('base64');
                            const contentType = response.headers.get('content-type') || 'image/jpeg';
                            processedUrl = `data:${contentType};base64,${base64}`;
                        }
                    }

                    // Analyze the image to provide editing guidance
                    const analysisResult = await generateText({
                        model: openai('gpt-4o'),
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'text',
                                        text: `Analyze this image to help with editing. The user wants to: ${editPrompt}. Provide specific guidance on how to achieve this edit.`,
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

                    imageAnalyses.push({
                        imageIndex: i + 1,
                        analysis: analysisResult.text,
                        success: true,
                    });

                } catch (analysisError) {
                    console.error(`[VisionEditTool] Failed to analyze image ${i + 1}:`, analysisError);
                    imageAnalyses.push({
                        imageIndex: i + 1,
                        error: analysisError instanceof Error ? analysisError.message : 'Analysis failed',
                        success: false,
                    });
                }
            }

            // Now perform the actual image editing
            console.log(`[VisionEditTool] Proceeding with image editing...`);

            // Download images and convert to File objects for editing
            const imageFiles: File[] = [];
            for (const [index, imageUrl] of imageUrls.entries()) {
                const imageResponse = await fetch(imageUrl);
                const imageBlob = await imageResponse.blob();
                const imageFile = new File([imageBlob], `image_${index}.jpg`, { type: imageBlob.type });
                imageFiles.push(imageFile);
            }

            // Edit images using the ImageRouter API
            const { editImages } = await import('@/lib/imagerouter');
            const editResult = await editImages(editPrompt, imageFiles);

            const successfulAnalyses = imageAnalyses.filter(a => a.success);

            return {
                success: true,
                totalImages: imageUrls.length,
                analysis: {
                    successful: successfulAnalyses.length,
                    failed: imageAnalyses.length - successfulAnalyses.length,
                    details: imageAnalyses,
                },
                editResult: {
                    images: editResult.data,
                    model_used: 'HiDream-ai/HiDream-I1-Full:free',
                },
                message: `Successfully analyzed ${successfulAnalyses.length} image(s) and completed editing with AI guidance`,
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