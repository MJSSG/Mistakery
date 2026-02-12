import { Injectable } from '@nestjs/common';

/**
 * 应用服务
 * 提供应用级别的健康检查和状态信息
 */
@Injectable()
export class AppService {
  getHello(): string {
    return 'Mistakery Backend API';
  }

  /**
   * 获取数据库状态
   */
  getDatabaseStatus(): { status: string; latency?: number } {
    // 这里应该实际检查数据库连接
    // 简化实现，返回默认状态
    return {
      status: 'up',
      // latency: latency, // 实际连接延迟
    };
  }

  /**
   * 获取 Redis 状态
   */
  getRedisStatus(): { status: string; latency?: number } {
    // 这里应该实际检查 Redis 连接
    // 简化实现，返回默认状态
    return {
      status: 'up',
      // latency: latency, // 实际连接延迟
    };
  }
}
