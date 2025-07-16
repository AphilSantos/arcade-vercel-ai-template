'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Crown, Calendar, CreditCard, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { SubscriptionError } from '@/components/subscription-error';
import { PlanChangeNotification } from '@/components/plan-change-notification';
import { PayPalDirectButton } from '@/components/paypal-direct-button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SubscriptionManagementProps {
  userId: string;
}

export function SubscriptionManagement({ userId }: SubscriptionManagementProps) {
  const subscription = useSubscription(userId);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeNotification, setShowUpgradeNotification] = useState(false);
  const [showDowngradeNotification, setShowDowngradeNotification] = useState(false);
  
  // Check URL parameters for plan change notifications
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planChanged = urlParams.get('planChanged');
    const planStatus = urlParams.get('status');
    
    if (planChanged === 'true') {
      if (planStatus === 'upgraded') {
        setShowUpgradeNotification(true);
      } else if (planStatus === 'downgraded') {
        setShowDowngradeNotification(true);
      }
      
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Extract specific error information if available
        const errorMessage = data.message || data.error || 'Failed to create subscription';
        const errorCode = data.error || 'UNKNOWN_ERROR';
        
        console.error(`Subscription creation failed: ${errorCode} - ${errorMessage}`);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      if (data.approvalUrl) {
        toast.success('Redirecting to PayPal for checkout');
        window.location.href = data.approvalUrl;
      } else {
        toast.error('No approval URL returned from payment service');
        throw new Error('Missing approval URL in response');
      }
    } catch (error) {
      console.error('Failed to create subscription:', error);
      toast.error('Failed to start upgrade process. Please try again later.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: cancelReason }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Extract specific error information if available
        const errorMessage = data.message || data.error || 'Failed to cancel subscription';
        const errorCode = data.error || 'UNKNOWN_ERROR';
        
        console.error(`Subscription cancellation failed: ${errorCode} - ${errorMessage}`);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      toast.success(data.message);
      
      // Refresh subscription data
      if (subscription.refresh) {
        subscription.refresh();
      }
      
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (subscription.isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (subscription.error) {
    return (
      <SubscriptionError
        title="Subscription Error"
        message="Failed to load subscription data. Please refresh the page and try again."
        code="SUBSCRIPTION_DATA_ERROR"
        variant="destructive"
        retryable={true}
        onRetry={() => {
          if (subscription.refresh) {
            subscription.refresh();
          } else {
            window.location.reload();
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Change Notifications */}
      {showUpgradeNotification && (
        <PlanChangeNotification 
          type="upgrade" 
          onDismiss={() => setShowUpgradeNotification(false)}
        />
      )}
      
      {showDowngradeNotification && (
        <PlanChangeNotification 
          type="downgrade" 
          onDismiss={() => setShowDowngradeNotification(false)}
        />
      )}
      
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {subscription.plan === 'paid' ? (
                <>
                  <Crown className="size-5 text-yellow-500" />
                  <div>
                    <CardTitle className="text-lg">Premium Plan</CardTitle>
                    <CardDescription>Unlimited conversations</CardDescription>
                  </div>
                </>
              ) : (
                <>
                  <Info className="size-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-lg">Free Plan</CardTitle>
                    <CardDescription>
                      {subscription.remainingConversations} of 5 daily conversations remaining
                    </CardDescription>
                  </div>
                </>
              )}
            </div>
            <Badge 
              variant={subscription.plan === 'paid' ? 'default' : 'secondary'}
              className={cn(
                subscription.plan === 'paid' && 'bg-green-600 text-white'
              )}
            >
              {subscription.plan === 'paid' ? 'Premium' : 'Free'}
            </Badge>
          </div>
        </CardHeader>
        
        {subscription.plan === 'free' && (
          <CardContent>
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    subscription.remainingConversations <= 5 
                      ? 'bg-amber-500' 
                      : subscription.remainingConversations === 0 
                        ? 'bg-red-500' 
                        : 'bg-blue-600'
                  )}
                  style={{ width: `${(subscription.remainingConversations / 5) * 100}%` }}
                />
              </div>
              
              {subscription.remainingConversations <= 5 && subscription.remainingConversations > 0 && (
                <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertDescription>
                    You&apos;re running low on conversations today. Consider upgrading to Premium for unlimited access.
                  </AlertDescription>
                </Alert>
              )}
              
              {subscription.remainingConversations === 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertDescription>
                    You&apos;ve reached your daily conversation limit. Upgrade to Premium to continue chatting.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* PayPal Direct Button Integration */}
              <div className="mb-4">
                <PayPalDirectButton 
                  planId={process.env.PAYPAL_PLAN_ID || 'P-5K585630K51724217NB364QI'}
                  onSuccess={() => {
                    toast.success('Subscription activated successfully!');
                    if (subscription.refresh) {
                      subscription.refresh();
                    }
                  }}
                />
              </div>
              
              {/* Fallback button */}
              <Button 
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full"
                variant="outline"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="size-4 mr-2" />
                    Use Alternative Checkout
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Premium Plan Details */}
      {subscription.plan === 'paid' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              Subscription Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <p className="text-sm font-medium text-green-600">Active</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Next Billing Date</Label>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="size-3" />
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 hover:text-red-700">
                    Cancel Subscription
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Subscription</DialogTitle>
                    <DialogDescription>
                      We&apos;re sorry to see you go! Your subscription will remain active until the end of your current billing period.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cancel-reason">
                        Please tell us why you&apos;re cancelling (optional)
                      </Label>
                      <Textarea
                        id="cancel-reason"
                        placeholder="Your feedback helps us improve..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelDialog(false)}
                      disabled={isCancelling}
                    >
                      Keep Subscription
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Subscription'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
          <CardDescription>Compare what&apos;s included in each plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Info className="size-4 text-blue-500" />
                Free Plan
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 5 conversations per day</li>
                <li>• Basic AI models</li>
                <li>• Standard support</li>
                <li>• Conversation history</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Crown className="size-4 text-yellow-500" />
                Premium Plan
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Unlimited conversations</li>
                <li>• Access to all AI models</li>
                <li>• Priority support</li>
                <li>• Advanced features</li>
                <li>• No daily limits</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}