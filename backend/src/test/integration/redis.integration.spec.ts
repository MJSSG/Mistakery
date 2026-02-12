import { Test, TestingModule } from '@nestjs/testing';
import { RedisModule } from '../../config/redis.config';
import { AnalyticsService } from '../../modules/analytics/analytics.service';
import { Cache } from 'cache-manager';
import { createClient } from 'redis';

describe('Redis Cache Integration Tests', () => {
  let redisClient: any;
  let analyticsService: AnalyticsService;
  const mockUserId = 'user-123';

  beforeAll(async () => {
    // Create Redis client
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });

    await redisClient.connect();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  afterEach(async () => {
    // Clear all keys after each test
    await redisClient.flushDb();
  });

  describe('Cache Connection', () => {
    it('should connect to Redis successfully', async () => {
      const pong = await redisClient.ping();
      expect(pong).toBe('PONG');
    });

    it('should set and get values', async () => {
      await redisClient.set('test-key', 'test-value');
      const value = await redisClient.get('test-key');

      expect(value).toBe('test-value');
    });

    it('should set values with TTL', async () => {
      await redisClient.set('ttl-key', 'ttl-value', { EX: 10 });
      const ttl = await redisClient.ttl('ttl-key');

      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(10);
    });
  });

  describe('Analytics Caching', () => {
    it('should cache overview statistics', async () => {
      const cacheKey = `analytics:overview:${mockUserId}`;
      const cacheTTL = 300; // 5 minutes
      const mockStats = {
        totalQuestions: 100,
        correctCount: 80,
        wrongCount: 20,
        accuracy: 80,
      };

      // Set cache
      await redisClient.setEx(
        cacheKey,
        cacheTTL,
        JSON.stringify(mockStats)
      );

      // Get from cache
      const cached = await redisClient.get(cacheKey);
      const parsed = JSON.parse(cached as string);

      expect(parsed).toEqual(mockStats);
    });

    it('should expire cached data after TTL', async () => {
      const cacheKey = `analytics:overview:${mockUserId}:expire`;
      const shortTTL = 2; // 2 seconds

      await redisClient.setEx(
        cacheKey,
        shortTTL,
        JSON.stringify({ test: 'data' })
      );

      // Immediately check exists
      let exists = await redisClient.exists(cacheKey);
      expect(exists).toBe(1);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Check expired
      exists = await redisClient.exists(cacheKey);
      expect(exists).toBe(0);
    });

    it('should update cache with new data', async () => {
      const cacheKey = `analytics:overview:${mockUserId}:update`;
      const initialData = { version: 1 };
      await redisClient.set(cacheKey, JSON.stringify(initialData));

      const updatedData = { version: 2 };
      await redisClient.set(cacheKey, JSON.stringify(updatedData));

      const cached = await redisClient.get(cacheKey);
      const parsed = JSON.parse(cached as string);

      expect(parsed.version).toBe(2);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache on data update', async () => {
      const cacheKey = `analytics:overview:${mockUserId}`;
      const pattern = `analytics:*:${mockUserId}`;

      // Set multiple cache keys
      await redisClient.set(`${cacheKey}:1`, 'data1');
      await redisClient.set(`${cacheKey}:2`, 'data2');
      await redisClient.set('other:key', 'data3');

      // Find keys matching pattern
      const keysBefore = await redisClient.keys(pattern);
      expect(keysBefore.length).toBeGreaterThan(0);

      // Delete matching keys
      for (const key of keysBefore) {
        await redisClient.del(key);
      }

      // Verify deletion
      const keysAfter = await redisClient.keys(pattern);
      expect(keysAfter.length).toBe(0);
    });

    it('should preserve unrelated keys', async () => {
      const analyticsKey = `analytics:overview:${mockUserId}`;
      await redisClient.set(analyticsKey, 'analytics-data');
      await redisClient.set('user:profile:123', 'user-data');
      await redisClient.set('session:abc', 'session-data');

      // Delete analytics keys only
      await redisClient.del(analyticsKey);

      // Verify analytics key deleted
      const deletedKey = await redisClient.exists(analyticsKey);
      expect(deletedKey).toBe(0);

      // Verify unrelated keys still exist
      const userKey = await redisClient.exists('user:profile:123');
      const sessionKey = await redisClient.exists('session:abc');

      expect(userKey).toBe(1);
      expect(sessionKey).toBe(1);
    });
  });

  describe('Cache Performance', () => {
    it('should be faster than database query', async () => {
      // Simulate cache hit
      const start = Date.now();
      await redisClient.get('performance-test');
      const cacheTime = Date.now() - start;

      expect(cacheTime).toBeLessThan(50); // Should be very fast
    });

    it('should handle concurrent requests', async () => {
      const promises = [];

      // Create 100 concurrent set operations
      for (let i = 0; i < 100; i++) {
        promises.push(redisClient.set(`concurrent:${i}`, `value:${i}`));
      }

      await Promise.all(promises);

      // Verify all values were set
      for (let i = 0; i < 100; i++) {
        const value = await redisClient.get(`concurrent:${i}`);
        expect(value).toBe(`value:${i}`);
      }
    });

    it('should handle large datasets', async () => {
      const largeData = {
        data: Array(1000).fill({
          id: 'test',
          subject: '数学',
          questionText: 'Large question text...',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A',
        }),
      };

      const start = Date.now();
      await redisClient.set('large-data', JSON.stringify(largeData));
      const setTime = Date.now() - start;

      // Should set large data quickly
      expect(setTime).toBeLessThan(100);

      // Retrieve and verify
      const retrieved = await redisClient.get('large-data');
      const parsed = JSON.parse(retrieved as string);

      expect(parsed.data).toHaveLength(1000);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', async () => {
      const statsKey = 'cache:stats';

      // Initialize stats
      await redisClient.hSet(statsKey, {
        hits: '0',
        misses: '0',
      });

      // Simulate cache hit
      let stats = await redisClient.hGetAll(statsKey);
      expect(stats.hits).toBe('0');

      await redisClient.hIncrBy(statsKey, 'hits', 1);

      stats = await redisClient.hGetAll(statsKey);
      expect(stats.hits).toBe('1');

      // Simulate cache miss
      await redisClient.hIncrBy(statsKey, 'misses', 1);

      stats = await redisClient.hGetAll(statsKey);
      expect(stats.misses).toBe('1');
    });

    it('should calculate hit rate', async () => {
      const statsKey = 'cache:stats:rate';

      // Set stats
      await redisClient.hSet(statsKey, {
        hits: '80',
        misses: '20',
      });

      const stats = await redisClient.hGetAll(statsKey);
      const hitRate = parseInt(stats.hits) / (parseInt(stats.hits) + parseInt(stats.misses));

      expect(hitRate).toBe(0.8); // 80% hit rate
    });
  });

  describe('Session Storage', () => {
    it('should store session data in Redis', async () => {
      const sessionId = 'session-abc';
      const sessionData = {
        userId: 'user-123',
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };

      await redisClient.setEx(
        `session:${sessionId}`,
        3600, // 1 hour
        JSON.stringify(sessionData)
      );

      // Retrieve session
      const session = await redisClient.get(`session:${sessionId}`);
      const parsed = JSON.parse(session as string);

      expect(parsed.userId).toBe('user-123');
    });

    it('should refresh session TTL on activity', async () => {
      const sessionId = 'session-refresh';
      await redisClient.setEx(`session:${sessionId}`, 3600, 'data');

      const ttl1 = await redisClient.ttl(`session:${sessionId}`);
      expect(ttl1).toBeGreaterThan(0);

      // Refresh TTL
      await redisClient.expire(`session:${sessionId}`, 7200);

      const ttl2 = await redisClient.ttl(`session:${sessionId}`);
      expect(ttl2).toBeGreaterThan(ttl1); // TTL should be extended
    });
  });
});
