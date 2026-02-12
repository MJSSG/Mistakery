import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

/**
 * 全局 HTTP 异常过滤器
 * 统一处理和格式化错误响应
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // 提取错误信息
    let message = exception.message;
    let errors: any[] | undefined;

    if (typeof exceptionResponse === 'object') {
      const resp = exceptionResponse as any;
      message = resp.message || resp.error || message;
      errors = resp.errors;
    }

    // 构建错误响应
    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // 记录错误日志
    this.logError(status, request, errorResponse);

    // 发送响应
    response.status(status).json(errorResponse);
  }

  /**
   * 根据状态码记录不同级别的日志
   */
  private logError(status: number, request: any, errorResponse: any): void {
    const { method, url, ip } = request;

    if (status >= 500) {
      this.logger.error(
        `${method} ${url} - ${ip} - ${status}: ${errorResponse.message}`
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${method} ${url} - ${ip} - ${status}: ${errorResponse.message}`
      );
    }
  }
}

/**
 * 全局异常过滤器
 * 捕获所有未处理的异常
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // 确定状态码
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 构建错误响应
    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // 生产环境不暴露详细错误信息
    if (process.env.NODE_ENV === 'production' && status === 500) {
      errorResponse.message = 'Internal server error';
    }

    // 记录错误
    this.logger.error(
      `${request.method} ${request.url} - ${request.ip}`,
      exception instanceof Error ? exception.stack : exception
    );

    response.status(status).json(errorResponse);
  }
}
