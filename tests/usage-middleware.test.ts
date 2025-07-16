import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock server-only module
vi.mock('server-only', () => ({}));

// Mock next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn()
}));

// Mock next/server
vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => ({ type: 'next' })),
    json: vi.fn((body, init) => ({ type: 'json', body, init }))
  }
}));

// Mock subscription service
const mockCanStartConversation = vi.fn();
const mockIncrementDailyUsage = vi.fn();

vi.mock('@/lib/subscription', () => ({
  subscriptionService: {
    canStartConversation: mockCanStartConversation,
    incrementDailyUsage: mockIncrementDailyUsage
  }
}));

// Import after mocking
import { usageMiddleware, incrementUsage } from '../middleware/usage-check';
import { getToken } from 'next-auth/jwt';

describe('Usage Middleware', () => {
  let mockRequest;

  beforeEach(() => {
    mockRequest = {} as any;
    vi.clearAllMocks();
  });

  describe('usageMiddleware', () => {
    it('should allow request when no user is authenticated', async () => {
      // Mock getToken to return null (no authenticated user)
      vi.mocked(getToken).mockResolvedValue(null);

      const response = await usageMiddleware(mockRequest);

      expect(getToken).toHaveBeenCalledWith({ req: mockRequest });
      expect(mockCanStartConversation).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
      expect(response).toEqual({ type: 'next' });
    });

    it('should allow request when user can start conversation', async () => {
      // Mock authenticated user
      vi.mocked(getToken).mockResolvedValue({ sub: 'user-123' } as any);
      
      // Mock user can start conversation
      mockCanStartConversation.mockResolvedValue(true);

      const response = await usageMiddleware(mockRequest);

      expect(getToken).toHaveBeenCalledWith({ req: mockRequest });
      expect(mockCanStartConversation).toHaveBeenCalledWith('user-123');
      expect(NextResponse.next).toHaveBeenCalled();
      expect(response).toEqual({ type: 'next' });
    });

    it('should return error response when user reached daily limit', async () => {
      // Mock authenticated user
      vi.mocked(getToken).mockResolvedValue({ sub: 'user-123' } as any);
      
      // Mock user cannot start conversation
      mockCanStartConversation.mockResolvedValue(false);

      const response = await usageMiddleware(mockRequest);

      expect(getToken).toHaveBeenCalledWith({ req: mockRequest });
      expect(mockCanStartConversation).toHaveBeenCalledWith('user-123');
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Daily conversation limit reached',
          code: 'USAGE_LIMIT_EXCEEDED',
          message: 'You have reached your daily conversation limit. Please upgrade to continue chatting.'
        },
        { status: 429 }
      );
      expect(response).toEqual({
        type: 'json',
        body: {
          error: 'Daily conversation limit reached',
          code: 'USAGE_LIMIT_EXCEEDED',
          message: 'You have reached your daily conversation limit. Please upgrade to continue chatting.'
        },
        init: { status: 429 }
      });
    });

    it('should allow request when an error occurs in the middleware', async () => {
      // Mock authenticated user
      vi.mocked(getToken).mockResolvedValue({ sub: 'user-123' } as any);
      
      // Mock an error in canStartConversation
      mockCanStartConversation.mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const response = await usageMiddleware(mockRequest);

      expect(getToken).toHaveBeenCalledWith({ req: mockRequest });
      expect(mockCanStartConversation).toHaveBeenCalledWith('user-123');
      expect(consoleSpy).toHaveBeenCalledWith('Error in usage middleware:', expect.any(Error));
      expect(NextResponse.next).toHaveBeenCalled();
      expect(response).toEqual({ type: 'next' });
      
      consoleSpy.mockRestore();
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage for user', async () => {
      mockIncrementDailyUsage.mockResolvedValue(undefined);

      await incrementUsage('user-123');

      expect(mockIncrementDailyUsage).toHaveBeenCalledWith('user-123');
    });

    it('should handle errors gracefully', async () => {
      mockIncrementDailyUsage.mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await incrementUsage('user-123');

      expect(mockIncrementDailyUsage).toHaveBeenCalledWith('user-123');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to increment usage for user:',
        'user-123',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});