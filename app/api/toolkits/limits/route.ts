import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getMaxToolkitsForPlan } from '@/lib/arcade/utils';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's subscription plan and determine toolkit limit
        try {
            const { subscriptionService } = require('@/lib/subscription');
            const userPlan = await subscriptionService.getUserPlan(session.user.id);
            const maxToolkits = getMaxToolkitsForPlan(userPlan);

            return NextResponse.json({
                plan: userPlan,
                maxToolkits,
                isPremium: userPlan === 'paid'
            });
        } catch (error) {
            console.error('Error getting user plan:', error);
            // Fallback to free tier limits
            return NextResponse.json({
                plan: 'free',
                maxToolkits: 6,
                isPremium: false
            });
        }
    } catch (error) {
        console.error('Error in toolkit limits API:', error);
        return NextResponse.json(
            { error: 'Failed to get toolkit limits' },
            { status: 500 }
        );
    }
}