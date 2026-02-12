import { IsEnum, IsOptional, IsNumber, IsString, IsBoolean, Min } from 'class-validator';

/**
 * Leitner 箱子配置
 * 默认使用 5 个箱子，复习间隔分别为 1, 3, 7, 14, 30 天
 */
export const LEITNER_BOXES = [
  { box: 1, intervalDays: 1, label: '紧急复习' },
  { box: 2, intervalDays: 3, label: '今日复习' },
  { box: 3, intervalDays: 7, label: '本周复习' },
  { box: 4, intervalDays: 14, label: '两周复习' },
  { box: 5, intervalDays: 30, label: '月度复习' },
];

/**
 * 复习状态
 */
export enum ReviewStatus {
  PENDING = 'pending',     // 待复习
  REVIEWED = 'reviewed',   // 已复习
  SKIPPED = 'skipped',     // 已跳过
}

/**
 * 复习结果
 */
export enum ReviewResult {
  CORRECT = 'correct',         // 正确
  INCORRECT = 'incorrect',     // 错误
  PARTIALLY = 'partially',     // 部分正确
  FORGOTTEN = 'forgotten',     // 完全忘记
}

/**
 * 复习难度
 */
export enum ReviewDifficulty {
  EASY = 'easy',           // 简单
  MEDIUM = 'medium',       // 中等
  HARD = 'hard',           // 困难
  AGAIN = 'again',         // 需要重新学习
}

/**
 * 添加到复习队列 DTO
 */
export class AddToReviewDto {
  @IsString()
  mistakeId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  initialStage?: number = 1;
}

/**
 * 批量添加到复习队列 DTO
 */
export class BatchAddToReviewDto {
  @IsString()
  mistakeIds: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  initialStage?: number = 1;
}

/**
 * 开始复习 DTO
 */
export class StartReviewDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  count?: number = 20; // 每次复习的题目数量

  @IsOptional()
  @IsString()
  subjectId?: string; // 筛选科目

  @IsOptional()
  @IsBoolean()
  includeNew?: boolean = true; // 是否包含新加入的错题
}

/**
 * 提交复习结果 DTO
 */
export class SubmitReviewDto {
  @IsEnum(ReviewResult)
  result: ReviewResult;

  @IsOptional()
  @IsEnum(ReviewDifficulty)
  difficulty?: ReviewDifficulty;

  @IsOptional()
  @IsNumber()
  timeSpent?: number; // 本次复习用时（秒）

  @IsOptional()
  @IsString()
  note?: string; // 复习笔记
}

/**
 * 查询复习计划 DTO
 */
export class GetReviewScheduleDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  days?: number = 7; // 查询未来几天的计划

  @IsOptional()
  @IsString()
  subjectId?: string;
}

/**
 * 查询待复习错题 DTO
 */
export class GetDueReviewsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  box?: number; // 筛选特定箱子
}

/**
 * 复习统计响应
 */
export interface ReviewStatistics {
  // 总体统计
  totalReviews: number;
  pendingReviews: number;
  completedToday: number;
  correctRate: number;

  // 今日复习
  todayReviews: {
    total: number;
    correct: number;
    incorrect: number;
  };

  // 本周复习
  weekReviews: {
    total: number;
    correct: number;
    incorrect: number;
  };

  // 本月复习
  monthReviews: {
    total: number;
    correct: number;
    incorrect: number;
  };

  // Leitner 箱子分布
  boxDistribution: {
    box: number;
    label: string;
    count: number;
    dueToday: number;
    dueThisWeek: number;
  }[];
}

/**
 * 复习日程项
 */
export interface ReviewScheduleItem {
  date: Date;
  dueCount: number;
  boxDistribution: {
    box: number;
    count: number;
  }[];
}

/**
 * 复习计划响应
 */
export interface ReviewScheduleResponse {
  schedule: ReviewScheduleItem[];
  summary: {
    totalDue: number;
    dueToday: number;
    dueThisWeek: number;
    dueThisMonth: number;
  };
}

/**
 * 待复习错题响应
 */
export interface DueReviewsResponse {
  items: {
    reviewId: string;
    mistakeId: string;
    question: string;
    subject: string;
    subjectId: string;
    currentBox: number;
    reviewCount: number;
    lastReviewedAt?: Date;
  }[];
  total: number;
  hasMore: boolean;
}

/**
 * 复习会话响应
 */
export interface ReviewSessionResponse {
  sessionId: string;
  items: {
    reviewId: string;
    mistakeId: string;
    question: string;
    options?: string;
    subject: string;
    currentBox: number;
  }[];
  totalCount: number;
  currentIndex: number;
}

/**
 * 复习结果响应
 */
export interface ReviewResultResponse {
  reviewId: string;
  previousBox: number;
  newBox: number;
  nextReviewAt: Date;
  intervalDays: number;
  easeFactor: number;
  streakDays: number; // 连续正确天数
}

/**
 * 复习历史项
 */
export interface ReviewHistoryItem {
  id: string;
  mistakeId: string;
  question: string;
  result: ReviewResult;
  difficulty: ReviewDifficulty;
  previousBox: number;
  newBox: number;
  reviewedAt: Date;
  timeSpent: number;
  note?: string;
}

/**
 * 复习历史响应
 */
export interface ReviewHistoryResponse {
  items: ReviewHistoryItem[];
  total: number;
  summary: {
    totalReviews: number;
    correctRate: number;
    averageTimeSpent: number;
    mostDifficultSubject: string;
  };
}
