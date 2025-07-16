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
    
    // Validate client ID format (PayPal client IDs should be longer and have specific format)
    if (clientId.length < 50) {
      console.error('PayPal client ID appears to be invalid or truncated:', clientId);
      return;
    }

    // Function to render PayPal buttons
    const renderPayPalButtons = () => {
      if (window.paypal && containerRef.current) {
        // Clear any existing content
        containerRef.current.innerHTML = '';
        
        try {
          window.paypal.Buttons({
            style: {
              shape: 'rect',
              color: 'blue',
              layout: 'vertical',
              label: 'subscribe'
            },
            createSubscription: function(_data: any, actions: any) {
              console.log('Creating subscription with plan ID:', planId);
              return actions.subscription.create({
                plan_id: planId
              });
            },
            onApprove: async function(data: any) {
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
            },
            onError: function(err: any) {
              console.error('PayPal button error:', err);
            }
          }).render('#' + containerId);
        } catch (error) {
          console.error('Error rendering PayPal buttons:', error);
        }
      }
    };

    // Check if PayPal SDK is already loaded
    if (window.paypal) {
      console.log('PayPal SDK already loaded, rendering buttons');
      renderPayPalButtons();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.getElementById('paypal-script');
    if (existingScript) {
      console.log('PayPal SDK script already exists, waiting for load');
      const checkPayPal = setInterval(() => {
        if (window.paypal) {
          clearInterval(checkPayPal);
          renderPayPalButtons();
        }
      }, 100);
      
      // Clear interval after 10 seconds to prevent infinite checking
      setTimeout(() => clearInterval(checkPayPal), 10000);
      return;
    }
    
    console.log('Loading PayPal SDK with client ID:', clientId.substring(0, 10) + '...');

    // Create the PayPal SDK script
    const script = document.createElement('script');
    
    // Use production PayPal environment
    const useSandbox = false; // Using production PayPal credentials
    const baseUrl = useSandbox ? 'https://www.sandbox.paypal.com' : 'https://www.paypal.com';
    
    script.src = `${baseUrl}/sdk/js?client-id=${clientId}&vault=true&intent=subscription&currency=USD&components=buttons`;
    script.dataset.sdkIntegrationSource = 'button-factory';
    script.id = 'paypal-script';
    script.async = true;
    
    console.log('PayPal Environment:', useSandbox ? 'Sandbox' : 'Production');
    console.log('PayPal SDK URL:', script.src);
    
    // Set a timeout to detect if the script takes too long to load
    const timeoutId = setTimeout(() => {
      if (!window.paypal) {
        console.error('PayPal SDK load timeout');
      }
    }, 10000); // 10 seconds timeout
    
    script.onload = () => {
      clearTimeout(timeoutId);
      console.log('PayPal SDK loaded successfully');
      renderPayPalButtons();
    };
    
    script.onerror = (e) => {
      clearTimeout(timeoutId);
      console.error('Failed to load PayPal SDK:', e);
      
      // Show user-friendly error message
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="text-center p-4 border border-red-200 rounded-lg bg-red-50">
            <p class="text-red-800 font-medium">PayPal Loading Error</p>
            <p class="text-red-600 text-sm mt-1">Unable to load PayPal checkout. Please try refreshing the page.</p>
            <button onclick="window.location.reload()" class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Refresh Page
            </button>
          </div>
        `;
      }
    };

    document.body.appendChild(script);
    scriptRef.current = script;
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
    };
  }, [planId, onSuccess]);
  
  return (
    <div className={className}>
      <div ref={containerRef} className="min-h-[150px] flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
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