# Requirements Document

## Introduction

This feature introduces a subscription-based monetization model for the AI chat application. The system will implement two tiers: a free plan with daily usage limits and a paid plan with unlimited access. Users will be able to upgrade to the paid plan through PayPal integration, with automatic usage tracking and enforcement of plan limitations.

## Requirements

### Requirement 1

**User Story:** As a new user, I want to automatically start with a free plan that allows me 20 daily conversations, so that I can try the service before deciding to upgrade.

#### Acceptance Criteria

1. WHEN a new user registers THEN the system SHALL automatically assign them to the free plan
2. WHEN a free plan user starts a conversation THEN the system SHALL track and increment their daily usage counter
3. WHEN a free plan user reaches 20 conversations in a day THEN the system SHALL prevent additional conversations until the next day
4. WHEN the daily reset occurs (midnight UTC) THEN the system SHALL reset the conversation counter to zero for all free plan users

### Requirement 2

**User Story:** As a free plan user, I want to see my remaining daily conversations, so that I can manage my usage effectively.

#### Acceptance Criteria

1. WHEN a free plan user views the chat interface THEN the system SHALL display their remaining daily conversations
2. WHEN a free plan user has 5 or fewer conversations remaining THEN the system SHALL display a warning message
3. WHEN a free plan user has 0 conversations remaining THEN the system SHALL display an upgrade prompt with PayPal integration
4. WHEN a free plan user attempts to start a conversation after reaching the limit THEN the system SHALL block the action and show upgrade options

### Requirement 3

**User Story:** As a free plan user, I want to upgrade to a paid plan through PayPal, so that I can have unlimited conversations.

#### Acceptance Criteria

1. WHEN a user clicks the upgrade button THEN the system SHALL redirect them to PayPal checkout for a $10/month subscription
2. WHEN PayPal payment is successful THEN the system SHALL set the user's "paid" column to "1" in the database
3. WHEN PayPal payment fails THEN the system SHALL display an error message and keep the user's "paid" column empty (free plan)
4. WHEN a user completes PayPal subscription THEN the system SHALL store the PayPal subscription ID for webhook processing

### Requirement 4

**User Story:** As a paid plan user, I want unlimited conversations without daily restrictions, so that I can use the service as much as needed.

#### Acceptance Criteria

1. WHEN a paid plan user (paid column = "1") starts a conversation THEN the system SHALL NOT apply any usage limits
2. WHEN a paid plan user views the chat interface THEN the system SHALL display "Unlimited" or hide usage counters
3. WHEN a paid plan user's subscription is active THEN the system SHALL continue providing unlimited access
4. IF a paid plan user's subscription expires or payment fails THEN the system SHALL set their "paid" column to empty and revert them to free plan limits

### Requirement 5

**User Story:** As a paid plan user, I want to manage my subscription (view status, cancel), so that I have control over my billing.

#### Acceptance Criteria

1. WHEN a paid user accesses account settings THEN the system SHALL display their current subscription status
2. WHEN a paid user views subscription details THEN the system SHALL show next billing date and amount
3. WHEN a paid user clicks cancel subscription THEN the system SHALL redirect them to PayPal to manage the subscription
4. WHEN PayPal notifies of subscription cancellation THEN the system SHALL schedule the user to revert to free plan at period end

### Requirement 6

**User Story:** As an administrator, I want the system to handle PayPal webhooks reliably, so that user plan changes are processed automatically.

#### Acceptance Criteria

1. WHEN PayPal sends a subscription created webhook THEN the system SHALL upgrade the user to paid plan
2. WHEN PayPal sends a subscription cancelled webhook THEN the system SHALL schedule user downgrade to free plan
3. WHEN PayPal sends a payment failed webhook THEN the system SHALL handle gracefully and notify the user
4. WHEN webhook processing fails THEN the system SHALL log the error and retry the operation
5. WHEN webhook signature is invalid THEN the system SHALL reject the request and log security event

### Requirement 7

**User Story:** As a user, I want my conversation history and data to be preserved when changing plans, so that I don't lose my previous interactions.

#### Acceptance Criteria

1. WHEN a user upgrades from free to paid THEN the system SHALL preserve all existing conversation history
2. WHEN a user downgrades from paid to free THEN the system SHALL preserve all existing conversation history
3. WHEN plan changes occur THEN the system SHALL maintain user preferences and settings
4. WHEN a user's plan changes THEN the system SHALL only affect usage limits, not data access