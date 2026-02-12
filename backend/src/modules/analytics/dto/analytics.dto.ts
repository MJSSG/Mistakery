import { IsEnum, IsOptional, IsNumber, IsString, Min } from 'class-validator';

/**
 * 时间范围类型
 */
export enum TimeRange {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  ALL = 'all',
}

/**
 * 排序类型
 */
export enum SortBy {
  DATE = 'date',
  ACCURACY = 'accuracy',
  TIME_SPENT = 'timeSpent',
  QUESTION_COUNT = 'questionCount',
}

/**
 * 排序顺序
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * 查询统计数据 DTO
 */
export class GetStatisticsDto {
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange = TimeRange.ALL;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  questionType?: string;

  @IsOptional()
  @IsString()
  difficultyLevel?: string;
}

/**
 * 查询趋势数据 DTO
 */
export class GetTrendsDto {
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange = TimeRange.MONTH;

  @IsOptional()
  @IsNumber()
  @Min(1)
  intervalDays?: number = 7; // 数据间隔天数

  @IsOptional()
  @IsString()
  subjectId?: string;
}

/**
 * 查询科目统计 DTO
 */
export class GetSubjectStatsDto {
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange = TimeRange.MONTH;
}

/**
 * 查询详细报告 DTO
 */
export class GetDetailReportDto {
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange = TimeRange.MONTH;

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.DATE;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

/**
 * 统计概览响应
 */
export interface StatisticsOverview {
  // 基础统计
  totalExams: number;
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  overallAccuracy: number;
  averageTimePerQuestion: number;
  totalTimeSpent: number;

  // 最近表现
  recentExams: {
    id: string;
    name: string;
    accuracy: number;
    timeSpent: number;
    completedAt: Date;
  }[];

  // 掌握情况
  masteryLevel: {
    mastered: number;    // 已掌握
    proficient: number;  // 熟练
    learning: number;    // 学习中
    struggling: number;  // 困难
  };
}

/**
 * 科目统计响应
 */
export interface SubjectStatistics {
  subjectId: string;
  subjectName: string;
  totalExams: number;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  averageTimePerQuestion: number;
  masteryLevel: 'mastered' | 'proficient' | 'learning' | 'struggling';
  trend: 'improving' | 'stable' | 'declining';
}

/**
 * 趋势数据点
 */
export interface TrendDataPoint {
  date: Date;
  examCount: number;
  totalQuestions: number;
  accuracy: number;
  averageTimePerQuestion: number;
}

/**
 * 趋势响应
 */
export interface TrendsResponse {
  timeRange: TimeRange;
  intervalDays: number;
  data: TrendDataPoint[];
  summary: {
    startAccuracy: number;
    endAccuracy: number;
    improvement: number;
    trend: 'improving' | 'stable' | 'declining';
  };
}

/**
 * 详细报告项
 */
export interface DetailReportItem {
  examRecordId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  questionCount: number;
  correctCount: number;
  accuracy: number;
  timeSpent: number;
  completedAt: Date;
}

/**
 * 详细报告响应
 */
export interface DetailReportResponse {
  items: DetailReportItem[];
  total: number;
  page: number;
  limit: number;
  summary: {
    averageAccuracy: number;
    averageTimeSpent: number;
    bestExam: DetailReportItem;
    worstExam: DetailReportItem;
  };
}

/**
 * 学习建议响应
 */
export interface StudyAdviceResponse {
  overallAdvice: string[];
  subjectAdvice: {
    subjectId: string;
    subjectName: string;
    advice: string[];
  }[];
  typeAdvice: {
    type: string;
    typeName: string;
    advice: string[];
  }[];
  priorityTopics: {
    subjectId: string;
    subjectName: string;
    topicName: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}
