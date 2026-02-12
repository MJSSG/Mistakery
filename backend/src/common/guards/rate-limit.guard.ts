import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Cache } from 'cache-manager';

/**
 * 请求频率限制中间件
 * 防止暴力攻击和过度请求
 */
export interface RateLimitOptions {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  keyPrefix?: string; // 缓存键前缀
  skipSuccessfulRequests?: boolean; // 是否跳过成功的请求
  skipFailedRequests?: boolean; // 是否跳过失败的请求
}

@Injectable()
export class RateLimitGuard implements NestMiddleware {
  private readonly defaultOptions: RateLimitOptions = {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 100, // 最多100个请求
    keyPrefix: 'rate_limit',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  };

  constructor(private cache: Cache) {}

  async use(req: Request, res: Response, next: NextFunction, options?: Partial<RateLimitOptions>) {
    const opts = { ...this.defaultOptions, ...options };
    const key = this.getKey(req, opts.keyPrefix!);

    try {
      const current = await this.cache.get<number>(key);
      const count = current || 0;

      if (count >= opts.maxRequests) {
        throw new ForbiddenException(
          `Too many requests. Please try again later. Limit: ${opts.maxRequests} requests per ${opts.windowMs}ms`
        );
      }

      // 增加计数
      await this.cache.set(key, count + 1, opts.windowMs / 1000);

      // 设置响应头
      res.setHeader('X-RateLimit-Limit', opts.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (opts.maxRequests - count - 1).toString());
      res.setHeader('X-RateLimit-Reset', Date.now() + opts.windowMs);

      next();
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // 缓存错误时不阻断请求
      next();
    }
  }

  /**
   * 生成限流键
   */
  private getKey(req: Request, prefix: string): string {
    // 使用 IP + 用户ID（如果有）作为键
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = (req as any).user?.id || 'anonymous';
    return `${prefix}:${ip}:${userId}`;
  }
}

/**
 * 严格的 API 限流
 */
export class StrictApiRateLimitGuard extends RateLimitGuard {
  constructor(cache: Cache) {
    super(cache);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    await super.use(req, res, next, {
      windowMs: 60 * 1000, // 1分钟
      maxRequests: 30, // 更严格的限制
      keyPrefix: 'api_strict',
    });
  }
}

/**
 * 登录限流
 */
export class LoginRateLimitGuard extends RateLimitGuard {
  constructor(cache: Cache) {
    super(cache);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    await super.use(req, res, next, {
      windowMs: 15 * 60 * 1000, // 15分钟
      maxRequests: 5, // 最多5次登录尝试
      keyPrefix: 'login',
    });
  }
}

/**
 * 上传文件限流
 */
export class UploadRateLimitGuard extends RateLimitGuard {
  constructor(cache: Cache) {
    super(cache);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    await super.use(req, res, next, {
      windowMs: 60 * 60 * 1000, // 1小时
      maxRequests: 20, // 最多20个上传
      keyPrefix: 'upload',
    });
  }
}
