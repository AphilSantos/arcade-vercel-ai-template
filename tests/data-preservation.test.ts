import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { SubscriptionServiceImpl } from '@/lib/subscription';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { user } from '@/lib/db/schema';

// Mock the database client
vi.mock('postgres', () => {
  return {
    default: vi.fn(() => ({
      // Mock implementation of postgres client
    })),
  };
});

// Mock drizzle
vi.mock('drizzle-orm/postgres-js', () => {
  return {
    drizzle: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
    })),
  };
});

describe('Subscription Data Preservation', () => {
  let subscriptionService: SubscriptionServiceImpl;
  let mockDb: any;
  let mockUserData: any;

  beforeAll(() => {
    // Setup mock user data
    mockUserData = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      dailyConversationCount: 5,
      lastConversationDate: '2025-07-16',
      paid: null,
      paypalSubscriptionId: null,
      // Additional user data that should be preserved
      preferences: { theme: 'dark', notifications: true },
      conversationHistory: [{ id: 'conv1' }, { id: 'conv2' }],
    };
  });

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock database
    mockDb = drizzle(postgres(''));
    
    // Create subscription service instance
    subscriptionService = new SubscriptionServiceImpl();
  });

  it('should preserve user data during upgrade to paid plan', async () => {
    // Mock database select to return user data
    const selectMock = vi.fn().mockResolvedValue([mockUserData]);
    mockDb.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(selectMock),
      }),
    });
    
    // Mock database update
    const updateMock = vi.fn().mockResolvedValue({ rowCount: 1 });
    mockDb.update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(updateMock),
      }),
    });
    
    // Execute upgrade
    await subscriptionService.upgradeToPaid('test-user-id', 'paypal-sub-123');
    
    // Verify that the update was called with the correct parameters
    // The key verification is that we're only updating subscription-specific fields
    // and not overwriting other user data
    expect(mockDb.update).toHaveBeenCalledWith(user);
    expect(mockDb.update().set).toHaveBeenCalledWith(
      expect.objectContaining({
        paid: '1',
        paypalSubscriptionId: 'paypal-sub-123',
      })
    );
    
    // Verify that we're not resetting usage data during upgrade
    expect(mockDb.update().set).not.toHaveBeenCalledWith(
      expect.objectContaining({
        dailyConversationCount: 0,
      })
    );
    
    // Verify that we're preserving user data by not explicitly setting it
    expect(mockDb.update().set).not.toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.anything(),
        conversationHistory: expect.anything(),
      })
    );
  });

  it('should preserve user data during downgrade to free plan', async () => {
    // Update mock user data to be a paid user
    const paidUserData = {
      ...mockUserData,
      paid: '1',
      paypalSubscriptionId: 'paypal-sub-123',
    };
    
    // Mock database select to return paid user data
    const selectMock = vi.fn().mockResolvedValue([paidUserData]);
    mockDb.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(selectMock),
      }),
    });
    
    // Mock database update
    const updateMock = vi.fn().mockResolvedValue({ rowCount: 1 });
    mockDb.update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(updateMock),
      }),
    });
    
    // Execute downgrade
    await subscriptionService.downgradeToFree('test-user-id');
    
    // Verify that the update was called with the correct parameters
    expect(mockDb.update).toHaveBeenCalledWith(user);
    expect(mockDb.update().set).toHaveBeenCalledWith(
      expect.objectContaining({
        paid: null,
        paypalSubscriptionId: null,
        dailyConversationCount: 0,
      })
    );
    
    // Verify that we're preserving user data by not explicitly setting it
    expect(mockDb.update().set).not.toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.anything(),
        conversationHistory: expect.anything(),
      })
    );
  });

  it('should handle errors gracefully during plan changes', async () => {
    // Mock database to throw an error
    mockDb.select = vi.fn().mockImplementation(() => {
      throw new Error('Database connection error');
    });
    
    // Verify that the error is caught and handled
    await expect(subscriptionService.upgradeToPaid('test-user-id', 'paypal-sub-123'))
      .rejects.toThrow();
    
    // Verify that the error is caught and handled for downgrade as well
    await expect(subscriptionService.downgradeToFree('test-user-id'))
      .rejects.toThrow();
  });
});