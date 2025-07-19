import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();

        return NextResponse.json({
            authenticated: !!session,
            user: session?.user ? {
                id: session.user.id,
                email: session.user.email,
                preferredName: session.user.preferredName,
            } : null,
        });

    } catch (error) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error',
            authenticated: false,
        });
    }
}