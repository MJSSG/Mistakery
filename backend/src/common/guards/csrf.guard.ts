import { Injectable, NestMiddleware, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';

/**
 * CSRF 令牌接口
 */
export interface CsrfTokenOptions {
  saltLength: number;
  secretLength: number;
  tokenLength: number;
}

/**
 * CSRF 防护中间件
 * 使用同步令牌模式防止 CSRF 攻击
 */
@Injectable()
export class CsrfGuard implements NestMiddleware {
  private readonly tokenOptions: CsrfTokenOptions = {
    saltLength: 8,
    secretLength: 18,
    tokenLength: 32,
  };

  private readonly headerName = 'x-csrf-token';
  private readonly cookieName = '_csrf';

  constructor(
    private configService: ConfigService,
    private cache: Cache,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 对于安全方法（GET, HEAD, OPTIONS），生成并存储令牌
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const token = this.generateToken();
      await this.storeToken(req, token);
      res.setHeader(this.headerName, token);
      return next();
    }

    // 对于状态改变方法，验证令牌
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const token = this.extractToken(req);
      const storedToken = await this.getStoredToken(req);

      if (!token || !storedToken) {
        throw new UnauthorizedException('CSRF 令牌缺失');
      }

      if (!this.compareTokens(token, storedToken)) {
        throw new BadRequestException('CSRF 令牌无效');
      }

      // 验证后移除令牌（一次性使用）
      await this.removeToken(req);
    }

    next();
  }

  /**
   * 生成 CSRF 令牌
   */
  private generateToken(): string {
    const salt = randomBytes(this.tokenOptions.saltLength).toString('hex');
    const secret = randomBytes(this.tokenOptions.secretLength).toString('hex');
    return `${salt}:${secret}`;
  }

  /**
   * 生成令牌哈希
   */
  private hashToken(token: string): string {
    const secret = this.configService.get('CSRF_SECRET', 'default-csrf-secret-change-in-production');
    return createHash('sha256')
      .update(token + secret)
      .digest('hex');
  }

  /**
   * 存储令牌
   */
  private async storeToken(req: Request, token: string): Promise<void> {
    const key = this.getTokenKey(req);
    const hashedToken = this.hashToken(token);
    const userId = (req as any).user?.id || req.ip;
    await this.cache.set(`${key}:${userId}`, hashedToken, 3600); // 1小时过期
  }

  /**
   * 获取存储的令牌
   */
  private async getStoredToken(req: Request): Promise<string | undefined> {
    const key = this.getTokenKey(req);
    const userId = (req as any).user?.id || req.ip;
    return await this.cache.get<string>(`${key}:${userId}`);
  }

  /**
   * 移除令牌
   */
  private async removeToken(req: Request): Promise<void> {
    const key = this.getTokenKey(req);
    const userId = (req as any).user?.id || req.ip;
    await this.cache.del(`${key}:${userId}`);
  }

  /**
   * 提取请求中的令牌
   */
  private extractToken(req: Request): string | undefined {
    // 从头部获取
    const headerToken = req.headers[this.headerName] as string;
    if (headerToken) return headerToken;

    // 从表单获取
    if (req.body && req.body._csrf) {
      return req.body._csrf;
    }

    // 从查询参数获取（不推荐，但某些场景需要）
    if (req.query._csrf) {
      return req.query._csrf as string;
    }

    return undefined;
  }

  /**
   * 比较令牌（常量时间比较）
   */
  private compareTokens(token1: string, token2: string): boolean {
    const hash1 = this.hashToken(token1);
    const hash2 = token2;
    return timingSafeEqual(Buffer.from(hash1), Buffer.from(hash2));
  }

  /**
   * 生成令牌存储键
   */
  private getTokenKey(req: Request): string {
    // 使用 socket 的远程地址和端口作为唯一标识
    const socketId = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
    return `csrf:${req.ip}:${socketId}`;
  }
}

/**
 * CSRF 令牌生成器服务
 */
@Injectable()
export class CsrfTokenService {
  constructor(private cache: Cache) {}

  /**
   * 生成并存储令牌
   */
  async generateToken(sessionId: string, userId?: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const key = userId ? `csrf:${userId}:${sessionId}` : `csrf:${sessionId}`;
    await this.cache.set(key, token, 3600);
    return token;
  }

  /**
   * 验证令牌
   */
  async validateToken(token: string, sessionId: string, userId?: string): Promise<boolean> {
    const key = userId ? `csrf:${userId}:${sessionId}` : `csrf:${sessionId}`;
    const storedToken = await this.cache.get<string>(key);
    return storedToken === token;
  }

  /**
   * 撤销令牌
   */
  async revokeToken(sessionId: string, userId?: string): Promise<void> {
    const key = userId ? `csrf:${userId}:${sessionId}` : `csrf:${sessionId}`;
    await this.cache.del(key);
  }
}
