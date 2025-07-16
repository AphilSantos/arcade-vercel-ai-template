'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface PayPalDirectButtonProps {
  planId: string;
  onSuccess?: (subscriptionId: string) => void;
  className?: string;
}

/**
 * PayPal direct button integration using PayPal's button factory
 */
export function PayPalDirectButton({
  planId,
  onSuccess,
  className = '',
}: PayPalDirectButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  
  useEffect(() => {
    // Create a unique container ID
    const containerId = `paypal-button-container-${planId}`;
    
    // Set the container ID
    if (!containerRef.current) {
      console.error('PayPal container ref is not available');
      return;
    }
    
    containerRef.current.id = containerId;
    
    // Get the client ID from environment variables
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    
    if (!clientId) {
      console.error('PayPal client ID is not defined in environment variables');
      return;
    }
    
    console.log('Loading PayPal SDK with client ID:', clientId.substring(0, 5) + '...');

    // Remove any existing PayPal scripts to avoid conflicts
    const existingScript = document.getElementById('paypal-script');
    if (existingScript) {
      try {
        existingScript.parentNode?.removeChild(existingScript);
      } catch (e) {
        console.error('Error removing existing PayPal script:', e);
      }
    }

    // Create the PayPal SDK script
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription&currency=USD`;
    script.dataset.sdkIntegrationSource = 'button-factory';
    script.id = 'paypal-script';
    script.async = true;
    
    // Set a timeout to detect if the script takes too long to load
    const timeoutId = setTimeout(() => {
      if (!window.paypal) {
        console.error('PayPal SDK load timeout');
      }
    }, 10000); // 10 seconds timeout
    
    script.onload = () => {
      clearTimeout(timeoutId);
      console.log('PayPal SDK loaded successfully');
      
      if (window.paypal && containerRef.current) {
        try {
          window.paypal.Buttons({
            style: {
              shape: 'rect',
              color: 'blue',
              layout: 'vertical',
              label: 'subscribe'
            },
            createSubscription: function(data, actions) {
              return actions.subscription.create({
                plan_id: planId
              });
            },
            onApprove: async function(data) {
              console.log('Subscription approved with ID:', data.subscriptionID);
              
              // Call our API to confirm the subscription
              try {
                const response = await fetch('/api/subscription/confirm', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    subscriptionId: data.subscriptionID
                  })
                });
                
                if (!response.ok) {
                  console.error('Failed to confirm subscription');
                  return;
                }
                
                // Call the onSuccess callback if provided
                if (onSuccess) {
                  onSuccess(data.subscriptionID);
                } else {
                  // Refresh the page
                  window.location.href = '/account?planChanged=true&status=upgraded';
                }
              } catch (error) {
                console.error('Error confirming subscription:', error);
              }
            }
          }).render('#' + containerId);
        } catch (error) {
          console.error('Error rendering PayPal buttons:', error);
        }
      }
    };
    
    script.onerror = (e) => {
      clearTimeout(timeoutId);
      console.error('Failed to load PayPal SDK:', e);
    };

    document.body.appendChild(script);
    scriptRef.current = script;
    
    // Cleanup function - simplified to avoid errors
    return () => {
      clearTimeout(timeoutId);
      
      // We don't remove the script on cleanup to avoid issues with hot reloading
      // The script will be replaced on the next render if needed
      
      // Just clean up the callback
      if (window.onPayPalSubscriptionSuccess) {
        delete window.onPayPalSubscriptionSuccess;
      }
    };
  }, [planId, onSuccess]);
  
  return (
    <div className={className}>
      <div ref={containerRef} className="min-h-[150px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}

// Add the callback type to the window object
declare global {
  interface Window {
    onPayPalSubscriptionSuccess?: (subscriptionId: string) => void;
  }
}