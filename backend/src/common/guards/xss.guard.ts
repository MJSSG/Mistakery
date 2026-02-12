import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * XSS 防护拦截器
 * 检测并清理请求体中的恶意脚本
 */
@Injectable()
export class XssGuard implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // 只检查 POST、PUT、PATCH 请求
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      this.sanitizeRequest(request);
    }

    return next.handle();
  }

  /**
   * 清理请求数据
   */
  private sanitizeRequest(request: any): void {
    if (request.body) {
      request.body = this.sanitizeObject(request.body);
    }
    if (request.query) {
      request.query = this.sanitizeObject(request.query);
    }
    if (request.params) {
      request.params = this.sanitizeObject(request.params);
    }
  }

  /**
   * 递归清理对象
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[this.sanitizeString(key)] = this.sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * 清理字符串中的 XSS 攻击
   */
  private sanitizeString(str: string): string {
    if (typeof str !== 'string') {
      return str;
    }

    // 检测危险的 XSS 模式
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // 事件处理器如 onclick=
      /<img[^>]+src[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<object[^>]*>/gi,
      /<link[^>]*>/gi,
      /<style[^>]*>.*?<\/style>/gi,
      /<meta[^>]*>/gi,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(str)) {
        throw new BadRequestException(
          '检测到潜在的安全威胁：输入包含不允许的 HTML/JavaScript 标签'
        );
      }
    }

    // HTML 实体编码
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}

/**
 * SQL 注入检测拦截器
 */
@Injectable()
export class SqlInjectionGuard implements NestInterceptor {
  private readonly sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|UNION|SCRIPT)\b)/gi,
    /(--)|(#)|(\/\*)|(\*\/)/g,
    /(\bOR\b|\bAND\b).*=.*=/gi,
    /(\bor\b|\band\b).*=.*=/gi,
    /['";]--/g,
    /['";]*\bor\b.*['";]/gi,
    /['";]*\band\b.*['";]/gi,
    /exec\s*\(/gi,
    /eval\s*\(/gi,
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    this.checkForSqlInjection(request);

    return next.handle();
  }

  /**
   * 检查 SQL 注入
   */
  private checkForSqlInjection(request: any): void {
    const checkString = (str: string, path: string) => {
      if (typeof str !== 'string') return;

      for (const pattern of this.sqlPatterns) {
        if (pattern.test(str)) {
          throw new BadRequestException(
            `检测到潜在的 SQL 注入攻击：${path}`
          );
        }
      }
    };

    const checkObject = (obj: any, path: string = 'root') => {
      if (typeof obj === 'string') {
        checkString(obj, path);
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => checkObject(item, `${path}[${index}]`));
      } else if (obj !== null && typeof obj === 'object') {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            checkObject(obj[key], `${path}.${key}`);
          }
        }
      }
    };

    if (request.body) checkObject(request.body, 'body');
    if (request.query) checkObject(request.query, 'query');
    if (request.params) checkObject(request.params, 'params');
  }
}
