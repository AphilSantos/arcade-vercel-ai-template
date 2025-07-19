import { tool } from 'ai';
import { z } from 'zod';
import { generateImages } from '@/lib/imagerouter';

export const generateImageTool = tool({
    description: 'Generate images using ImageRouter API with dual models (SDXL-Turbo and FLUX-1-Schnell)',
    parameters: z.object({
        prompt: z.string().describe('The prompt to generate images from'),
    }),
    execute: async ({ prompt }) => {
        try {
            console.log(`[ImageTool] Starting image generation for prompt: "${prompt}"`);

            // Check if API key is available
            const apiKey = process.env.IMAGEROUTER_API_KEY;
            if (!apiKey) {
                console.error('[ImageTool] IMAGEROUTER_API_KEY not found');
                return {
                    success: false,
                    error: 'ImageRouter API key not configured',
                };
            }

            console.log(`[ImageTool] API key found, length: ${apiKey.length}`);

            // Generate images using both models directly
            const results = await generateImages(prompt);

            // Combine results from both models
            const allImages = results.flatMap(result => result.data);

            console.log(`[ImageTool] Successfully generated ${allImages.length} images`);

            return {
                success: true,
                images: allImages,
                models_used: ['stabilityai/sdxl-turbo:free', 'black-forest-labs/FLUX-1-schnell:free'],
                prompt: prompt,
            };
        } catch (error) {
            console.error('[ImageTool] Image generation failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    },
});

export const editImageTool = tool({
    description: 'Edit images using ImageRouter API with HiDream-I1-Full model',
    parameters: z.object({
        prompt: z.string().describe('The prompt describing how to edit the image'),
        imageUrls: z.array(z.string()).describe('URLs of images to edit'),
    }),
    execute: async ({ prompt, imageUrls }) => {
        try {
            // Download images and convert to File objects
            const imageFiles: File[] = [];

            for (const [index, imageUrl] of imageUrls.entries()) {
                const imageResponse = await fetch(imageUrl);
                const imageBlob = await imageResponse.blob();
                const imageFile = new File([imageBlob], `image_${index}.jpg`, { type: imageBlob.type });
                imageFiles.push(imageFile);
            }

            // Edit images directly using the ImageRouter API
            const { editImages } = await import('@/lib/imagerouter');
            const result = await editImages(prompt, imageFiles);

            return {
                success: true,
                images: result.data,
                model_used: 'HiDream-ai/HiDream-I1-Full:free',
                prompt: prompt,
            };
        } catch (error) {
            console.error('Image editing failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    },
});

export const generateVideoTool = tool({
    description: 'Generate videos using ImageRouter API with Hailuo model',
    parameters: z.object({
        prompt: z.string().describe('The prompt to generate video from'),
    }),
    execute: async ({ prompt }) => {
        try {
            console.log(`[VideoTool] Starting video generation for prompt: "${prompt}"`);

            // Check if API key is available
            const apiKey = process.env.IMAGEROUTER_API_KEY;
            if (!apiKey) {
                console.error('[VideoTool] IMAGEROUTER_API_KEY not found');
                return {
                    success: false,
                    error: 'ImageRouter API key not configured',
                };
            }

            console.log(`[VideoTool] API key found, starting video generation...`);

            // Generate video directly using the ImageRouter API
            const { generateVideo } = await import('@/lib/imagerouter');
            const result = await generateVideo(prompt);

            console.log(`[VideoTool] Successfully generated video`);

            return {
                success: true,
                videos: result.data,
                model_used: 'minimax/hailuo-02-standard',
                prompt: prompt,
            };
        } catch (error) {
            console.error('[VideoTool] Video generation failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Video generation failed. This may be due to high demand on the AI service. Please try again.',
                prompt: prompt,
            };
        }
    },
});