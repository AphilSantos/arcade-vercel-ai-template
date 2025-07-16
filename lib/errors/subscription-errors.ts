/**
 * Subscription-specific error types and handling utilities
 */

export enum SubscriptionErrorCode {
  // Authentication errors
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_SESSION = 'INVALID_SESSION',
  
  // Subscription errors
  SUBSCRIPTION_NOT_FOUND = 'SUBSCRIPTION_NOT_FOUND',
  SUBSCRIPTION_ALREADY_EXISTS = 'SUBSCRIPTION_ALREADY_EXISTS',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  
  // Payment errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  PAYMENT_METHOD_INVALID = 'PAYMENT_METHOD_INVALID',
  
  // Usage errors
  USAGE_LIMIT_EXCEEDED = 'USAGE_LIMIT_EXCEEDED',
  DAILY_LIMIT_REACHED = 'DAILY_LIMIT_REACHED',
  
  // PayPal errors
  PAYPAL_SERVICE_UNAVAILABLE = 'PAYPAL_SERVICE_UNAVAILABLE',
  PAYPAL_WEBHOOK_INVALID = 'PAYPAL_WEBHOOK_INVALID',
  PAYPAL_SUBSCRIPTION_FAILED = 'PAYPAL_SUBSCRIPTION_FAILED',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Generic errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export class SubscriptionError extends Error {
  public readonly code: SubscriptionErrorCode;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly retryable: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    code: SubscriptionErrorCode,
    message: string,
    userMessage: string,
    statusCode: number = 500,
    retryable: boolean = false,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'SubscriptionError';
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.retryable = retryable;
    this.context = context;
  }

  toJSON() {
    return {
      error: this.code,
      message: this.userMessage,
      retryable: this.retryable,
      context: this.context
    };
  }
}

/**
 * Factory functions for common subscription errors
 */
export const SubscriptionErrors = {
  authenticationRequired: () => new SubscriptionError(
    SubscriptionErrorCode.AUTHENTICATION_REQUIRED,
    'User authentication required',
    'Please sign in to access subscription features',
    401,
    false
  ),

  subscriptionNotFound: (userId?: string) => new SubscriptionError(
    SubscriptionErrorCode.SUBSCRIPTION_NOT_FOUND,
    'No active subscription found',
    'No active subscription found for your account',
    404,
    false,
    { userId }
  ),

  usageLimitExceeded: (remaining: number = 0) => new SubscriptionError(
    SubscriptionErrorCode.USAGE_LIMIT_EXCEEDED,
    'Daily conversation limit exceeded',
    'You have reached your daily conversation limit. Upgrade to Premium for unlimited access.',
    429,
    false,
    { remaining }
  ),

  paypalServiceUnavailable: () => new SubscriptionError(
    SubscriptionErrorCode.PAYPAL_SERVICE_UNAVAILABLE,
    'PayPal service temporarily unavailable',
    'Payment service is temporarily unavailable. Please try again in a few minutes.',
    503,
    true
  ),

  paymentFailed: (reason?: string) => new SubscriptionError(
    SubscriptionErrorCode.PAYMENT_FAILED,
    `Payment failed: ${reason || 'Unknown error'}`,
    'Payment could not be processed. Please check your payment method and try again.',
    402,
    true,
    { reason }
  ),

  databaseError: (operation: string, error?: Error) => new SubscriptionError(
    SubscriptionErrorCode.DATABASE_ERROR,
    `Database operation failed: ${operation}`,
    'A temporary error occurred. Please try again.',
    500,
    true,
    { operation, originalError: error?.message }
  ),

  networkError: (url?: string) => new SubscriptionError(
    SubscriptionErrorCode.NETWORK_ERROR,
    'Network request failed',
    'Connection error. Please check your internet connection and try again.',
    503,
    true,
    { url }
  ),

  validationError: (field: string, value?: any) => new SubscriptionError(
    SubscriptionErrorCode.VALIDATION_ERROR,
    `Validation failed for field: ${field}`,
    'Please check your input and try again.',
    400,
    false,
    { field, value }
  ),

  rateLimitExceeded: (retryAfter?: number) => new SubscriptionError(
    SubscriptionErrorCode.RATE_LIMIT_EXCEEDED,
    'Rate limit exceeded',
    'Too many requests. Please wait a moment before trying again.',
    429,
    true,
    { retryAfter }
  )
};

/**
 * Error handler utility for consistent error processing
 */
export function handleSubscriptionError(error: unknown, context?: string): SubscriptionError {
  // If it's already a SubscriptionError, return as-is
  if (error instanceof SubscriptionError) {
    return error;
  }

  // Handle common error types
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return SubscriptionErrors.networkError();
    }
    
    if (message.includes('timeout')) {
      return new SubscriptionError(
        SubscriptionErrorCode.TIMEOUT_ERROR,
        'Request timeout',
        'The request took too long to complete. Please try again.',
        408,
        true
      );
    }
    
    if (message.includes('database') || message.includes('connection')) {
      return SubscriptionErrors.databaseError(context || 'unknown', error);
    }
    
    if (message.includes('paypal')) {
      return SubscriptionErrors.paypalServiceUnavailable();
    }
  }

  // Default to internal error
  return new SubscriptionError(
    SubscriptionErrorCode.INTERNAL_ERROR,
    `Internal error: ${error}`,
    'An unexpected error occurred. Please try again.',
    500,
    true,
    { originalError: String(error), context }
  );
}

/**
 * Retry utility for retryable errors
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: SubscriptionError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = handleSubscriptionError(error, `Attempt ${attempt}/${maxRetries}`);
      
      // Don't retry if error is not retryable or this is the last attempt
      if (!lastError.retryable || attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
    }
  }
  
  throw lastError!;
}