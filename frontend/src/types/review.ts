/**
 * Leitner 箱子配置
 */
export interface LeitnerBox {
  box: number;
  intervalDays: number;
  label: string;
}

/**
 * 复习状态
 */
export type ReviewStatus = 'pending' | 'reviewed' | 'skipped';

/**
 * 复习结果
 */
export type ReviewResult = 'correct' | 'incorrect' | 'partially' | 'forgotten';

/**
 * 复习难度
 */
export type ReviewDifficulty = 'easy' | 'medium' | 'hard' | 'again';

/**
 * 复习统计
 */
export interface ReviewStatistics {
  totalReviews: number;
  pendingReviews: number;
  completedToday: number;
  correctRate: number;
  todayReviews: {
    total: number;
    correct: number;
    incorrect: number;
  };
  weekReviews: {
    total: number;
    correct: number;
    incorrect: number;
  };
  monthReviews: {
    total: number;
    correct: number;
    incorrect: number;
  };
  boxDistribution: Array<{
    box: number;
    label: string;
    count: number;
    dueToday: number;
    dueThisWeek: number;
  }>;
}

/**
 * 复习日程项
 */
export interface ReviewScheduleItem {
  date: Date;
  dueCount: number;
  boxDistribution: Array<{
    box: number;
    count: number;
  }>;
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
 * 待复习错题项
 */
export interface DueReviewItem {
  reviewId: string;
  mistakeId: string;
  question: string;
  subject: string;
  subjectId: string;
  currentBox: number;
  reviewCount: number;
  lastReviewedAt?: Date;
}

/**
 * 待复习错题响应
 */
export interface DueReviewsResponse {
  items: DueReviewItem[];
  total: number;
  hasMore: boolean;
}

/**
 * 复习会话题目项
 */
export interface ReviewSessionItem {
  reviewId: string;
  mistakeId: string;
  question: string;
  options?: string;
  subject: string;
  currentBox: number;
}

/**
 * 复习会话响应
 */
export interface ReviewSessionResponse {
  sessionId: string;
  items: ReviewSessionItem[];
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
  streakDays: number;
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
