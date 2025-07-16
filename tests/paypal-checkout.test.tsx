import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PayPalCheckout } from '../components/paypal-checkout';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock fetch API
global.fetch = vi.fn();

describe('PayPalCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.paypal
    Object.defineProperty(window, 'paypal', {
      value: {
        Buttons: vi.fn().mockReturnValue({
          render: vi.fn(),
        }),
      },
      configurable: true,
    });
  });

  it('renders loading state initially', () => {
    render(<PayPalCheckout />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders fallback button when script fails to load', async () => {
    // Remove paypal from window to simulate script load failure
    delete (window as any).paypal;
    
    render(<PayPalCheckout buttonText="Custom Button Text" />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Custom Button Text')).toBeInTheDocument();
  });

  it('calls onSuccess when payment is approved', async () => {
    const onSuccess = vi.fn().mockResolvedValue(undefined);
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subscriptionId: 'sub_123' }),
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });
    
    render(<PayPalCheckout onSuccess={onSuccess} />);
    
    // Wait for script to load
    await waitFor(() => {
      expect(window.paypal?.Buttons).toHaveBeenCalled();
    });
    
    // Get the createSubscription function from the Buttons call
    const createSubscription = (window.paypal?.Buttons as jest.Mock).mock.calls[0][0].createSubscription;
    
    // Call createSubscription to simulate PayPal flow
    await createSubscription({}, {});
    
    expect(global.fetch).toHaveBeenCalledWith('/api/subscription/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Get the onApprove function from the Buttons call
    const onApprove = (window.paypal?.Buttons as jest.Mock).mock.calls[0][0].onApprove;
    
    // Call onApprove to simulate successful payment
    await onApprove({ subscriptionID: 'sub_123' });
    
    expect(global.fetch).toHaveBeenCalledWith('/api/subscription/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId: 'sub_123',
      }),
    });
    
    expect(onSuccess).toHaveBeenCalledWith('sub_123');
  });

  it('calls onError when payment fails', async () => {
    const onError = vi.fn();
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    
    render(<PayPalCheckout onError={onError} />);
    
    // Wait for script to load
    await waitFor(() => {
      expect(window.paypal?.Buttons).toHaveBeenCalled();
    });
    
    // Get the createSubscription function from the Buttons call
    const createSubscription = (window.paypal?.Buttons as jest.Mock).mock.calls[0][0].createSubscription;
    
    // Call createSubscription to simulate PayPal flow
    await expect(createSubscription({}, {})).rejects.toThrow();
    
    expect(onError).not.toHaveBeenCalled(); // onError is only called in onApprove
    
    // Check that error state is set
    expect(screen.getByText('Failed to create subscription. Please try again.')).toBeInTheDocument();
  });

  it('calls onCancel when payment is cancelled', async () => {
    const onCancel = vi.fn();
    
    render(<PayPalCheckout onCancel={onCancel} />);
    
    // Wait for script to load
    await waitFor(() => {
      expect(window.paypal?.Buttons).toHaveBeenCalled();
    });
    
    // Get the onCancel function from the Buttons call
    const onCancelPayPal = (window.paypal?.Buttons as jest.Mock).mock.calls[0][0].onCancel;
    
    // Call onCancel to simulate cancelled payment
    onCancelPayPal();
    
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('handles fallback button click correctly', async () => {
    // Remove paypal from window to simulate script load failure
    delete (window as any).paypal;
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ approvalUrl: 'https://paypal.com/checkout' }),
    });
    
    const { getByText } = render(<PayPalCheckout buttonText="Fallback Button" />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Click the fallback button
    fireEvent.click(getByText('Fallback Button'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/subscription/create', { method: 'POST' });
    });
  });
});