import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from '../services/app.service';

/**
 * 应用状态枚举
 */
enum HealthStatus {
  OK = 'ok',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: '获取应用信息' })
  @ApiResponse({ status: 200, description: '成功返回应用信息' })
  getAppInfo() {
    return {
      name: 'Mistakery API',
      version: '1.0.0',
      description: '错题追踪与学习优化平台',
      status: 'running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  @ApiResponse({ status: 200, description: '服务健康' })
  @ApiResponse({ status: 503, description: '服务不可用' })
  getHealth() {
    return {
      status: HealthStatus.OK,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      checks: {
        database: this.appService.getDatabaseStatus(),
        redis: this.appService.getRedisStatus(),
      },
    };
  }
}
