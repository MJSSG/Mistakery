import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const Redis = require('ioredis');
        const redis = new Redis({
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get('REDIS_PASSWORD') || undefined,
          db: configService.get<number>('REDIS_DB') || 0,
          retryDelayMs: 100,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          enableOfflineQueue: true,
        });

        redis.on('connect', () => {
          console.log('Redis connected successfully');
        });

        redis.on('error', (err: Error) => {
          console.error('Redis connection error:', err.message);
        });

        redis.on('close', () => {
          console.log('Redis connection closed');
        });

        redis.on('reconnecting', () => {
          console.log('Redis reconnecting...');
        });

        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
