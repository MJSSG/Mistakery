import { Injectable, Logger } from '@nestjs/common';
import { PerformanceAggregator } from './performance-aggregator.service';
import {
  TimeRange,
  StatisticsOverview,
  SubjectStatistics,
  TrendsResponse,
  DetailReportResponse,
  StudyAdviceResponse,
  SortBy,
  SortOrder,
} from './dto/analytics.dto';

/**
 * 缓存键前缀
 */
const CACHE_PREFIX = 'analytics:';
const CACHE_TTL = 300; // 5分钟缓存

/**
 * 分析服务
 * 提供统计数据缓存和聚合功能
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private cache = new Map<string, { data: any; expiresAt: number }>();

  constructor(private performanceAggregator: PerformanceAggregator) {}

  /**
   * 获取缓存
   */
  private getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * 设置缓存
   */
  private setCache<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(userId: string, method: string, params: any = {}): string {
    const paramsStr = JSON.stringify(params);
    return `${CACHE_PREFIX}${userId}:${method}:${Buffer.from(paramsStr).toString('base64')}`;
  }

  /**
   * 清除用户相关缓存
   */
  clearUserCache(userId: string): void {
    const prefix = `${CACHE_PREFIX}${userId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
    this.logger.log(`Cleared cache for user ${userId}`);
  }

  /**
   * 获取统计概览
   */
  async getStatisticsOverview(
    userId: string,
    timeRange: TimeRange = TimeRange.ALL,
  ): Promise<StatisticsOverview> {
    const cacheKey = this.generateCacheKey(userId, 'overview', { timeRange });
    const cached = this.getCache<StatisticsOverview>(cacheKey);
    if (cached) {
      return cached;
    }

    const examRecords = await this.performanceAggregator.getUserExamRecords(
      userId,
      timeRange,
    );

    // 基础统计
    const totalExams = examRecords.length;
    const totalQuestions = examRecords.reduce((sum, r) => sum + r.questionCount, 0);
    const totalCorrect = examRecords.reduce((sum, r) => sum + r.correctCount, 0);
    const totalIncorrect = examRecords.reduce((sum, r) => sum + r.incorrectCount, 0);
    const overallAccuracy =
      totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const totalTimeSpent = examRecords.reduce((sum, r) => sum + r.timeSpent, 0);
    const averageTimePerQuestion =
      totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0;

    // 最近练习
    const recentExams = examRecords.slice(0, 10).map((r) => ({
      id: r.id,
      name: r.examName,
      accuracy: parseFloat(r.accuracy.toFixed(2)),
      timeSpent: r.timeSpent,
      completedAt: r.completedAt!,
    }));

    // 掌握情况
    const subjectStats = await this.performanceAggregator.getSubjectStatistics(
      userId,
      timeRange,
    );

    const masteryLevel = {
      mastered: subjectStats.filter((s) => s.masteryLevel === 'mastered').length,
      proficient: subjectStats.filter((s) => s.masteryLevel === 'proficient').length,
      learning: subjectStats.filter((s) => s.masteryLevel === 'learning').length,
      struggling: subjectStats.filter((s) => s.masteryLevel === 'struggling').length,
    };

    const result: StatisticsOverview = {
      totalExams,
      totalQuestions,
      totalCorrect,
      totalIncorrect,
      overallAccuracy: parseFloat(overallAccuracy.toFixed(2)),
      averageTimePerQuestion: parseFloat(averageTimePerQuestion.toFixed(2)),
      totalTimeSpent,
      recentExams,
      masteryLevel,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * 获取科目统计
   */
  async getSubjectStatistics(
    userId: string,
    timeRange: TimeRange = TimeRange.MONTH,
  ): Promise<SubjectStatistics[]> {
    const cacheKey = this.generateCacheKey(userId, 'subjects', { timeRange });
    const cached = this.getCache<SubjectStatistics[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.performanceAggregator.getSubjectStatistics(
      userId,
      timeRange,
    );

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * 获取趋势数据
   */
  async getTrends(
    userId: string,
    timeRange: TimeRange = TimeRange.MONTH,
    intervalDays: number = 7,
    subjectId?: string,
  ): Promise<TrendsResponse> {
    const cacheKey = this.generateCacheKey(userId, 'trends', {
      timeRange,
      intervalDays,
      subjectId,
    });
    const cached = this.getCache<TrendsResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.performanceAggregator.getTrendData(
      userId,
      timeRange,
      intervalDays,
    );

    // 计算趋势摘要
    const startAccuracy = data.length > 0 ? data[0].accuracy : 0;
    const endAccuracy = data.length > 0 ? data[data.length - 1].accuracy : 0;
    const improvement = endAccuracy - startAccuracy;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (improvement > 5) {
      trend = 'improving';
    } else if (improvement < -5) {
      trend = 'declining';
    }

    const result: TrendsResponse = {
      timeRange,
      intervalDays,
      data,
      summary: {
        startAccuracy: parseFloat(startAccuracy.toFixed(2)),
        endAccuracy: parseFloat(endAccuracy.toFixed(2)),
        improvement: parseFloat(improvement.toFixed(2)),
        trend,
      },
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * 获取详细报告
   */
  async getDetailReport(
    userId: string,
    timeRange: TimeRange = TimeRange.MONTH,
    sortBy: SortBy = SortBy.DATE,
    sortOrder: SortOrder = SortOrder.DESC,
    page: number = 1,
    limit: number = 20,
  ): Promise<DetailReportResponse> {
    const cacheKey = this.generateCacheKey(userId, 'detail', {
      timeRange,
      sortBy,
      sortOrder,
      page,
      limit,
    });
    const cached = this.getCache<DetailReportResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const { items, total } = await this.performanceAggregator.getDetailReport(
      userId,
      timeRange,
      sortBy,
      sortOrder,
      page,
      limit,
    );

    // 计算摘要
    const avgAccuracy =
      items.length > 0
        ? items.reduce((sum, item) => sum + item.accuracy, 0) / items.length
        : 0;
    const avgTimeSpent =
      items.length > 0
        ? items.reduce((sum, item) => sum + item.timeSpent, 0) / items.length
        : 0;

    const sortedByAccuracy = [...items].sort((a, b) => b.accuracy - a.accuracy);
    const bestExam = sortedByAccuracy[0];
    const worstExam = sortedByAccuracy[sortedByAccuracy.length - 1];

    const result: DetailReportResponse = {
      items,
      total,
      page,
      limit,
      summary: {
        averageAccuracy: parseFloat(avgAccuracy.toFixed(2)),
        averageTimeSpent: parseFloat(avgTimeSpent.toFixed(2)),
        bestExam,
        worstExam,
      },
    };

    this.setCache(cacheKey, result, 60); // 详细报告缓存1分钟
    return result;
  }

  /**
   * 获取学习建议
   */
  async getStudyAdvice(
    userId: string,
    timeRange: TimeRange = TimeRange.MONTH,
  ): Promise<StudyAdviceResponse> {
    const cacheKey = this.generateCacheKey(userId, 'advice', { timeRange });
    const cached = this.getCache<StudyAdviceResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.performanceAggregator.generateStudyAdvice(
      userId,
      timeRange,
    );

    this.setCache(cacheKey, result, 600); // 建议缓存10分钟
    return result;
  }
}
