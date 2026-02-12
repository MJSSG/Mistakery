import { get, post, put, del } from './request';

// 题目类型
export type QuestionType = 'choice' | 'choice-multi' | 'fill' | 'judge' | 'essay' | 'other';

// 难度等级
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// 掌握程度
export type MasteryLevel = 'unknown' | 'familiar' | 'mastered';

// 答题状态
export type AnswerStatus = 'pending' | 'correct' | 'incorrect' | 'partial';

// 练习状态
export type ExamStatus = 'draft' | 'in-progress' | 'completed' | 'abandoned';

// 筛选配置
export interface FilterConfig {
  knowledgePoints?: string[];
  type?: QuestionType;
  difficulty?: DifficultyLevel;
  masteryLevel?: MasteryLevel;
  includeMastered?: boolean;
  excludeIds?: string[];
}

// 题目信息
export interface QuestionInfo {
  id: string;
  type: QuestionType;
  content: string;
  question?: string;
  options?: string;
  answer?: string;
  analysis: string;
  knowledgePoints?: string[];
  difficultyLevel: DifficultyLevel;
  masteryLevel: MasteryLevel;
  subjectId: string;
}

// 试卷信息
export interface Exam {
  id: string;
  userId: string;
  name: string;
  questionIds: string[];
  questions?: QuestionInfo[];
  filterConfig: FilterConfig;
  status: ExamStatus;
  questionCount: number;
  shuffleQuestions: boolean;
  timeLimit?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// 试卷记录
export interface ExamRecord {
  id: string;
  examId: string;
  examName: string;
  userId: string;
  status: ExamStatus;
  questionCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  accuracy: number;
  timeSpent: number;
  startedAt: string;
  completedAt?: string;
}

// 答题记录
export interface ExamAnswer {
  id: string;
  examRecordId: string;
  questionId: string;
  question: QuestionInfo;
  userAnswer?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  timeSpent: number;
  answeredAt?: string;
  isFavorite?: boolean;
  note?: string;
}

// 创建试卷参数
export interface CreateExamDto {
  subjectId: string;
  name: string;
  filterConfig: FilterConfig;
  questionCount: number;
  shuffleQuestions?: boolean;
  timeLimit?: number;
}

// 获取可用题目数量参数
export interface GetAvailableCountParams {
  subjectId: string;
  knowledgePoints?: string[];
  type?: QuestionType;
  difficulty?: DifficultyLevel;
  masteryLevel?: MasteryLevel;
}

// 开始练习参数
export interface StartExamParams {
  shuffleAnswers?: boolean;
}

// 提交答案参数
export interface SubmitAnswerParams {
  questionId: string;
  userAnswer: string;
  timeSpent?: number;
}

// 交卷参数
export interface SubmitExamParams {
  force?: boolean;
}

// 练习结果
export interface ExamResult {
  examRecord: ExamRecord;
  answers: ExamAnswer[];
  statistics: {
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
    accuracy: number;
    averageTimePerQuestion: number;
    totalTimeSpent: number;
    subjectStats: Array<{
      subjectId: string;
      subjectName: string;
      correctCount: number;
      totalCount: number;
      accuracy: number;
    }>;
    difficultyStats: Array<{
      difficulty: DifficultyLevel;
      correctCount: number;
      totalCount: number;
      accuracy: number;
    }>;
    typeStats: Array<{
      type: QuestionType;
      correctCount: number;
      totalCount: number;
      accuracy: number;
    }>;
  };
  recommendations: string[];
}

export const practiceApi = {
  // 获取可用题目数量
  getAvailableCount: (params: GetAvailableCountParams) =>
    get<{ count: number }>('/practice/available-count', { params }),

  // 创建试卷（智能组卷）
  createExam: (data: CreateExamDto) =>
    post<Exam>('/practice/exam', data),

  // 获取试卷列表
  getExamList: (params?: { status?: ExamStatus; page?: number; limit?: number }) =>
    get<{ data: Exam[]; total: number }>('/practice/exam', { params }),

  // 获取试卷详情
  getExamById: (id: string) =>
    get<Exam>(`/practice/exam/${id}`),

  // 删除试卷
  deleteExam: (id: string) =>
    del(`/practice/exam/${id}`),

  // 开始练习
  startExam: (id: string, params?: StartExamParams) =>
    post<{ examRecordId: string; questions: QuestionInfo[] }>(`/practice/exam/${id}/start`, params || {}),

  // 检查练习是否超时
  checkTimeout: (examRecordId: string) =>
    get<{ hasTimeout: boolean; remainingTime: number | null; result?: any }>(`/practice/exam-record/${examRecordId}/timeout`),

  // 提交单题答案
  submitAnswer: (examRecordId: string, data: SubmitAnswerParams) =>
    post<ExamAnswer>(`/practice/exam-record/${examRecordId}/answer`, data),

  // 获取答题进度
  getProgress: (examRecordId: string) =>
    get<{ answeredCount: number; totalCount: number; answers: ExamAnswer[] }>(
      `/practice/exam-record/${examRecordId}/progress`
    ),

  // 交卷
  submitExam: (examRecordId: string, params?: SubmitExamParams) =>
    post<ExamResult>(`/practice/exam-record/${examRecordId}/submit`, params || {}),

  // 获取练习结果
  getResult: (examRecordId: string) =>
    get<ExamResult>(`/practice/exam-record/${examRecordId}/result`),

  // 获取练习记录列表
  getExamRecordList: (params?: { page?: number; limit?: number }) =>
    get<{ data: ExamRecord[]; total: number }>('/practice/exam-record', { params }),

  // 获取练习记录详情
  getExamRecordById: (id: string) =>
    get<ExamRecord & { answers: ExamAnswer[] }>(`/practice/exam-record/${id}`),

  // 收藏题目
  toggleFavorite: (examRecordId: string, questionId: string) =>
    put(`/practice/exam-record/${examRecordId}/answer/${questionId}/favorite`),

  // 添加笔记
  addNote: (examRecordId: string, questionId: string, note: string) =>
    put(`/practice/exam-record/${examRecordId}/answer/${questionId}/note`, { note }),

  // 获取统计数据
  getStatistics: (params?: { startDate?: string; endDate?: string }) =>
    get<any>('/practice/statistics', { params }),

  // 获取今日统计
  getTodayStats: () =>
    get<any>('/practice/statistics/today'),
};
