import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST, GET } from '../app/api/cron/daily-reset/route';
import { NextRequest } from 'next/server';
import { subscriptionService } from '@/lib/subscription';

// Mock the subscription service
vi.mock('@/lib/subscription', () => ({
  subscriptionService: {
    resetDailyCounters: vi.fn(),
  },
}));

// Mock environment variables
const originalEnv = process.env;

// Get the mocked function
const mockResetDailyCounters = vi.mocked(subscriptionService.resetDailyCounters);

describe('/api/cron/daily-reset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST /api/cron/daily-reset', () => {
    it('should successfully reset daily counters with valid token', async () => {
      // Setup
      process.env.CRON_SECRET_TOKEN = 'test-secret-token';
      mockResetDailyCounters.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/cron/daily-reset', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-secret-token',
        },
      });

      // Execute
      const response = await POST(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Daily usage counters reset successfully');
      expect(data.timestamp).toBeDefined();
      expect(data.duration).toBeDefined();
      expect(mockResetDailyCounters).toHaveBeenCalledOnce();
    });

    it('should return 401 for missing authorization header', async () => {
      // Setup
      process.env.CRON_SECRET_TOKEN = 'test-secret-token';

      const request = new NextRequest('http://localhost:3000/api/cron/daily-reset', {
        method: 'POST',
      });

      // Execute
      const response = await POST(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockResetDailyCounters).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      // Setup
      process.env.CRON_SECRET_TOKEN = 'test-secret-token';

      const request = new NextRequest('http://localhost:3000/api/cron/daily-reset', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer wrong-token',
        },
      });

      // Execute
      const response = await POST(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockResetDailyCounters).not.toHaveBeenCalled();
    });

    it('should return 500 when CRON_SECRET_TOKEN is not set', async () => {
      // Setup
      delete process.env.CRON_SECRET_TOKEN;

      const request = new NextRequest('http://localhost:3000/api/cron/daily-reset', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer some-token',
        },
      });

      // Execute
      const response = await POST(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(500);
      expect(data.error).toBe('Server configuration error');
      expect(mockResetDailyCounters).not.toHaveBeenCalled();
    });

    it('should handle subscription service errors gracefully', async () => {
      // Setup
      process.env.CRON_SECRET_TOKEN = 'test-secret-token';
      const error = new Error('Database connection failed');
      mockResetDailyCounters.mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/cron/daily-reset', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-secret-token',
        },
      });

      // Execute
      const response = await POST(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(500);
      expect(data.error).toBe('Daily reset failed');
      expect(data.message).toBe('Database connection failed');
      expect(data.timestamp).toBeDefined();
      expect(mockResetDailyCounters).toHaveBeenCalledOnce();
    });

    it('should handle non-Error exceptions', async () => {
      // Setup
      process.env.CRON_SECRET_TOKEN = 'test-secret-token';
      mockResetDailyCounters.mockRejectedValue('String error');

      const request = new NextRequest('http://localhost:3000/api/cron/daily-reset', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-secret-token',
        },
      });

      // Execute
      const response = await POST(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(500);
      expect(data.error).toBe('Daily reset failed');
      expect(data.message).toBe('Unknown error');
      expect(mockResetDailyCounters).toHaveBeenCalledOnce();
    });
  });

  describe('GET /api/cron/daily-reset', () => {
    it('should return health check information', async () => {
      // Execute
      const response = await GET();
      const data = await response.json();

      // Verify
      expect(response.status).toBe(200);
      expect(data.service).toBe('daily-reset');
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
      expect(data.utcTime).toBeDefined();
    });

    it('should return valid timestamp formats', async () => {
      // Execute
      const response = await GET();
      const data = await response.json();

      // Verify timestamp formats
      expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
      expect(new Date(data.utcTime).toUTCString()).toBe(data.utcTime);
    });
  });

  describe('Logging and Security', () => {
    it('should log successful operations', async () => {
      // Setup
      process.env.CRON_SECRET_TOKEN = 'test-secret-token';
      mockResetDailyCounters.mockResolvedValue(undefined);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const request = new NextRequest('http://localhost:3000/api/cron/daily-reset', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-secret-token',
        },
      });

      // Execute
      await POST(request);

      // Verify logging
      expect(consoleSpy).toHaveBeenCalledWith(
        'Starting daily usage reset',
        expect.objectContaining({
          timestamp: expect.any(String),
          utcTime: expect.any(String),
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Daily usage reset completed successfully',
        expect.objectContaining({
          timestamp: expect.any(String),
          duration: expect.stringMatching(/\d+ms/),
        })
      );

      consoleSpy.mockRestore();
    });

    it('should log unauthorized access attempts', async () => {
      // Setup
      process.env.CRON_SECRET_TOKEN = 'test-secret-token';
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const request = new NextRequest('http://localhost:3000/api/cron/daily-reset', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer wrong-token',
          'user-agent': 'test-agent',
        },
      });

      // Execute
      await POST(request);

      // Verify security logging
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unauthorized daily reset attempt',
        expect.objectContaining({
          timestamp: expect.any(String),
          userAgent: 'test-agent',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should log errors with stack traces', async () => {
      // Setup
      process.env.CRON_SECRET_TOKEN = 'test-secret-token';
      const error = new Error('Test error');
      mockResetDailyCounters.mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const request = new NextRequest('http://localhost:3000/api/cron/daily-reset', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-secret-token',
        },
      });

      // Execute
      await POST(request);

      // Verify error logging
      expect(consoleSpy).toHaveBeenCalledWith(
        'Daily usage reset failed',
        expect.objectContaining({
          timestamp: expect.any(String),
          error: 'Test error',
          stack: expect.any(String),
        })
      );

      consoleSpy.mockRestore();
    });
  });
});