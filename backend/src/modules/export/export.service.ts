import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ExamRecord } from '../practice/entities/exam-record.entity';
import { Mistake } from '../mistake/entities/mistake.entity';
import { Review } from '../review/entities/review.entity';
import { ExportDto, ExportData, TimeRange } from './dto/export.dto';
import { PdfGeneratorService } from './pdf-generator.service';
import { ExcelGeneratorService } from './excel-generator.service';

/**
 * 导出服务
 * 负责收集数据并调用对应的生成器
 */
@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(ExamRecord)
    private examRecordRepository: Repository<ExamRecord>,
    @InjectRepository(Mistake)
    private mistakeRepository: Repository<Mistake>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    private pdfGenerator: PdfGeneratorService,
    private excelGenerator: ExcelGeneratorService,
  ) {}

  /**
   * 导出为 PDF
   */
  async exportToPdf(userId: string, options: ExportDto): Promise<Buffer> {
    const data = await this.collectExportData(userId, options);

    return this.pdfGenerator.generatePdf(data, {
      orientation: options.orientation,
    });
  }

  /**
   * 导出为 Excel
   */
  async exportToExcel(userId: string, options: ExportDto): Promise<Buffer> {
    const data = await this.collectExportData(userId, options);

    return this.excelGenerator.generateExcel(data, {
      includeCharts: options.includeCharts,
    });
  }

  /**
   * 收集导出数据
   */
  private async collectExportData(userId: string, options: ExportDto): Promise<ExportData> {
    const { timeRange = TimeRange.MONTH, includeSections = [] } = options;

    const dateRange = this.getDateRange(timeRange);

    const data: ExportData = {
      overview: {
        totalQuestions: 0,
        correctCount: 0,
        wrongCount: 0,
        accuracy: 0,
        totalTime: 0,
        studyDays: 0,
        avgDailyTime: 0,
        subjectStats: [],
      },
      trends: [],
      subjects: [],
      details: [],
      advice: [],
    };

    // 概览数据
    if (includeSections.includes('overview')) {
      data.overview = await this.getOverviewData(userId, dateRange);
    }

    // 趋势数据
    if (includeSections.includes('trends')) {
      data.trends = await this.getTrendsData(userId, dateRange);
    }

    // 科目数据
    if (includeSections.includes('subjects')) {
      data.subjects = await this.getSubjectsData(userId, dateRange);
    }

    // 详细记录
    if (includeSections.includes('details')) {
      data.details = await this.getDetailsData(userId, dateRange);
    }

    // 学习建议
    if (includeSections.includes('advice')) {
      data.advice = await this.getAdviceData(userId, dateRange);
    }

    return data;
  }

  /**
   * 获取概览数据
   */
  private async getOverviewData(userId: string, dateRange: { start: Date; end: Date }) {
    const records = await this.examRecordRepository
      .createQueryBuilder('record')
      .where('record.userId = :userId', { userId })
      .andWhere('record.startedAt BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      })
      .getMany();

    const totalQuestions = records.reduce((sum, r) => sum + (r.questionCount || 0), 0);
    const correctCount = records.reduce((sum, r) => sum + (r.correctCount || 0), 0);
    const wrongCount = totalQuestions - correctCount;
    const totalTime = records.reduce((sum, r) => sum + (r.timeSpent || 0), 0);

    // 统计学习天数
    const studyDays = new Set(
      records.map(r => new Date(r.startedAt).toDateString())
    ).size;

    return {
      totalQuestions,
      correctCount,
      wrongCount,
      accuracy: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
      totalTime,
      studyDays,
      avgDailyTime: studyDays > 0 ? Math.round(totalTime / studyDays) : 0,
      subjectStats: [],
    };
  }

  /**
   * 获取趋势数据
   */
  private async getTrendsData(userId: string, dateRange: { start: Date; end: Date }) {
    const records = await this.examRecordRepository
      .createQueryBuilder('record')
      .where('record.userId = :userId', { userId })
      .andWhere('record.startedAt BETWEEN :start AND :end', dateRange)
      .orderBy('record.startedAt', 'ASC')
      .getMany();

    // 按日期聚合
    const dailyStats = new Map<string, {
      studyTime: number;
      questionsCount: number;
      correctCount: number;
    }>();

    records.forEach(record => {
      const date = new Date(record.startedAt).toISOString().split('T')[0];
      const stats = dailyStats.get(date) || { studyTime: 0, questionsCount: 0, correctCount: 0 };
      stats.studyTime += record.timeSpent || 0;
      stats.questionsCount += record.questionCount || 0;
      stats.correctCount += record.correctCount || 0;
      dailyStats.set(date, stats);
    });

    return Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      studyTime: stats.studyTime,
      questionsCount: stats.questionsCount,
      accuracy: stats.questionsCount > 0
        ? Math.round((stats.correctCount / stats.questionsCount) * 100)
        : 0,
    }));
  }

  /**
   * 获取科目数据
   */
  private async getSubjectsData(userId: string, dateRange: { start: Date; end: Date }) {
    const mistakes = await this.mistakeRepository
      .createQueryBuilder('mistake')
      .leftJoinAndSelect('mistake.subject', 'subject')
      .where('mistake.userId = :userId', { userId })
      .andWhere('mistake.createdAt BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      })
      .getMany();

    // 按科目分组
    const subjectStats = new Map<string, {
      total: number;
      mastered: number;
      correctCount: number;
    }>();

    mistakes.forEach(mistake => {
      const subjectName = mistake.subject?.name || '未分类';
      const stats = subjectStats.get(subjectName) || {
        total: 0,
        mastered: 0,
        correctCount: 0,
      };
      stats.total++;
      if (mistake.masteryLevel === 'mastered') {
        stats.mastered++;
      }
      stats.correctCount += mistake.correctCount || 0;
      subjectStats.set(subjectName, stats);
    });

    return Array.from(subjectStats.entries()).map(([subject, stats]) => ({
      subject,
      total: stats.total,
      mastered: stats.mastered,
      accuracy: stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0,
      avgTime: 0, // Mistake doesn't have timeSpent property
    }));
  }

  /**
   * 获取详细记录
   */
  private async getDetailsData(userId: string, dateRange: { start: Date; end: Date }) {
    const records = await this.examRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.exam', 'exam')
      .where('record.userId = :userId', { userId })
      .andWhere('record.startedAt BETWEEN :start AND :end', dateRange)
      .orderBy('record.startedAt', 'DESC')
      .limit(1000)
      .getMany();

    return records.map(record => ({
      id: record.id,
      date: record.startedAt.toISOString(),
      subject: record.examName || '未分类',
      questionsCount: record.questionCount || 0,
      correctCount: record.correctCount || 0,
      wrongCount: (record.questionCount || 0) - (record.correctCount || 0),
      accuracy: record.questionCount > 0
        ? Math.round(((record.correctCount || 0) / record.questionCount) * 100)
        : 0,
      timeSpent: record.timeSpent || 0,
    }));
  }

  /**
   * 获取学习建议
   */
  private async getAdviceData(userId: string, dateRange: { start: Date; end: Date }) {
    const mistakes = await this.mistakeRepository.count({
      where: {
        userId,
        createdAt: Between(dateRange.start, dateRange.end),
      },
    });

    const reviews = await this.reviewRepository.count({
      where: {
        userId,
        createdAt: Between(dateRange.start, dateRange.end),
      },
    });

    const advice: Array<{ type: string; title: string; message: string }> = [];

    // 根据数据生成建议
    if (mistakes > 50) {
      advice.push({
        type: 'warning',
        title: '错题较多',
        message: `本周期新增 ${mistakes} 道错题，建议加强薄弱知识点的练习`,
      });
    }

    if (reviews < 10) {
      advice.push({
        type: 'info',
        title: '复习提醒',
        message: '复习次数较少，建议增加复习频率以提高记忆效果',
      });
    }

    if (advice.length === 0) {
      advice.push({
        type: 'success',
        title: '保持良好',
        message: '学习状态良好，继续保持！',
      });
    }

    return advice;
  }

  /**
   * 获取日期范围
   */
  private getDateRange(timeRange: TimeRange): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now.setHours(23, 59, 59, 999));
    let start = new Date();

    switch (timeRange) {
      case TimeRange.WEEK:
        start = new Date(now.setDate(now.getDate() - 7));
        break;
      case TimeRange.MONTH:
        start = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case TimeRange.QUARTER:
        start = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case TimeRange.YEAR:
        start = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case TimeRange.ALL:
      default:
        start = new Date(2020, 0, 1); // 很早的日期
        break;
    }

    start.setHours(0, 0, 0, 0);

    return { start, end };
  }
}
