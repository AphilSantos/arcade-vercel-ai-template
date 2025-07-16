import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PayPalServiceImpl } from '../lib/paypal';

// Mock the PayPal SDK
vi.mock('@paypal/paypal-server-sdk', () => ({
  Client: vi.fn().mockImplementation(() => ({
    subscriptionsController: {
      subscriptionsCreate: vi.fn(),
      subscriptionsGet: vi.fn(),
      subscriptionsCancel: vi.fn(),
    },
  })),
  Environment: {
    Sandbox: 'sandbox',
    Production: 'production',
  },
}));

describe('PayPalService', () => {
  let paypalService: PayPalServiceImpl;
  let mockSubscriptionsController: any;

  beforeEach(() => {
    // Set up environment variables
    process.env.PAYPAL_API_KEY = 'test-client-id';
    process.env.PAYPAL_SECRET = 'test-client-secret';
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

    paypalService = new PayPalServiceImpl();
    mockSubscriptionsController = (paypalService as any).client.subscriptionsController;
  });

  describe('createSubscription', () => {
    it('should create a subscription successfully', async () => {
      const mockResponse = {
        statusCode: 201,
        result: {
          id: 'I-BW452GLLEP1G',
          status: 'APPROVAL_PENDING',
        },
      };

      mockSubscriptionsController.subscriptionsCreate.mockResolvedValue(mockResponse);

      const subscriptionId = await paypalService.createSubscription('P-5ML4271244454362WXNWU5NQ');

      expect(subscriptionId).toBe('I-BW452GLLEP1G');
      expect(mockSubscriptionsController.subscriptionsCreate).toHaveBeenCalledWith({
        body: {
          planId: 'P-5ML4271244454362WXNWU5NQ',
          applicationContext: {
            brandName: 'AI Chatbot',
            locale: 'en-US',
            shippingPreference: 'NO_SHIPPING',
            userAction: 'SUBSCRIBE_NOW',
            paymentMethod: {
              payerSelected: 'PAYPAL',
              payeePreferred: 'IMMEDIATE_PAYMENT_REQUIRED',
            },
            returnUrl: 'http://localhost:3000/api/paypal/success',
            cancelUrl: 'http://localhost:3000/api/paypal/cancel',
          },
        },
      });
    });

    it('should throw error when subscription creation fails', async () => {
      const mockResponse = {
        statusCode: 400,
        result: null,
      };

      mockSubscriptionsController.subscriptionsCreate.mockResolvedValue(mockResponse);

      await expect(paypalService.createSubscription('invalid-plan-id')).rejects.toThrow(
        'Failed to create subscription'
      );
    });

    it('should throw error when API call fails', async () => {
      mockSubscriptionsController.subscriptionsCreate.mockRejectedValue(
        new Error('Network error')
      );

      await expect(paypalService.createSubscription('P-5ML4271244454362WXNWU5NQ')).rejects.toThrow(
        'Failed to create subscription'
      );
    });
  });

  describe('verifyWebhook', () => {
    it('should return true for valid webhook headers', async () => {
      const headers = {
        'paypal-transmission-sig': 'valid-signature',
        'paypal-cert-id': 'cert-id',
        'paypal-transmission-id': 'transmission-id',
        'paypal-transmission-time': '2023-01-01T00:00:00Z',
      };

      const isValid = await paypalService.verifyWebhook(headers, '{"event_type":"BILLING.SUBSCRIPTION.ACTIVATED"}');

      expect(isValid).toBe(true);
    });

    it('should return false for missing required headers', async () => {
      const headers = {
        'paypal-transmission-sig': 'valid-signature',
        // Missing other required headers
      };

      const isValid = await paypalService.verifyWebhook(headers, '{"event_type":"BILLING.SUBSCRIPTION.ACTIVATED"}');

      expect(isValid).toBe(false);
    });

    it('should return false when verification throws error', async () => {
      const headers = null as any;

      const isValid = await paypalService.verifyWebhook(headers, '{"event_type":"BILLING.SUBSCRIPTION.ACTIVATED"}');

      expect(isValid).toBe(false);
    });
  });

  describe('getSubscriptionDetails', () => {
    it('should get subscription details successfully', async () => {
      const mockResponse = {
        statusCode: 200,
        result: {
          id: 'I-BW452GLLEP1G',
          status: 'ACTIVE',
          planId: 'P-5ML4271244454362WXNWU5NQ',
          subscriber: {
            emailAddress: 'test@example.com',
            name: {
              givenName: 'John',
              surname: 'Doe',
            },
          },
        },
      };

      mockSubscriptionsController.subscriptionsGet.mockResolvedValue(mockResponse);

      const subscription = await paypalService.getSubscriptionDetails('I-BW452GLLEP1G');

      expect(subscription).toEqual({
        id: 'I-BW452GLLEP1G',
        status: 'ACTIVE',
        planId: 'P-5ML4271244454362WXNWU5NQ',
        subscriber: {
          emailAddress: 'test@example.com',
          name: {
            givenName: 'John',
            surname: 'Doe',
          },
        },
      });
    });

    it('should throw error when getting subscription details fails', async () => {
      const mockResponse = {
        statusCode: 404,
        result: null,
      };

      mockSubscriptionsController.subscriptionsGet.mockResolvedValue(mockResponse);

      await expect(paypalService.getSubscriptionDetails('invalid-id')).rejects.toThrow(
        'Failed to retrieve subscription details'
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      const mockResponse = {
        statusCode: 204,
      };

      mockSubscriptionsController.subscriptionsCancel.mockResolvedValue(mockResponse);

      await expect(
        paypalService.cancelSubscription('I-BW452GLLEP1G', 'User requested cancellation')
      ).resolves.not.toThrow();

      expect(mockSubscriptionsController.subscriptionsCancel).toHaveBeenCalledWith({
        subscriptionId: 'I-BW452GLLEP1G',
        body: {
          reason: 'User requested cancellation',
        },
      });
    });

    it('should throw error when cancellation fails', async () => {
      const mockResponse = {
        statusCode: 400,
      };

      mockSubscriptionsController.subscriptionsCancel.mockResolvedValue(mockResponse);

      await expect(
        paypalService.cancelSubscription('I-BW452GLLEP1G', 'User requested cancellation')
      ).rejects.toThrow('Failed to cancel subscription');
    });
  });
});