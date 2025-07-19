const IMAGEROUTER_API_KEY = process.env.IMAGEROUTER_API_KEY;
const BASE_URL = 'https://api.imagerouter.io/v1/openai';

export interface ImageGenerationRequest {
    prompt: string;
    model: string;
}

export interface ImageEditRequest {
    prompt: string;
    model: string;
    images: File[];
    masks?: File[];
}

export interface VideoGenerationRequest {
    prompt: string;
    model: string;
}

export interface ImageRouterResponse {
    data: Array<{
        url: string;
        b64_json?: string;
    }>;
    created: number;
}

// Generate images using two models simultaneously
export async function generateImages(prompt: string): Promise<ImageRouterResponse[]> {
    if (!IMAGEROUTER_API_KEY) {
        throw new Error('IMAGEROUTER_API_KEY is not configured');
    }

    const models = [
        'stabilityai/sdxl-turbo:free',
        'black-forest-labs/FLUX-1-schnell:free'
    ];

    console.log(`Generating images with prompt: "${prompt}" using models:`, models);

    const requests = models.map(async (model) => {
        console.log(`Making request to ImageRouter for model: ${model}`);

        const response = await fetch(`${BASE_URL}/images/generations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${IMAGEROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                model,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`ImageRouter API error for ${model}:`, response.status, errorText);
            throw new Error(`Failed to generate image with ${model}: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`Successfully generated image with ${model}:`, result);
        return result;
    });

    return Promise.all(requests);
}

// Edit images
export async function editImages(
    prompt: string,
    images: File[],
    masks?: File[]
): Promise<ImageRouterResponse> {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('model', 'HiDream-ai/HiDream-I1-Full:free');

    // Add image files (up to 16)
    images.forEach((image, index) => {
        formData.append('image[]', image);
    });

    // Add mask files if provided
    if (masks) {
        masks.forEach((mask, index) => {
            formData.append('mask[]', mask);
        });
    }

    const response = await fetch(`${BASE_URL}/images/edits`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${IMAGEROUTER_API_KEY}`,
        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to edit image: ${response.statusText}`);
    }

    return response.json();
}

// Generate videos
export async function generateVideo(prompt: string): Promise<ImageRouterResponse> {
    const response = await fetch(`${BASE_URL}/videos/generations`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${IMAGEROUTER_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt,
            model: 'minimax/hailuo-02-standard',
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to generate video: ${response.statusText}`);
    }

    return response.json();
}