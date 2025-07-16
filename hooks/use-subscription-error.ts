'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface SubscriptionErrorHandlerOptions {
  toastErrors?: boolean;
  logErrors?: boolean;
  defaultMessage?: string;
}

/**
 * Hook for handling subscription-related errors consistently across components
 * 
 * @param options Configuration options for error handling
 * @returns Object with error handling utilities
 */
export function useSubscriptionErrorHandler(options: SubscriptionErrorHandlerOptions = {}) {
  const {
    toastErrors = true,
    logErrors = true,
    defaultMessage = 'An error occurred with your subscription. Please try again.'
  } = options;

  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  /**
   * Handle API response errors with consistent error extraction
   */
  const handleApiError = useCallback(async (response: Response, context: string = 'API request') => {
    if (response.ok) return null;
    
    try {
      const data = await response.json();
      
      // Extract error details
      const errorMessage = data.message || data.error || defaultMessage;
      const code = data.error || 'UNKNOWN_ERROR';
      
      if (logErrors) {
        console.error(`Subscription error (${context}): ${code} - ${errorMessage}`);
      }
      
      if (toastErrors) {
        toast.error(errorMessage);
      }
      
      setError(errorMessage);
      setErrorCode(code);
      
      return { message: errorMessage, code };
    } catch (parseError) {
      // Handle case where response isn't valid JSON
      const fallbackMessage = `Failed to process ${context.toLowerCase()}`;
      
      if (logErrors) {
        console.error(`Subscription error (${context}): ${fallbackMessage}`, parseError);
      }
      
      if (toastErrors) {
        toast.error(fallbackMessage);
      }
      
      setError(fallbackMessage);
      setErrorCode('PARSE_ERROR');
      
      return { message: fallbackMessage, code: 'PARSE_ERROR' };
    }
  }, [defaultMessage, logErrors, toastErrors]);

  /**
   * Handle general errors in subscription operations
   */
  const handleError = useCallback((error: unknown, context: string = 'operation') => {
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string'
        ? error
        : defaultMessage;
    
    if (logErrors) {
      console.error(`Subscription error (${context}):`, error);
    }
    
    if (toastErrors) {
      toast.error(errorMessage);
    }
    
    setError(errorMessage);
    setErrorCode('UNKNOWN_ERROR');
    
    return { message: errorMessage, code: 'UNKNOWN_ERROR' };
  }, [defaultMessage, logErrors, toastErrors]);

  /**
   * Clear current error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  /**
   * Retry a subscription operation with error handling
   */
  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T | null> => {
    clearError();
    setIsRetrying(true);
    
    try {
      const result = await operation();
      return result;
    } catch (error) {
      handleError(error, `retry ${context}`);
      return null;
    } finally {
      setIsRetrying(false);
    }
  }, [clearError, handleError]);

  return {
    error,
    errorCode,
    isRetrying,
    handleApiError,
    handleError,
    clearError,
    retryOperation
  };
}