import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

/**
 * 缓存模块配置
 * 提供 Redis 缓存策略和 TTL 配置
 * 当 Redis 不可用时降级到内存缓存
 */
@Global()
@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 3600, // 默认 1 小时
      max: 100, // 最大缓存条目数
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class AppCacheModule {}

/**
 * 缓存 TTL 配置（单位：秒）
 */
export const CACHE_TTL = {
  // 短期缓存（5分钟）
  SHORT: 300,
  // 中期缓存（30分钟）
  MEDIUM: 1800,
  // 长期缓存（2小时）
  LONG: 7200,
  // 永久缓存（24小时）
  PERMANENT: 86400,

  // 各模块特定 TTL
  AUTH_TOKEN: 3600, // 1小时
  USER_PROFILE: 1800, // 30分钟
  OVERVIEW_STATS: 600, // 10分钟
  SUBJECT_STATS: 600, // 10分钟
  TREND_DATA: 300, // 5分钟
  MISTAKE_LIST: 300, // 5分钟
  PRACTICE_SESSION: 7200, // 2小时
  REVIEW_SCHEDULE: 3600, // 1小时
};

/**
 * 缓存键前缀
 */
export const CACHE_PREFIX = {
  AUTH: 'auth',
  USER: 'user',
  ANALYTICS: 'analytics',
  MISTAKE: 'mistake',
  PRACTICE: 'practice',
  REVIEW: 'review',
  EXPORT: 'export',
};

/**
 * 生成缓存键
 */
export function generateCacheKey(prefix: string, identifier: string, ...suffixes: string[]): string {
  const parts = [prefix, identifier];
  if (suffixes && suffixes.length > 0) {
    parts.push(...suffixes);
  }
  return parts.join(':');
}

/**
 * 缓存键生成器
 */
export class CacheKeyBuilder {
  private parts: string[] = [];

  constructor(prefix: string) {
    this.parts = [prefix];
  }

  add(part: string): CacheKeyBuilder {
    this.parts.push(part);
    return this;
  }

  addUserId(userId: string): CacheKeyBuilder {
    this.add(userId);
    return this;
  }

  addFilters(filters: Record<string, any>): CacheKeyBuilder {
    const filterStr = JSON.stringify(filters);
    this.add(this.hash(filterStr));
    return this;
  }

  addDateRange(startDate: Date, endDate: Date): CacheKeyBuilder {
    this.add(startDate.toISOString());
    this.add(endDate.toISOString());
    return this;
  }

  build(): string {
    return this.parts.join(':');
  }

  private hash(str: string): string {
    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * 缓存策略配置
 */
export const CACHE_STRATEGIES = {
  // 用户缓存策略
  user: {
    profile: {
      ttl: CACHE_TTL.USER_PROFILE,
      key: (userId: string) => generateCacheKey(CACHE_PREFIX.USER, userId, 'profile'),
    },
    settings: {
      ttl: CACHE_TTL.MEDIUM,
      key: (userId: string) => generateCacheKey(CACHE_PREFIX.USER, userId, 'settings'),
    },
  },

  // 统计缓存策略
  analytics: {
    overview: {
      ttl: CACHE_TTL.OVERVIEW_STATS,
      key: (userId: string, timeRange: string) =>
        generateCacheKey(CACHE_PREFIX.ANALYTICS, userId, 'overview', timeRange),
    },
    subjects: {
      ttl: CACHE_TTL.SUBJECT_STATS,
      key: (userId: string, timeRange: string) =>
        generateCacheKey(CACHE_PREFIX.ANALYTICS, userId, 'subjects', timeRange),
    },
    trends: {
      ttl: CACHE_TTL.TREND_DATA,
      key: (userId: string, timeRange: string, interval?: number) =>
        generateCacheKey(CACHE_PREFIX.ANALYTICS, userId, 'trends', timeRange, String(interval || 7)),
    },
  },

  // 错题缓存策略
  mistake: {
    list: {
      ttl: CACHE_TTL.MISTAKE_LIST,
      key: (userId: string, filters: Record<string, any>) =>
        new CacheKeyBuilder(CACHE_PREFIX.MISTAKE)
          .addUserId(userId)
          .addFilters(filters)
          .build(),
    },
    detail: {
      ttl: CACHE_TTL.MEDIUM,
      key: (mistakeId: string) => generateCacheKey(CACHE_PREFIX.MISTAKE, mistakeId, 'detail'),
    },
  },

  // 练习缓存策略
  practice: {
    session: {
      ttl: CACHE_TTL.PRACTICE_SESSION,
      key: (sessionId: string) => generateCacheKey(CACHE_PREFIX.PRACTICE, sessionId, 'session'),
    },
    result: {
      ttl: CACHE_TTL.LONG,
      key: (recordId: string) => generateCacheKey(CACHE_PREFIX.PRACTICE, recordId, 'result'),
    },
  },

  // 复习缓存策略
  review: {
    schedule: {
      ttl: CACHE_TTL.REVIEW_SCHEDULE,
      key: (userId: string) => generateCacheKey(CACHE_PREFIX.REVIEW, userId, 'schedule'),
    },
    due: {
      ttl: CACHE_TTL.SHORT,
      key: (userId: string) => generateCacheKey(CACHE_PREFIX.REVIEW, userId, 'due'),
    },
  },
};
