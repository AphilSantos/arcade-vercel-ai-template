# Design Document

## Overview

The subscription plans feature will implement a two-tier monetization model using PayPal for payment processing and Neon PostgreSQL for data persistence. The design prioritizes simplicity by adding a single nullable `paid` column to the existing users table, where `null`/empty represents free plan users and `"1"` represents paid subscribers.

The system will track daily conversation usage for free users, enforce limits, and provide seamless upgrade/downgrade experiences through PayPal integration with webhook handling for automated subscription management.

## Architecture

### Database Schema Changes

The existing `user` table in `lib/db/schema.ts` will be extended with subscription-related fields:

```typescript
export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  preferredName: varchar('preferredName', { length: 64 }).notNull(),
  // New subscription fields
  paid: varchar('paid', { length: 1 }), // null = free, "1" = paid
  paypalSubscriptionId: varchar('paypalSubscriptionId', { length: 255 }),
  dailyConversationCount: integer('dailyConversationCount').default(0),
  lastConversationDate: date('lastConversationDate'),
});
```

### PayPal Integration Architecture

- **PayPal SDK**: Use `@paypal/checkout-server-sdk` for server-side integration
- **Environment**: Sandbox for development, Live for production
- **Credentials**: `PAYPAL_API_KEY` and `PAYPAL_SECRET` from environment variables
- **Subscription Model**: Monthly recurring payments at $10/month

### Usage Tracking System

- **Daily Reset**: Automated process to reset conversation counters at midnight UTC
- **Real-time Tracking**: Increment counter on each conversation start
- **Limit Enforcement**: Block conversations when free users reach 20 daily limit

## Components and Interfaces

### 1. Subscription Service (`lib/subscription.ts`)

```typescript
interface SubscriptionService {
  // User plan management
  getUserPlan(userId: string): Promise<'free' | 'paid'>
  upgradeToPaid(userId: string, paypalSubscriptionId: string): Promise<void>
  downgradeToFree(userId: string): Promise<void>
  
  // Usage tracking
  incrementDailyUsage(userId: string): Promise<void>
  getDailyUsageRemaining(userId: string): Promise<number>
  canStartConversation(userId: string): Promise<boolean>
  resetDailyCounters(): Promise<void>
}
```

### 2. PayPal Service (`lib/paypal.ts`)

```typescript
interface PayPalService {
  // Subscription management
  createSubscription(planId: string): Promise<PayPalSubscription>
  getSubscription(subscriptionId: string): Promise<PayPalSubscription>
  cancelSubscription(subscriptionId: string): Promise<void>
  
  // Webhook handling
  verifyWebhookSignature(headers: any, body: string): boolean
  processWebhookEvent(event: PayPalWebhookEvent): Promise<void>
}
```

### 3. Usage Middleware (`middleware/usage-check.ts`)

Middleware to check conversation limits before processing chat requests:

```typescript
export async function usageMiddleware(userId: string): Promise<boolean> {
  const subscriptionService = new SubscriptionService();
  return await subscriptionService.canStartConversation(userId);
}
```

### 4. UI Components

#### Subscription Status Component (`components/subscription-status.tsx`)
- Display current plan (Free/Paid)
- Show remaining daily conversations for free users
- Upgrade button for free users
- Manage subscription link for paid users

#### PayPal Checkout Component (`components/paypal-checkout.tsx`)
- PayPal subscription button integration
- Handle successful/failed payments
- Redirect handling

## Data Models

### User Plan Status
```typescript
type UserPlan = 'free' | 'paid';

interface UserSubscription {
  userId: string;
  plan: UserPlan;
  paypalSubscriptionId?: string;
  dailyConversationCount: number;
  lastConversationDate?: Date;
}
```

### PayPal Webhook Events
```typescript
interface PayPalWebhookEvent {
  event_type: 'BILLING.SUBSCRIPTION.CREATED' | 'BILLING.SUBSCRIPTION.CANCELLED' | 'BILLING.SUBSCRIPTION.PAYMENT.FAILED';
  resource: {
    id: string;
    custom_id?: string; // User ID
    status: string;
  };
}
```

## API Routes

### 1. Subscription Management (`app/api/subscription/`)

- `POST /api/subscription/create` - Create PayPal subscription
- `GET /api/subscription/status` - Get user's current subscription status
- `POST /api/subscription/cancel` - Cancel subscription (redirect to PayPal)

### 2. PayPal Webhooks (`app/api/webhooks/paypal/`)

- `POST /api/webhooks/paypal` - Handle PayPal webhook events
  - Verify webhook signature
  - Process subscription events
  - Update user plan status

### 3. Usage Tracking (`app/api/usage/`)

- `GET /api/usage/remaining` - Get remaining daily conversations
- `POST /api/usage/increment` - Increment usage counter (internal)

## Error Handling

### PayPal Integration Errors
- **Payment Failures**: Display user-friendly error messages, maintain free plan status
- **Webhook Failures**: Implement retry logic with exponential backoff
- **API Timeouts**: Graceful degradation, log errors for manual review

### Database Errors
- **Connection Issues**: Retry logic for critical operations
- **Migration Failures**: Rollback mechanisms for schema changes
- **Data Consistency**: Transaction-based updates for plan changes

### Usage Limit Errors
- **Counter Overflow**: Reset mechanism for corrupted counters
- **Date Calculation**: Handle timezone edge cases for daily resets
- **Concurrent Access**: Atomic operations for usage increments

## Testing Strategy

### Unit Tests
- Subscription service methods
- PayPal webhook processing
- Usage tracking logic
- Database operations

### Integration Tests
- PayPal API integration (sandbox)
- Webhook signature verification
- End-to-end subscription flow
- Database schema migrations

### E2E Tests
- Complete user upgrade flow
- Conversation limit enforcement
- Subscription cancellation flow
- Daily usage reset functionality

### Test Data Management
- Mock PayPal responses for unit tests
- Sandbox environment for integration tests
- Test user accounts with known states
- Automated cleanup of test subscriptions

## Security Considerations

### PayPal Integration
- Webhook signature verification using PayPal's public key
- Secure storage of PayPal credentials in environment variables
- HTTPS-only communication with PayPal APIs
- Input validation for all PayPal webhook data

### Database Security
- Parameterized queries to prevent SQL injection
- Encrypted storage of sensitive subscription data
- Regular backup of subscription information
- Access logging for subscription changes

### Rate Limiting
- API rate limiting for subscription endpoints
- Webhook endpoint protection against abuse
- Usage tracking protection against manipulation

## Performance Optimization

### Database Optimization
- Index on `user.paid` column for plan queries
- Index on `user.lastConversationDate` for daily resets
- Efficient queries for usage counting
- Connection pooling for high-traffic scenarios

### Caching Strategy
- Cache user plan status for active sessions
- Cache daily usage counts with TTL
- PayPal subscription status caching
- Redis integration for distributed caching

### Background Jobs
- Daily usage counter reset job (cron)
- Failed webhook retry processing
- Subscription status synchronization with PayPal
- Usage analytics and reporting