'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: any) => {
        render: (element: HTMLElement | string) => void;
      };
    };
  }
}

interface PayPalCheckoutProps {
  onSuccess?: (subscriptionId: string) => Promise<void>;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  buttonText?: string;
  className?: string;
}

/**
 * PayPal checkout component that renders a PayPal button for subscription checkout
 */
export function PayPalCheckout({
  onSuccess,
  onError,
  onCancel,
  buttonText = 'Subscribe with PayPal',
  className = '',
}: PayPalCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load the PayPal SDK script
  useEffect(() => {
    const loadPayPalScript = () => {
      setLoading(true);
      setError(null);

      // Check if script is already loaded
      if (window.paypal) {
        console.log('PayPal SDK already loaded');
        setScriptLoaded(true);
        setLoading(false);
        return;
      }

      // Get the client ID from environment variables
      const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
      
      if (!clientId) {
        console.error('PayPal client ID is not defined in environment variables');
        setError('PayPal configuration error. Please contact support.');
        setLoading(false);
        return;
      }
      
      // Validate client ID format
      if (!clientId.startsWith('Ab3io') && !clientId.startsWith('A')) {
        console.error('Invalid PayPal client ID format:', clientId);
        setError('Invalid PayPal configuration. Please check your environment variables.');
        setLoading(false);
        return;
      }
      
      console.log('Loading PayPal SDK with client ID:', clientId.substring(0, 5) + '...');

      // Remove any existing PayPal scripts to avoid conflicts
      const existingScript = document.getElementById('paypal-script');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }

      // Create script element
      const script = document.createElement('script');
      
      // Use the sandbox URL for testing
      // Add currency and disable funding sources that might cause issues
      const isProduction = process.env.NODE_ENV === 'production';
      const sdkUrl = isProduction
        ? `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=subscription&vault=true&components=buttons,funding-eligibility&disable-funding=credit,card`
        : `https://www.sandbox.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=subscription&vault=true&components=buttons,funding-eligibility&disable-funding=credit,card`;
      console.log('Loading PayPal SDK from URL:', sdkUrl);
      console.log('Environment:', isProduction ? 'Production' : 'Sandbox');
      
      script.src = sdkUrl;
      script.async = true;
      script.id = 'paypal-script';
      
      // Set a timeout to detect if the script takes too long to load
      const timeoutId = setTimeout(() => {
        if (!window.paypal) {
          console.error('PayPal SDK load timeout');
          setError('PayPal SDK load timeout. Please try again later or use the fallback button.');
          setLoading(false);
        }
      }, 10000); // 10 seconds timeout
      
      script.onload = () => {
        clearTimeout(timeoutId);
        console.log('PayPal SDK loaded successfully');
        if (window.paypal) {
          console.log('PayPal object is available in window');
          setScriptLoaded(true);
          setLoading(false);
        } else {
          console.error('PayPal object is not available in window after script load');
          setError('PayPal SDK failed to initialize. Please try again later or use the fallback button.');
          setLoading(false);
        }
      };
      
      script.onerror = (e) => {
        clearTimeout(timeoutId);
        console.error('Failed to load PayPal SDK:', e);
        setError('Failed to load PayPal SDK. Please try the fallback button below.');
        setLoading(false);
      };

      document.body.appendChild(script);
    };

    loadPayPalScript();
    
    // Cleanup function to remove the script when component unmounts
    return () => {
      const script = document.getElementById('paypal-script');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);
  
  // Immediately show the fallback button if we're in development mode
  useEffect(() => {
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode detected, showing fallback button immediately');
      setLoading(false);
    }
  }, []);

  // Initialize PayPal button when script is loaded
  useEffect(() => {
    if (scriptLoaded && paypalButtonRef.current && window.paypal) {
      console.log('Initializing PayPal buttons');
      
      // Clear any existing buttons
      paypalButtonRef.current.innerHTML = '';

      try {
        const buttons = window.paypal.Buttons({
          style: {
            shape: 'rect',
            color: 'blue',
            layout: 'vertical',
            label: 'subscribe'
          },
        createSubscription: async (data: any, actions: any) => {
          setProcessingPayment(true);
          try {
            // Call our API to create a subscription in PayPal
            const response = await fetch('/api/subscription/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              }
            });

            const result = await response.json();

            if (!response.ok) {
              // Extract specific error information if available
              const errorMessage = result.message || result.error || 'Failed to create subscription';
              const errorCode = result.error || 'UNKNOWN_ERROR';
              
              console.error(`Subscription creation failed: ${errorCode} - ${errorMessage}`);
              setError(errorMessage);
              setProcessingPayment(false);
              throw new Error(errorMessage);
            }

            console.log('Subscription created successfully:', result.subscriptionId);
            return result.subscriptionId;
          } catch (err) {
            // If we haven't already set a specific error message, set a generic one
            if (!error) {
              setError('Failed to create subscription. Please try again.');
            }
            setProcessingPayment(false);
            throw err;
          }
        },
        onApprove: async (data: { subscriptionID: string }) => {
          try {
            console.log('Subscription approved with ID:', data.subscriptionID);
            
            // Call our API to confirm the subscription
            const response = await fetch('/api/subscription/confirm', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                subscriptionId: data.subscriptionID
              })
            });

            const result = await response.json();

            if (!response.ok) {
              // Extract specific error information if available
              const errorMessage = result.message || result.error || 'Failed to confirm subscription';
              const errorCode = result.error || 'UNKNOWN_ERROR';
              
              console.error(`Subscription confirmation failed: ${errorCode} - ${errorMessage}`);
              setError(errorMessage);
              throw new Error(errorMessage);
            }

            console.log('Subscription confirmed successfully');
            
            // Call the onSuccess callback if provided
            if (onSuccess) {
              await onSuccess(data.subscriptionID);
            } else {
              // Default behavior - refresh the page
              router.refresh();
            }

            return true;
          } catch (err) {
            const error = err instanceof Error ? err : new Error('An unknown error occurred');
            console.error('Error confirming subscription:', error);
            setError(error.message);
            
            if (onError) {
              onError(error);
            }
            
            return false;
          } finally {
            setProcessingPayment(false);
          }
        },
        onCancel: () => {
          setProcessingPayment(false);
          if (onCancel) {
            onCancel();
          }
        },
        onError: (err: Error) => {
          setProcessingPayment(false);
          setError('PayPal checkout failed. Please try again later.');
          
          if (onError) {
            onError(err);
          }
        }
      }).render(paypalButtonRef.current);
      } catch (error) {
        console.error('Error rendering PayPal buttons:', error);
        setError('Failed to render PayPal checkout. Please try again later.');
      }
    }
  }, [scriptLoaded, onSuccess, onError, onCancel, router, error]);

  // Fallback button for when PayPal script fails to load
  const handleFallbackButtonClick = async () => {
    setProcessingPayment(true);
    setError(null);
    
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Extract specific error information if available
        const errorMessage = data.message || data.error || 'Failed to create subscription';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Redirect to PayPal checkout
      if (data.approvalUrl) {
        router.push(data.approvalUrl);
      } else {
        setError('No approval URL returned from payment service');
        throw new Error('Missing approval URL in response');
      }
    } catch (err) {
      // If we haven't already set a specific error message, set a generic one
      if (!error) {
        setError('Failed to start checkout process. Please try again later.');
      }
      
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className={className}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* PayPal button container */}
          <div ref={paypalButtonRef} className={scriptLoaded ? 'block' : 'hidden'} />
          
          {/* Fallback button when script fails to load */}
          {!scriptLoaded && !loading && (
            <Button 
              onClick={handleFallbackButtonClick} 
              disabled={processingPayment}
              className="w-full"
            >
              {processingPayment ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {buttonText}
            </Button>
          )}
          
          {/* Always show fallback button for testing */}
          <div className="mt-4">
            <Button 
              onClick={handleFallbackButtonClick} 
              disabled={processingPayment}
              className="w-full"
              variant="outline"
            >
              {processingPayment ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Use Direct Checkout
            </Button>
          </div>
        </>
      )}
    </div>
  );
}