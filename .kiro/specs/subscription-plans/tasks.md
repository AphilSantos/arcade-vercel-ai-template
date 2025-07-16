# Implementation Plan

- [x] 1. Database schema migration for subscription fields





  - Add `paid`, `paypalSubscriptionId`, `dailyConversationCount`, and `lastConversationDate` columns to the user table
  - Create and run database migration script
  - Update TypeScript types in schema.ts
  - _Requirements: 1.1, 3.3, 4.1_

- [x] 2. Core subscription service implementation



  - Create `lib/subscription.ts` with user plan management functions
  - Implement `getUserPlan()`, `upgradeToPaid()`, and `downgradeToFree()` methods
  - Add database queries for subscription operations
  - Write unit tests for subscription service methods
  - _Requirements: 1.1, 3.2, 4.4_

- [x] 3. Usage tracking system implementation



  - Implement `incrementDailyUsage()` and `getDailyUsageRemaining()` in subscription service
  - Add `canStartConversation()` method with limit checking logic
  - Create `resetDailyCounters()` method for midnight reset functionality
  - Write unit tests for usage tracking methods
  - _Requirements: 1.2, 1.4, 2.1, 2.4_

- [x] 4. PayPal service integration
  - Create `lib/paypal.ts` with PayPal SDK integration
  - Implement subscription creation using environment credentials
  - Add subscription management methods (get, cancel)
  - Write unit tests with mocked PayPal responses
  - _Requirements: 3.1, 3.2, 5.3_

- [x] 5. Usage middleware for conversation limiting





  - Create middleware to check conversation limits before chat processing
  - Integrate usage checking into existing chat flow
  - Add error handling for limit exceeded scenarios
  - Test middleware integration with existing chat functionality
  - _Requirements: 1.3, 2.4, 4.1_

- [x] 6. Subscription status UI component





  - Create `components/subscription-status.tsx` component
  - Display current plan status and remaining conversations for free users
  - Add upgrade button that triggers PayPal checkout
  - Style component to match existing UI design
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 7. PayPal checkout integration component





  - Create `components/paypal-checkout.tsx` with PayPal button
  - Handle successful payment callbacks to upgrade user plan
  - Implement error handling for failed payments
  - Test checkout flow in PayPal sandbox environment
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 8. Subscription management API routes





  - Create `app/api/subscription/create/route.ts` for PayPal subscription creation
  - Implement `app/api/subscription/status/route.ts` for plan status retrieval
  - Add `app/api/subscription/cancel/route.ts` for subscription cancellation
  - Write API tests for all subscription endpoints
  - _Requirements: 3.1, 5.1, 5.2, 5.3_

- [x] 9. Usage tracking API routes





  - Create `app/api/usage/remaining/route.ts` to get remaining daily conversations
  - Implement internal usage increment endpoint for chat system integration
  - Add proper authentication and authorization to usage endpoints
  - Test API endpoints with different user plan scenarios
  - _Requirements: 2.1, 1.2, 1.3_
-

- [x] 10. PayPal webhook handling system




  - Create `app/api/webhooks/paypal/route.ts` for webhook processing
  - Implement webhook signature verification using PayPal's method
  - Add event processing for subscription created, cancelled, and payment failed events
  - Write comprehensive tests for webhook event handling
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 11. Daily usage reset automation







  - Implement automated daily counter reset functionality
  - Create cron job or scheduled function for midnight UTC reset
  - Add logging and error handling for reset operations
  
  - _Requirements: 1.4_

-

- [x] 12. Integration with existing chat system





  - Modify existing chat components to check usage limits before starting conversations
  - Update chat interface to display subscription status
  - Integrate upgrade prompts when users reach conversation limits
  - _Requirements: 1.2, 1.3, 2.2, 2.3, 4.1, 4.2_



- [x] 13. Account settings subscription management












  - Add subscription section to user account settings page
  - Display current subscription details (plan, next billing date)
  - Implement subscription cancellation flow with PayPal redirect

  - Add subscription history and billing information display

  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 14. Error handling and user feedback










- [ ] 14. Error handling and user feedback


  - Implement comprehensive error handling for all subscription operations
  - Add user-friendly error messages for payment failures and API issues

 [ ] 15. Data preservation during plan changes
  - Create loading states and suc
cess confirmations for subscription actions
  - _Requirements: 3.3, 6.3, 6.4_

- [x] 15. Data preservation during plan changes











  - Verify that conversation history is preserved during plan upgrades
  - Ensure user preferences and settings remain intact during plan changes
  - Test data integrity during subscription status transitions
  - Add safeguards to prevent data loss during plan modifications
  - _Requirements: 7.1, 7.2, 7.3, 7.4_