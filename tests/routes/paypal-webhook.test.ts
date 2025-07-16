import { test, expect } from '@playwright/test';

test.describe('PayPal Webhook Handler', () => {
  test('should handle valid webhook with subscription created event', async ({ request }) => {
    const webhookPayload = {
      event_type: 'BILLING.SUBSCRIPTION.CREATED',
      resource: {
        id: 'I-BW452GLLEP1G',
        status: 'ACTIVE',
        plan_id: 'P-5ML4271244454362WXNWU5NQ',
        subscriber: {
          email_address: 'test@example.com'
        }
      }
    };

    const response = await request.post('/api/webhooks/paypal', {
      data: JSON.stringify(webhookPayload),
      headers: {
        'Content-Type': 'application/json',
        'paypal-transmission-sig': 'valid-signature',
        'paypal-cert-id': 'cert-id',
        'paypal-transmission-id': 'transmission-id',
        'paypal-transmission-time': '2023-01-01T00:00:00Z',
      }
    });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.status).toBe('success');
  });

  test('should reject webhook with invalid signature', async ({ request }) => {
    const webhookPayload = {
      event_type: 'BILLING.SUBSCRIPTION.CREATED',
      resource: {
        id: 'I-BW452GLLEP1G',
        status: 'ACTIVE'
      }
    };

    const response = await request.post('/api/webhooks/paypal', {
      data: JSON.stringify(webhookPayload),
      headers: {
        'Content-Type': 'application/json',
        // Missing required PayPal headers
      }
    });

    expect(response.status()).toBe(401);
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Invalid webhook signature');
  });

  test('should handle subscription cancelled event', async ({ request }) => {
    const webhookPayload = {
      event_type: 'BILLING.SUBSCRIPTION.CANCELLED',
      resource: {
        id: 'I-BW452GLLEP1G',
        status: 'CANCELLED'
      }
    };

    const response = await request.post('/api/webhooks/paypal', {
      data: JSON.stringify(webhookPayload),
      headers: {
        'Content-Type': 'application/json',
        'paypal-transmission-sig': 'valid-signature',
        'paypal-cert-id': 'cert-id',
        'paypal-transmission-id': 'transmission-id',
        'paypal-transmission-time': '2023-01-01T00:00:00Z',
      }
    });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.status).toBe('success');
  });

  test('should handle payment failed event', async ({ request }) => {
    const webhookPayload = {
      event_type: 'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
      resource: {
        id: 'I-BW452GLLEP1G',
        status: 'SUSPENDED'
      }
    };

    const response = await request.post('/api/webhooks/paypal', {
      data: JSON.stringify(webhookPayload),
      headers: {
        'Content-Type': 'application/json',
        'paypal-transmission-sig': 'valid-signature',
        'paypal-cert-id': 'cert-id',
        'paypal-transmission-id': 'transmission-id',
        'paypal-transmission-time': '2023-01-01T00:00:00Z',
      }
    });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.status).toBe('success');
  });

  test('should ignore unhandled event types', async ({ request }) => {
    const webhookPayload = {
      event_type: 'BILLING.SUBSCRIPTION.UPDATED',
      resource: {
        id: 'I-BW452GLLEP1G',
        status: 'ACTIVE'
      }
    };

    const response = await request.post('/api/webhooks/paypal', {
      data: JSON.stringify(webhookPayload),
      headers: {
        'Content-Type': 'application/json',
        'paypal-transmission-sig': 'valid-signature',
        'paypal-cert-id': 'cert-id',
        'paypal-transmission-id': 'transmission-id',
        'paypal-transmission-time': '2023-01-01T00:00:00Z',
      }
    });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.status).toBe('success');
  });
});