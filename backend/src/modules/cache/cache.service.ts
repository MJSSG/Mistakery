import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CACHE_TTL, generateCacheKey, CacheKeyBuilder } from './cache.module';

/**
 * 缓存管理服务
 * 提供统一的缓存操作接口
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cache.get<T>(key);
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * 设置缓存
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cache.set(key, value, ttl);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * 批量删除缓存
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.cache.store.keys(`${pattern}*`);
      if (keys.length > 0) {
        await this.cache.del(keys);
      }
    } catch (error) {
      this.logger.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  /**
   * 清空所有缓存
   */
  async flush(): Promise<void> {
    try {
      await this.cache.reset();
      this.logger.log('Cache flushed successfully');
    } catch (error) {
      this.logger.error('Cache flush error:', error);
    }
  }

  /**
   * 缓存包装器 - 自动缓存函数结果
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    // 尝试从缓存获取
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      this.logger.debug(`Cache hit for key: ${key}`);
      return cached;
    }

    this.logger.debug(`Cache miss for key: ${key}, executing function`);

    // 执行原函数
    const result = await fn();

    // 存入缓存
    await this.set(key, result, ttl);

    return result;
  }

  /**
   * 预热缓存
   */
  async warmup(items: Array<{ key: string; fn: () => Promise<any>; ttl?: number }>): Promise<void> {
    this.logger.log(`Warming up ${items.length} cache entries`);

    const promises = items.map(({ key, fn, ttl }) =>
      this.wrap(key, fn, ttl).catch(error => {
        this.logger.error(`Failed to warmup cache for key ${key}:`, error);
      })
    );

    await Promise.all(promises);
  }

  /**
   * 获取缓存统计
   */
  async getStats(pattern: string = '*'): Promise<{
    count: number;
    size: number;
    keys: string[];
  }> {
    try {
      const keys = await this.cache.store.keys(`${pattern}*`);
      let totalSize = 0;

      for (const key of keys) {
        const value = await this.cache.get(key);
        if (value) {
          totalSize += JSON.stringify(value).length;
        }
      }

      return {
        count: keys.length,
        size: Math.round(totalSize / 1024), // KB
        keys,
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return { count: 0, size: 0, keys: [] };
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanup(): Promise<void> {
    this.logger.log('Running cache cleanup...');
    // Redis 自动清理过期键，这里可以添加额外的清理逻辑
    await this.del('cleanup:*');
  }

  /**
   * 生成缓存键的辅助方法
   */
  static generateKey(...parts: string[]): string {
    return parts.join(':');
  }

  static hash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
