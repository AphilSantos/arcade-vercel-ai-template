import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const apiKey = process.env.IMAGEROUTER_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                error: 'IMAGEROUTER_API_KEY not found',
                env_keys: Object.keys(process.env).filter(key => key.includes('IMAGE'))
            });
        }

        // Test a simple API call
        const response = await fetch('https://api.imagerouter.io/v1/openai/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: 'test',
                model: 'stabilityai/sdxl-turbo:free',
            }),
        });

        const result = await response.json();

        return NextResponse.json({
            status: response.status,
            api_key_present: !!apiKey,
            api_key_length: apiKey?.length,
            response: result,
        });

    } catch (error) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}