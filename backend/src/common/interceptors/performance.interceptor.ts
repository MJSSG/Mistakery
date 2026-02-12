import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

/**
 * 性能监控拦截器
 * 记录请求响应时间，识别慢查询
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);
  private readonly slowRequestThreshold = 3000; // 3秒

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const now = Date.now();
    const { method, url, ip } = request;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          this.logRequest(method, url, ip, duration);
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logError(method, url, ip, duration, error);
        },
      })
    );
  }

  /**
   * 记录普通请求
   */
  private logRequest(method: string, url: string, ip: string, duration: number): void {
    const status = duration > this.slowRequestThreshold ? 'SLOW' : 'OK';
    const message = `${method} ${url} - ${ip} - ${duration}ms`;

    if (status === 'SLOW') {
      this.logger.warn(`⚠️  ${message}`);
    } else {
      this.logger.log(message);
    }
  }

  /**
   * 记录错误请求
   */
  private logError(method: string, url: string, ip: string, duration: number, error: any): void {
    this.logger.error(
      `❌ ${method} ${url} - ${ip} - ${duration}ms - ${error.message}`
    );
  }
}

/**
 * 请求体大小限制拦截器
 */
@Injectable()
export class RequestSizeLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestSizeLimitInterceptor.name);
  private readonly maxSize = 10 * 1024 * 1024; // 10MB

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const contentLength = parseInt(request.headers['content-length'] || '0');

    if (contentLength > this.maxSize) {
      this.logger.warn(`Request body too large: ${contentLength} bytes`);
      throw new Error('Request body too large');
    }

    return next.handle();
  }
}

/**
 * 响应压缩拦截器
 */
@Injectable()
export class CompressionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();

    // 检查客户端是否支持压缩
    const acceptEncoding = request.headers['accept-encoding'] || '';
    if (acceptEncoding.includes('gzip')) {
      response.setHeader('Content-Encoding', 'gzip');
    } else if (acceptEncoding.includes('deflate')) {
      response.setHeader('Content-Encoding', 'deflate');
    }

    return next.handle();
  }
}
