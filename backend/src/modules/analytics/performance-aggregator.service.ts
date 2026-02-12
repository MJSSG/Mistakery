import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { ExamRecord } from '../practice/entities/exam-record.entity';
import { ExamAnswer } from '../practice/entities/exam-answer.entity';
import { Mistake } from '../mistake/entities/mistake.entity';
import {
  TimeRange,
  SubjectStatistics,
  TrendDataPoint,
  DetailReportItem,
  StudyAdviceResponse,
} from './dto/analytics.dto';

/**
 * 性能聚合服务
 * 负责聚合和分析用户的练习表现数据
 */
@Injectable()
export class PerformanceAggregator {
  constructor(
    @InjectRepository(ExamRecord)
    private examRecordRepository: Repository<ExamRecord>,
    @InjectRepository(ExamAnswer)
    private examAnswerRepository: Repository<ExamAnswer>,
    @InjectRepository(Mistake)
    private mistakeRepository: Repository<Mistake>,
  ) {}

  /**
   * 获取时间范围的日期范围
   */
  private getDateRange(timeRange: TimeRange): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now.setHours(23, 59, 59, 999));
    let start = new Date();

    switch (timeRange) {
      case TimeRange.TODAY:
        start = new Date(now.setHours(0, 0, 0, 0));
        break;
      case TimeRange.WEEK:
        start = new Date(now.setDate(now.getDate() - 7));
        break;
      case TimeRange.MONTH:
        start = new Date(now.setDate(now.getDate() - 30));
        break;
      case TimeRange.QUARTER:
        start = new Date(now.setDate(now.getDate() - 90));
        break;
      case TimeRange.YEAR:
        start = new Date(now.setDate(now.getDate() - 365));
        break;
      case TimeRange.ALL:
        start = new Date(0);
        break;
    }

    return { start, end };
  }

  /**
   * 获取用户的已完成练习记录
   */
  async getUserExamRecords(
    userId: string,
    timeRange?: TimeRange,
    subjectId?: string,
  ): Promise<ExamRecord[]> {
    const queryBuilder = this.examRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.exam', 'exam')
      .where('record.userId = :userId', { userId })
      .andWhere('record.status = :status', { status: 'completed' });

    if (timeRange) {
      const { start, end } = this.getDateRange(timeRange);
      queryBuilder.andWhere('record.completedAt BETWEEN :start AND :end', {
        start,
        end,
      });
    }

    if (subjectId) {
      queryBuilder.andWhere('exam.filterConfig LIKE :subjectId', {
        subjectId: `%${subjectId}%`,
      });
    }

    return queryBuilder.orderBy('record.completedAt', 'DESC').getMany();
  }

  /**
   * 获取科目统计数据
   */
  async getSubjectStatistics(
    userId: string,
    timeRange: TimeRange = TimeRange.MONTH,
  ): Promise<SubjectStatistics[]> {
    const examRecords = await this.getUserExamRecords(userId, timeRange);

    if (examRecords.length === 0) {
      return [];
    }

    // 获取所有答案记录
    const examRecordIds = examRecords.map((r) => r.id);
    const answers = examRecordIds.length > 0
      ? await this.examAnswerRepository
          .createQueryBuilder('answer')
          .leftJoinAndSelect('answer.question', 'question')
          .where('answer.examRecordId IN (:...examRecordIds)', { examRecordIds })
          .getMany()
      : [];

    // 按科目分组统计
    const subjectMap = new Map<
      string,
      {
        totalQuestions: number;
        correctCount: number;
        totalTimeSpent: number;
        examCount: number;
      }
    >();

    for (const answer of answers) {
      const question = answer.question;
      if (!question) continue;

      const subjectId = question.subjectId;

      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          totalQuestions: 0,
          correctCount: 0,
          totalTimeSpent: 0,
          examCount: 0,
        });
      }

      const stats = subjectMap.get(subjectId)!;
      stats.totalQuestions++;
      if (answer.isCorrect === true) {
        stats.correctCount++;
      }
      stats.totalTimeSpent += answer.timeSpent || 0;
    }

    // 计算每个科目的练习次数
    for (const record of examRecords) {
      const exam = record.exam;
      if (exam?.filterConfig) {
        // filterConfig 已经是解析后的对象，不需要 JSON.parse
        if (exam.filterConfig.knowledgePoints) {
          for (const knowledgePoint of exam.filterConfig.knowledgePoints) {
            // 尝试从 knowledgePoint 提取 subjectId
            // 这里简化处理，假设 knowledgePoint 格式为 "subjectId:topicName"
            const subjectId = knowledgePoint.split(':')[0];
            const stats = subjectMap.get(subjectId);
            if (stats) {
              stats.examCount++;
            }
          }
        }
      }
    }

    // 生成结果
    const results: SubjectStatistics[] = [];

    for (const [subjectId, stats] of subjectMap.entries()) {
      const accuracy =
        stats.totalQuestions > 0
          ? (stats.correctCount / stats.totalQuestions) * 100
          : 0;
      const avgTime =
        stats.totalQuestions > 0
          ? stats.totalTimeSpent / stats.totalQuestions
          : 0;

      results.push({
        subjectId,
        subjectName: await this.getSubjectName(subjectId),
        totalExams: stats.examCount,
        totalQuestions: stats.totalQuestions,
        correctCount: stats.correctCount,
        accuracy: parseFloat(accuracy.toFixed(2)),
        averageTimePerQuestion: parseFloat(avgTime.toFixed(2)),
        masteryLevel: this.getMasteryLevel(accuracy),
        trend: 'stable', // TODO: 计算趋势
      });
    }

    // 按准确率排序
    return results.sort((a, b) => b.accuracy - a.accuracy);
  }

  /**
   * 获取趋势数据
   */
  async getTrendData(
    userId: string,
    timeRange: TimeRange = TimeRange.MONTH,
    intervalDays: number = 7,
  ): Promise<TrendDataPoint[]> {
    const { start, end } = this.getDateRange(timeRange);

    // 计算时间间隔
    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
    const intervals: { start: Date; end: Date }[] = [];

    let currentStart = new Date(start);
    while (currentStart < end) {
      const currentEnd = new Date(
        Math.min(currentStart.getTime() + intervalMs, end.getTime()),
      );
      intervals.push({ start: new Date(currentStart), end: new Date(currentEnd) });
      currentStart = new Date(currentEnd);
    }

    // 为每个间隔获取数据
    const trendData: TrendDataPoint[] = [];

    for (const interval of intervals) {
      const records = await this.examRecordRepository
        .createQueryBuilder('record')
        .where('record.userId = :userId', { userId })
        .andWhere('record.status = :status', { status: 'completed' })
        .andWhere('record.completedAt BETWEEN :start AND :end', {
          start: interval.start,
          end: interval.end,
        })
        .getMany();

      if (records.length === 0) {
        continue;
      }

      const totalQuestions = records.reduce(
        (sum, r) => sum + r.questionCount,
        0,
      );
      const totalCorrect = records.reduce(
        (sum, r) => sum + r.correctCount,
        0,
      );
      const totalTimeSpent = records.reduce(
        (sum, r) => sum + r.timeSpent,
        0,
      );
      const accuracy =
        totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
      const avgTime =
        totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0;

      trendData.push({
        date: interval.start,
        examCount: records.length,
        totalQuestions,
        accuracy: parseFloat(accuracy.toFixed(2)),
        averageTimePerQuestion: parseFloat(avgTime.toFixed(2)),
      });
    }

    return trendData;
  }

  /**
   * 获取详细报告
   */
  async getDetailReport(
    userId: string,
    timeRange: TimeRange = TimeRange.MONTH,
    sortBy: string = 'date',
    sortOrder: 'asc' | 'desc' = 'desc',
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: DetailReportItem[]; total: number }> {
    const records = await this.getUserExamRecords(userId, timeRange);

    // 排序
    const sortedRecords = [...records].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'accuracy':
          comparison = a.accuracy - b.accuracy;
          break;
        case 'timeSpent':
          comparison = a.timeSpent - b.timeSpent;
          break;
        case 'questionCount':
          comparison = a.questionCount - b.questionCount;
          break;
        case 'date':
        default:
          comparison =
            a.completedAt!.getTime() - b.completedAt!.getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // 分页
    const total = sortedRecords.length;
    const startIndex = (page - 1) * limit;
    const paginatedRecords = sortedRecords.slice(
      startIndex,
      startIndex + limit,
    );

    // 获取科目名称
    const items: DetailReportItem[] = [];

    for (const record of paginatedRecords) {
      const subjectId = await this.getExamSubjectId(record.examId);
      items.push({
        examRecordId: record.id,
        examName: record.examName,
        subjectId,
        subjectName: await this.getSubjectName(subjectId),
        questionCount: record.questionCount,
        correctCount: record.correctCount,
        accuracy: parseFloat(record.accuracy.toFixed(2)),
        timeSpent: record.timeSpent,
        completedAt: record.completedAt!,
      });
    }

    return { items, total };
  }

  /**
   * 生成学习建议
   */
  async generateStudyAdvice(
    userId: string,
    timeRange: TimeRange = TimeRange.MONTH,
  ): Promise<StudyAdviceResponse> {
    const examRecords = await this.getUserExamRecords(userId, timeRange);

    if (examRecords.length === 0) {
      return {
        overallAdvice: ['还没有练习记录，开始第一次练习吧！'],
        subjectAdvice: [],
        typeAdvice: [],
        priorityTopics: [],
      };
    }

    const overallAdvice: string[] = [];
    const subjectAdvice: StudyAdviceResponse['subjectAdvice'] = [];
    const typeAdvice: StudyAdviceResponse['typeAdvice'] = [];

    // 计算整体表现
    const avgAccuracy =
      examRecords.reduce((sum, r) => sum + r.accuracy, 0) /
      examRecords.length;
    const avgTimeSpent =
      examRecords.reduce((sum, r) => sum + r.timeSpent, 0) /
      examRecords.length;

    // 整体建议
    if (avgAccuracy >= 90) {
      overallAdvice.push('你的整体表现非常优秀，继续保持！');
    } else if (avgAccuracy >= 70) {
      overallAdvice.push('你的表现不错，但还有提升空间。');
    } else if (avgAccuracy >= 50) {
      overallAdvice.push('建议复习错题，巩固基础知识。');
    } else {
      overallAdvice.push('建议从基础题目开始，逐步提高。');
    }

    // 科目建议
    const subjectStats = await this.getSubjectStatistics(userId, timeRange);
    const weakSubjects = subjectStats.filter((s) => s.accuracy < 60);
    const strongSubjects = subjectStats.filter((s) => s.accuracy >= 80);

    for (const subject of weakSubjects) {
      subjectAdvice.push({
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        advice: [
          `${subject.subjectName}准确率较低(${subject.accuracy.toFixed(1)}%)，建议加强练习`,
          '重点关注错题，理解解题思路',
        ],
      });
    }

    for (const subject of strongSubjects) {
      subjectAdvice.push({
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        advice: [
          `${subject.subjectName}表现优秀，可以尝试更有挑战性的题目`,
          '帮助同学解决这个科目的问题，加深理解',
        ],
      });
    }

    // 题型建议
    const examRecordIds = examRecords.map((r) => r.id);
    const answers = examRecordIds.length > 0
      ? await this.examAnswerRepository
          .createQueryBuilder('answer')
          .leftJoinAndSelect('answer.question', 'question')
          .where('answer.examRecordId IN (:...examRecordIds)', { examRecordIds })
          .getMany()
      : [];

    const typeStats = new Map<string, { correct: number; total: number }>();

    for (const answer of answers) {
      const question = answer.question;
      if (!question) continue;

      const type = question.type;
      if (!typeStats.has(type)) {
        typeStats.set(type, { correct: 0, total: 0 });
      }

      const stats = typeStats.get(type)!;
      stats.total++;
      if (answer.isCorrect === true) {
        stats.correct++;
      }
    }

    const typeNames: Record<string, string> = {
      choice: '单选题',
      'choice-multi': '多选题',
      fill: '填空题',
      judge: '判断题',
      essay: '解答题',
    };

    for (const [type, stats] of typeStats.entries()) {
      const accuracy = (stats.correct / stats.total) * 100;

      if (accuracy < 60) {
        typeAdvice.push({
          type,
          typeName: typeNames[type] || type,
          advice: [
            `${typeNames[type] || type}准确率较低，需要重点练习`,
            '学习这类题型的解题技巧和方法',
          ],
        });
      }
    }

    // 优先级主题（基于错误率）
    const priorityTopics: StudyAdviceResponse['priorityTopics'] = [];

    const subjectErrors = new Map<
      string,
      { subjectId: string; subjectName: string; errorCount: number }
    >();

    for (const answer of answers) {
      if (answer.isCorrect === false) {
        const question = answer.question;
        if (!question) continue;

        const subjectId = question.subjectId;
        if (!subjectErrors.has(subjectId)) {
          subjectErrors.set(subjectId, {
            subjectId,
            subjectName: '',
            errorCount: 0,
          });
        }

        subjectErrors.get(subjectId)!.errorCount++;
      }
    }

    for (const [subjectId, data] of subjectErrors.entries()) {
      data.subjectName = await this.getSubjectName(subjectId);

      if (data.errorCount > 5) {
        priorityTopics.push({
          subjectId,
          subjectName: data.subjectName,
          topicName: '综合练习',
          priority: data.errorCount > 10 ? 'high' : 'medium',
        });
      }
    }

    return {
      overallAdvice,
      subjectAdvice,
      typeAdvice,
      priorityTopics: priorityTopics.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
    };
  }

  /**
   * 获取掌握等级
   */
  private getMasteryLevel(accuracy: number): 'mastered' | 'proficient' | 'learning' | 'struggling' {
    if (accuracy >= 90) return 'mastered';
    if (accuracy >= 75) return 'proficient';
    if (accuracy >= 60) return 'learning';
    return 'struggling';
  }

  /**
   * 获取科目名称
   */
  private async getSubjectName(subjectId: string): Promise<string> {
    // 这里应该从 subject 表查询，暂时返回 ID
    const subjectNames: Record<string, string> = {
      math: '数学',
      english: '英语',
      chinese: '语文',
      physics: '物理',
      chemistry: '化学',
      biology: '生物',
      history: '历史',
      geography: '地理',
    };

    return subjectNames[subjectId] || subjectId;
  }

  /**
   * 获取试卷的主要科目ID
   */
  private async getExamSubjectId(examId: string): Promise<string> {
    const exam = await this.examRecordRepository
      .createQueryBuilder('record')
      .leftJoin('record.exam', 'exam')
      .where('record.examId = :examId', { examId })
      .getOne();

    if (exam?.exam?.filterConfig) {
      // filterConfig 已经是解析后的对象
      const config = exam.exam.filterConfig;
      if (config.knowledgePoints && config.knowledgePoints.length > 0) {
        // 尝试从 knowledgePoint 提取 subjectId
        const subjectId = config.knowledgePoints[0]?.split(':')[0];
        if (subjectId) {
          return subjectId;
        }
      }
    }

    return 'general';
  }
}
