import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Between } from 'typeorm';
import { Review } from './entities/review.entity';
import { Mistake } from '../mistake/entities/mistake.entity';
import { LeitnerScheduler } from './leitner-scheduler.service';
import {
  ReviewStatus,
  ReviewResult,
  ReviewDifficulty,
  AddToReviewDto,
  DueReviewsResponse,
  ReviewSessionResponse,
  ReviewResultResponse,
  ReviewScheduleResponse,
  ReviewStatistics,
  ReviewHistoryResponse,
  ReviewHistoryItem,
} from './dto/review.dto';

/**
 * 复习服务
 * 负责管理错题的复习流程
 */
@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Mistake)
    private mistakeRepository: Repository<Mistake>,
    private leitnerScheduler: LeitnerScheduler,
  ) {}

  /**
   * 添加错题到复习队列
   */
  async addToReview(
    userId: string,
    dto: AddToReviewDto,
  ): Promise<Review> {
    // 检查错题是否存在
    const mistake = await this.mistakeRepository.findOne({
      where: { id: dto.mistakeId },
    });

    if (!mistake) {
      throw new NotFoundException('错题不存在');
    }

    // 检查是否已经在复习队列中
    const existing = await this.reviewRepository.findOne({
      where: { userId, mistakeId: dto.mistakeId },
    });

    if (existing) {
      // 如果已存在，重置到第一个箱子
      existing.stage = 1;
      existing.status = ReviewStatus.PENDING;
      const initial = this.leitnerScheduler.calculateInitialReview(1);
      existing.nextReviewAt = initial.nextReviewAt;
      existing.intervalDays = initial.intervalDays;
      existing.easeFactor = 2.5;
      return this.reviewRepository.save(existing);
    }

    // 创建新的复习记录
    const initial = this.leitnerScheduler.calculateInitialReview(
      dto.initialStage,
    );

    const review = this.reviewRepository.create({
      userId,
      mistakeId: dto.mistakeId,
      stage: initial.box,
      nextReviewAt: initial.nextReviewAt,
      intervalDays: initial.intervalDays,
      easeFactor: 2.5,
      status: ReviewStatus.PENDING,
    });

    return this.reviewRepository.save(review);
  }

  /**
   * 批量添加到复习队列
   */
  async batchAddToReview(
    userId: string,
    mistakeIds: string[],
    initialStage: number = 1,
  ): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;

    for (const mistakeId of mistakeIds) {
      try {
        await this.addToReview(userId, { mistakeId, initialStage });
        added++;
      } catch (error) {
        skipped++;
      }
    }

    return { added, skipped };
  }

  /**
   * 获取待复习的错题
   */
  async getDueReviews(
    userId: string,
    options: {
      limit?: number;
      subjectId?: string;
      box?: number;
    } = {},
  ): Promise<DueReviewsResponse> {
    const { limit = 50, subjectId, box } = options;

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.mistake', 'mistake')
      .where('review.userId = :userId', { userId })
      .andWhere('review.status = :status', { status: ReviewStatus.PENDING })
      .andWhere('review.nextReviewAt <= :now', { now: new Date() });

    if (subjectId) {
      queryBuilder.andWhere('mistake.subjectId = :subjectId', { subjectId });
    }

    if (box) {
      queryBuilder.andWhere('review.stage = :box', { box });
    }

    // 按优先级排序
    const reviews = await queryBuilder
      .orderBy('review.nextReviewAt', 'ASC')
      .addOrderBy('review.stage', 'ASC')
      .take(limit)
      .getMany();

    const items = [];

    for (const review of reviews) {
      const mistake = await this.mistakeRepository.findOne({
        where: { id: review.mistakeId },
      });

      if (!mistake) continue;

      items.push({
        reviewId: review.id,
        mistakeId: mistake.id,
        question: mistake.question || mistake.content,
        subject: mistake.subjectId,
        subjectId: mistake.subjectId,
        currentBox: review.stage,
        reviewCount: await this.getReviewCount(review.mistakeId),
        lastReviewedAt: review.createdAt,
      });
    }

    // 获取总数
    const totalQuery = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.mistake', 'mistake')
      .where('review.userId = :userId', { userId })
      .andWhere('review.status = :status', { status: ReviewStatus.PENDING })
      .andWhere('review.nextReviewAt <= :now', { now: new Date() });

    if (subjectId) {
      totalQuery.andWhere('mistake.subjectId = :subjectId', { subjectId });
    }

    if (box) {
      totalQuery.andWhere('review.stage = :box', { box });
    }

    const total = await totalQuery.getCount();

    return {
      items,
      total,
      hasMore: total > limit,
    };
  }

  /**
   * 开始复习会话
   */
  async startSession(
    userId: string,
    options: {
      count?: number;
      subjectId?: string;
      includeNew?: boolean;
    } = {},
  ): Promise<ReviewSessionResponse> {
    const { count = 20, subjectId, includeNew = true } = options;

    // 获取待复习的错题
    const dueReviews = await this.getDueReviews(userId, {
      limit: count,
      subjectId,
    });

    let items = dueReviews.items;

    // 如果数量不足且允许包含新题，添加即将到期的错题
    if (includeNew && items.length < count) {
      const additionalNeeded = count - items.length;
      const upcomingReviews = await this.reviewRepository
        .createQueryBuilder('review')
        .leftJoinAndSelect('review.mistake', 'mistake')
        .where('review.userId = :userId', { userId })
        .andWhere('review.status = :status', { status: ReviewStatus.PENDING })
        .andWhere('review.nextReviewAt > :now', { now: new Date() })
        .andWhere(subjectId ? 'mistake.subjectId = :subjectId' : '1=1', {
          subjectId,
        })
        .orderBy('review.nextReviewAt', 'ASC')
        .take(additionalNeeded)
        .getMany();

      for (const review of upcomingReviews) {
        const mistake = await this.mistakeRepository.findOne({
          where: { id: review.mistakeId },
        });

        if (!mistake) continue;

        // 检查是否已存在
        if (!items.find((i) => i.mistakeId === mistake.id)) {
          items.push({
            reviewId: review.id,
            mistakeId: mistake.id,
            question: mistake.question || mistake.content,
            options: mistake.options || undefined,
            subject: mistake.subjectId,
            currentBox: review.stage,
          } as any);
        }
      }
    }

    return {
      sessionId: this.generateSessionId(),
      items,
      totalCount: items.length,
      currentIndex: 0,
    };
  }

  /**
   * 提交复习结果
   */
  async submitReview(
    userId: string,
    reviewId: string,
    result: ReviewResult,
    difficulty?: ReviewDifficulty,
    timeSpent?: number,
    note?: string,
  ): Promise<ReviewResultResponse> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId, userId },
    });

    if (!review) {
      throw new NotFoundException('复习记录不存在');
    }

    if (review.status !== ReviewStatus.PENDING) {
      throw new BadRequestException('该复习已完成');
    }

    const previousBox = review.stage;

    // 计算新的复习状态
    const nextReview = this.leitnerScheduler.calculateNextReview(
      review.stage,
      result,
      difficulty,
      review.easeFactor,
    );

    // 更新复习记录
    review.stage = nextReview.newBox;
    review.nextReviewAt = nextReview.nextReviewAt;
    review.intervalDays = nextReview.intervalDays;
    review.easeFactor = nextReview.easeFactor;
    review.isCorrect = result === ReviewResult.CORRECT;
    review.status = ReviewStatus.REVIEWED;

    await this.reviewRepository.save(review);

    // 创建下一次的复习记录
    const newReview = this.reviewRepository.create({
      userId,
      mistakeId: review.mistakeId,
      stage: nextReview.newBox,
      nextReviewAt: nextReview.nextReviewAt,
      intervalDays: nextReview.intervalDays,
      easeFactor: nextReview.easeFactor,
      status: ReviewStatus.PENDING,
    });

    await this.reviewRepository.save(newReview);

    // 获取连续正确天数
    const streakDays = await this.getStreakDays(userId, review.mistakeId);

    return {
      reviewId: newReview.id,
      previousBox,
      newBox: nextReview.newBox,
      nextReviewAt: nextReview.nextReviewAt,
      intervalDays: nextReview.intervalDays,
      easeFactor: nextReview.easeFactor,
      streakDays,
    };
  }

  /**
   * 获取复习统计
   */
  async getStatistics(userId: string): Promise<ReviewStatistics> {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now.setDate(now.getDate() - 7));
    const monthStart = new Date(now.setDate(now.getDate() - 30));

    // 总体统计
    const totalReviews = await this.reviewRepository.count({
      where: { userId },
    });

    const pendingReviews = await this.reviewRepository.count({
      where: { userId, status: ReviewStatus.PENDING },
    });

    // 今日复习
    const todayReviews = await this.reviewRepository.find({
      where: {
        userId,
        status: ReviewStatus.REVIEWED,
        createdAt: Between(todayStart, new Date()),
      },
    });

    const todayCorrect = todayReviews.filter((r) => r.isCorrect).length;

    // 本周复习
    const weekReviews = await this.reviewRepository.find({
      where: {
        userId,
        status: ReviewStatus.REVIEWED,
        createdAt: Between(weekStart, new Date()),
      },
    });

    const weekCorrect = weekReviews.filter((r) => r.isCorrect).length;

    // 本月复习
    const monthReviews = await this.reviewRepository.find({
      where: {
        userId,
        status: ReviewStatus.REVIEWED,
        createdAt: Between(monthStart, new Date()),
      },
    });

    const monthCorrect = monthReviews.filter((r) => r.isCorrect).length;

    // 正确率
    const allReviewed = await this.reviewRepository.find({
      where: { userId, status: ReviewStatus.REVIEWED },
    });
    const correctRate =
      allReviewed.length > 0
        ? (allReviewed.filter((r) => r.isCorrect).length / allReviewed.length) *
          100
        : 0;

    // Leitner 箱子分布
    const boxDistribution = [];
    for (const boxConfig of this.leitnerScheduler.getAllBoxes()) {
      const boxReviews = await this.reviewRepository.find({
        where: { userId, stage: boxConfig.box, status: ReviewStatus.PENDING },
      });

      const todayDue = boxReviews.filter((r) =>
        this.leitnerScheduler.isDue(r.nextReviewAt),
      ).length;

      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekDue = boxReviews.filter(
        (r) => r.nextReviewAt <= weekEnd,
      ).length;

      boxDistribution.push({
        box: boxConfig.box,
        label: boxConfig.label,
        count: boxReviews.length,
        dueToday: todayDue,
        dueThisWeek: weekDue,
      });
    }

    return {
      totalReviews,
      pendingReviews,
      completedToday: todayReviews.length,
      correctRate: parseFloat(correctRate.toFixed(2)),
      todayReviews: {
        total: todayReviews.length,
        correct: todayCorrect,
        incorrect: todayReviews.length - todayCorrect,
      },
      weekReviews: {
        total: weekReviews.length,
        correct: weekCorrect,
        incorrect: weekReviews.length - weekCorrect,
      },
      monthReviews: {
        total: monthReviews.length,
        correct: monthCorrect,
        incorrect: monthReviews.length - monthCorrect,
      },
      boxDistribution,
    };
  }

  /**
   * 获取复习计划
   */
  async getSchedule(
    userId: string,
    days: number = 7,
    subjectId?: string,
  ): Promise<ReviewScheduleResponse> {
    const reviews = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.mistake', 'mistake')
      .where('review.userId = :userId', { userId })
      .andWhere('review.status = :status', { status: ReviewStatus.PENDING })
      .andWhere(subjectId ? 'mistake.subjectId = :subjectId' : '1=1', {
        subjectId,
      })
      .getMany();

    const schedule: ReviewScheduleResponse['schedule'] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + i);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // 统计该日期到期的复习
      const dueReviews = reviews.filter((r) => {
        return r.nextReviewAt >= targetDate && r.nextReviewAt < nextDay;
      });

      // 按箱子分组
      const boxMap = new Map<number, number>();
      for (const review of dueReviews) {
        boxMap.set(review.stage, (boxMap.get(review.stage) || 0) + 1);
      }

      const boxDistribution = Array.from(boxMap.entries()).map(
        ([box, count]) => ({ box, count }),
      );

      schedule.push({
        date: targetDate,
        dueCount: dueReviews.length,
        boxDistribution,
      });
    }

    // 计算摘要
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const monthEnd = new Date(today);
    monthEnd.setDate(monthEnd.getDate() + 30);

    const dueToday = reviews.filter(
      (r) => r.nextReviewAt >= today && r.nextReviewAt < tomorrow,
    ).length;

    const dueThisWeek = reviews.filter(
      (r) => r.nextReviewAt >= today && r.nextReviewAt < weekEnd,
    ).length;

    const dueThisMonth = reviews.filter(
      (r) => r.nextReviewAt >= today && r.nextReviewAt < monthEnd,
    ).length;

    return {
      schedule,
      summary: {
        totalDue: reviews.length,
        dueToday,
        dueThisWeek,
        dueThisMonth,
      },
    };
  }

  /**
   * 获取复习历史
   */
  async getHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<ReviewHistoryResponse> {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { userId, status: ReviewStatus.REVIEWED },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items: ReviewHistoryItem[] = [];

    for (const review of reviews) {
      const mistake = await this.mistakeRepository.findOne({
        where: { id: review.mistakeId },
      });

      if (!mistake) continue;

      items.push({
        id: review.id,
        mistakeId: mistake.id,
        question: mistake.question || mistake.content,
        result: review.isCorrect ? ReviewResult.CORRECT : ReviewResult.INCORRECT,
        difficulty: ReviewDifficulty.MEDIUM, // TODO: 从历史记录获取
        previousBox: review.stage,
        newBox: review.stage,
        reviewedAt: review.createdAt,
        timeSpent: 0, // TODO: 从历史记录获取
        note: '', // TODO: 从历史记录获取
      });
    }

    // 计算摘要统计
    const allReviewed = await this.reviewRepository.find({
      where: { userId, status: ReviewStatus.REVIEWED },
    });

    const correctRate =
      allReviewed.length > 0
        ? (allReviewed.filter((r) => r.isCorrect).length / allReviewed.length) *
          100
        : 0;

    return {
      items,
      total,
      summary: {
        totalReviews: allReviewed.length,
        correctRate: parseFloat(correctRate.toFixed(2)),
        averageTimeSpent: 0, // TODO: 计算
        mostDifficultSubject: '', // TODO: 计算
      },
    };
  }

  /**
   * 跳过复习
   */
  async skipReview(userId: string, reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId, userId },
    });

    if (!review) {
      throw new NotFoundException('复习记录不存在');
    }

    review.status = ReviewStatus.SKIPPED;
    await this.reviewRepository.save(review);
  }

  /**
   * 删除复习记录
   */
  async removeReview(userId: string, reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId, userId },
    });

    if (!review) {
      throw new NotFoundException('复习记录不存在');
    }

    await this.reviewRepository.remove(review);
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取复习次数
   */
  private async getReviewCount(mistakeId: string): Promise<number> {
    return this.reviewRepository.count({
      where: { mistakeId, status: ReviewStatus.REVIEWED },
    });
  }

  /**
   * 获取连续正确天数
   */
  private async getStreakDays(userId: string, mistakeId: string): Promise<number> {
    const reviews = await this.reviewRepository.find({
      where: { userId, mistakeId, status: ReviewStatus.REVIEWED },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    let streak = 0;
    for (const review of reviews) {
      if (review.isCorrect) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}
