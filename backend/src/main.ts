import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters/global-exception.filter';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

/**
 * 应用启动配置
 * 包含安全配置、性能优化、日志配置等
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // ====================================
  // 安全配置
  // ====================================

  // 启用 CORS（生产环境应更严格）
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',') || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Access-Control-Allow-Headers'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400, // 24小时
  });

  // CORS 配置已由 app.enableCors 全局处理，无需额外的中间件

  // 安全头部
  app.use((req, res, next) => {
    // 防止点击劫持
    res.setHeader('X-Frame-Options', 'DENY');
    // 防止 MIME 类型嗅探
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // 启用浏览器 XSS 保护
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // 严格传输安全（仅 HTTPS）
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    // 内容安全策略
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';");
    // 推荐人策略
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // 权限策略
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  // 全局前缀
  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/live', 'health/ready'],
  });

  // ====================================
  // 全局配置
  // ====================================

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动移除非白名单属性
      forbidNonWhitelisted: true, // 拒绝非白名单属性
      transform: true, // 自动转换类型
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // 生产环境隐藏详细错误
    })
  );

  // 全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局拦截器
  app.useGlobalInterceptors(
    new PerformanceInterceptor(), // 性能监控
    new TransformInterceptor(), // 响应转换
  );

  // ====================================
  // 启动服务器
  // ====================================

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  logger.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`🔒 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
