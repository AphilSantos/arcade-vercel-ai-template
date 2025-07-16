import 'server-only';

import { eq, isNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { user } from './db/schema';
import { SubscriptionError, SubscriptionErrors, handleSubscriptionError, withRetry } from './errors/subscription-errors';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export type UserPlan = 'free' | 'paid';

export interface SubscriptionService {
  getUserPlan(userId: string): Promise<UserPlan>;
  upgradeToPaid(userId: string, paypalSubscriptionId: string): Promise<void>;
  downgradeToFree(userId: string): Promise<void>;
  incrementDailyUsage(userId: string): Promise<void>;
  getDailyUsageRemaining(userId: string): Promise<number>;
  canStartConversation(userId: string): Promise<boolean>;
  resetDailyCounters(): Promise<void>;
}

class SubscriptionServiceImpl implements SubscriptionService {
  private readonly FREE_PLAN_DAILY_LIMIT = 5; // 5 conversations per day for free users

  /**
   * Get the current plan for a user
   * @param userId - The user's ID
   * @returns 'free' or 'paid' based on the user's subscription status
   */
  async getUserPlan(userId: string): Promise<UserPlan> {
    if (!userId?.trim()) {
      throw SubscriptionErrors.validationError('userId', userId);
    }

    return withRetry(async () => {
      try {
        const [selectedUser] = await db
          .select({ paid: user.paid })
          .from(user)
          .where(eq(user.id, userId));

        if (!selectedUser) {
          throw new SubscriptionError(
            'USER_NOT_FOUND' as any,
            `User with id ${userId} not found`,
            'User account not found',
            404,
            false,
            { userId }
          );
        }

        return selectedUser.paid === '1' ? 'paid' : 'free';
      } catch (error) {
        if (error instanceof SubscriptionError) {
          throw error;
        }
        throw handleSubscriptionError(error, 'getUserPlan');
      }
    });
  }

  /**
   * Upgrade a user to paid plan
   * @param userId - The user's ID
   * @param paypalSubscriptionId - PayPal subscription ID for tracking
   */
  async upgradeToPaid(userId: string, paypalSubscriptionId: string): Promise<void> {
    if (!userId?.trim()) {
      throw SubscriptionErrors.validationError('userId', userId);
    }
    if (!paypalSubscriptionId?.trim()) {
      throw SubscriptionErrors.validationError('paypalSubscriptionId', paypalSubscriptionId);
    }

    return withRetry(async () => {
      try {
        // First, fetch the current user data to preserve any important fields
        const [currentUser] = await db
          .select({
            id: user.id,
            dailyConversationCount: user.dailyConversationCount,
            lastConversationDate: user.lastConversationDate,
            // Add any other fields that should be preserved
          })
          .from(user)
          .where(eq(user.id, userId));

        if (!currentUser) {
          throw new SubscriptionError(
            'USER_NOT_FOUND' as any,
            `User with id ${userId} not found`,
            'User account not found',
            404,
            false,
            { userId }
          );
        }

        // Update user to paid plan while preserving existing data
        await db
          .update(user)
          .set({
            paid: '1',
            paypalSubscriptionId: paypalSubscriptionId,
            // Preserve conversation history and other user data
            // We don't reset dailyConversationCount or lastConversationDate
            // to ensure data continuity
          })
          .where(eq(user.id, userId));

        console.log(`User ${userId} upgraded to paid plan with PayPal subscription ${paypalSubscriptionId}`);
      } catch (error) {
        throw handleSubscriptionError(error, 'upgradeToPaid');
      }
    });
  }

  /**
   * Downgrade a user to free plan
   * @param userId - The user's ID
   */
  async downgradeToFree(userId: string): Promise<void> {
    if (!userId?.trim()) {
      throw SubscriptionErrors.validationError('userId', userId);
    }

    return withRetry(async () => {
      try {
        // First, fetch the current user data to preserve important fields
        const [currentUser] = await db
          .select({
            id: user.id,
            // Select fields we want to preserve during downgrade
            // We'll explicitly NOT select conversation history or preferences
            // as those should be preserved during the downgrade
          })
          .from(user)
          .where(eq(user.id, userId));

        if (!currentUser) {
          throw new SubscriptionError(
            'USER_NOT_FOUND' as any,
            `User with id ${userId} not found`,
            'User account not found',
            404,
            false,
            { userId }
          );
        }

        // Get today's date for usage tracking reset
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

        // Update user to free plan while preserving user data
        // Only reset subscription-specific fields
        await db
          .update(user)
          .set({
            paid: null,
            paypalSubscriptionId: null,
            // Reset usage counters to start fresh on free plan
            dailyConversationCount: 0,
            lastConversationDate: today,
            // Note: We're not touching any other user data fields
            // This preserves conversation history, preferences, etc.
          })
          .where(eq(user.id, userId));

        console.log(`User ${userId} downgraded to free plan with data preserved`);
      } catch (error) {
        throw handleSubscriptionError(error, 'downgradeToFree');
      }
    });
  }

  /**
   * Increment daily usage counter for a user
   * @param userId - The user's ID
   */
  async incrementDailyUsage(userId: string): Promise<void> {
    if (!userId?.trim()) {
      throw SubscriptionErrors.validationError('userId', userId);
    }

    return withRetry(async () => {
      try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const [currentUser] = await db
          .select({
            dailyConversationCount: user.dailyConversationCount,
            lastConversationDate: user.lastConversationDate,
            paid: user.paid,
          })
          .from(user)
          .where(eq(user.id, userId));

        if (!currentUser) {
          throw new SubscriptionError(
            'USER_NOT_FOUND' as any,
            `User with id ${userId} not found`,
            'User account not found',
            404,
            false,
            { userId }
          );
        }

        // Don't track usage for paid users
        if (currentUser.paid === '1') {
          return;
        }

        const lastDate = currentUser.lastConversationDate?.toString();
        const currentCount = currentUser.dailyConversationCount || 0;

        // Reset counter if it's a new day
        const newCount = lastDate === today ? currentCount + 1 : 1;

        await db
          .update(user)
          .set({
            dailyConversationCount: newCount,
            lastConversationDate: today,
          })
          .where(eq(user.id, userId));

      } catch (error) {
        if (error instanceof SubscriptionError) {
          throw error;
        }
        throw handleSubscriptionError(error, 'incrementDailyUsage');
      }
    });
  }

  /**
   * Get remaining daily conversations for a user
   * @param userId - The user's ID
   * @returns Number of conversations remaining (unlimited for paid users)
   */
  async getDailyUsageRemaining(userId: string): Promise<number> {
    if (!userId?.trim()) {
      throw SubscriptionErrors.validationError('userId', userId);
    }

    return withRetry(async () => {
      try {
        const [currentUser] = await db
          .select({
            dailyConversationCount: user.dailyConversationCount,
            lastConversationDate: user.lastConversationDate,
            paid: user.paid,
          })
          .from(user)
          .where(eq(user.id, userId));

        if (!currentUser) {
          throw new SubscriptionError(
            'USER_NOT_FOUND' as any,
            `User with id ${userId} not found`,
            'User account not found',
            404,
            false,
            { userId }
          );
        }

        // Paid users have unlimited conversations
        if (currentUser.paid === '1') {
          return -1; // -1 indicates unlimited
        }

        const today = new Date().toISOString().split('T')[0];
        const lastDate = currentUser.lastConversationDate?.toString();
        const currentCount = currentUser.dailyConversationCount || 0;

        // If it's a new day or the user has never sent a message (lastConversationDate is null),
        // they should have the full daily limit available
        if (!lastDate || lastDate !== today) {
          console.log(`User ${userId} has ${this.FREE_PLAN_DAILY_LIMIT} messages available (new day or new user)`);
          return this.FREE_PLAN_DAILY_LIMIT;
        }

        // Calculate remaining messages for today
        const remaining = Math.max(0, this.FREE_PLAN_DAILY_LIMIT - currentCount);
        
        console.log(`User ${userId} has ${remaining} messages remaining out of ${this.FREE_PLAN_DAILY_LIMIT} (used ${currentCount} today)`);
        
        return remaining;
      } catch (error) {
        if (error instanceof SubscriptionError) {
          throw error;
        }
        throw handleSubscriptionError(error, 'getDailyUsageRemaining');
      }
    });
  }

  /**
   * Check if a user can start a new conversation
   * @param userId - The user's ID
   * @returns true if user can start a conversation, false otherwise
   */
  async canStartConversation(userId: string): Promise<boolean> {
    if (!userId?.trim()) {
      throw SubscriptionErrors.validationError('userId', userId);
    }

    return withRetry(async () => {
      try {
        const plan = await this.getUserPlan(userId);
        
        // Paid users can always start conversations
        if (plan === 'paid') {
          return true;
        }

        // Free users need to check their daily limit
        const remaining = await this.getDailyUsageRemaining(userId);
        
        if (remaining <= 0) {
          // Log this as a limit reached event but don't throw an error here
          // The error will be thrown by the middleware
          console.log(`User ${userId} has reached their daily conversation limit`);
        }
        
        return remaining > 0;
      } catch (error) {
        if (error instanceof SubscriptionError) {
          throw error;
        }
        throw handleSubscriptionError(error, 'canStartConversation');
      }
    });
  }

  /**
   * Reset daily conversation counters for all free users
   * This should be called daily at midnight UTC
   */
  async resetDailyCounters(): Promise<void> {
    return withRetry(async () => {
      try {
        await db
          .update(user)
          .set({
            dailyConversationCount: 0,
            lastConversationDate: null,
          })
          .where(isNull(user.paid)); // Only reset for free users (paid is null)

        console.log('Daily conversation counters reset for all free users');
      } catch (error) {
        throw handleSubscriptionError(error, 'resetDailyCounters');
      }
    });
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionServiceImpl();

// Export class for testing
export { SubscriptionServiceImpl };