import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './common/controllers/app.controller';
import { AppService } from './common/services/app.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter, HttpExceptionFilter as GlobalHttpExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { DatabaseModule } from './config/database.config';
import { RedisModule } from './config/redis.config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MistakeModule } from './modules/mistake/mistake.module';
import { SubjectModule } from './modules/subject/subject.module';
import { PracticeModule } from './modules/practice/practice.module';
import { UploadModule } from './modules/upload/upload.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ReviewModule } from './modules/review/review.module';
import { ExportModule } from './modules/export/export.module';
import { AppCacheModule } from './modules/cache/cache.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 数据库模块
    DatabaseModule,
    // RedisModule,  // Redis 未运行，暂时禁用

    // 缓存模块 (暂时禁用，有版本兼容问题)
    // AppCacheModule,

    // 认证模块
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
    }),

    // 业务模块
    AuthModule,
    UserModule,
    MistakeModule,
    SubjectModule,
    PracticeModule,
    UploadModule,
    AnalyticsModule,
    ReviewModule,
    ExportModule,
    // 其他模块将在后续开发中添加
    // StatisticsModule,
    // QuestionModule,

    // 静态资源服务（可选）
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtAuthGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
