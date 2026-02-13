import { get, post, put, del } from './request';

export interface Mistake {
  id: string;
  userId: string;
  subjectId: string;
  type: 'choice' | 'fill' | 'essay' | 'other';
  content: string;
  question?: string;
  options?: string;
  answer?: string;
  userAnswer?: string;
  analysis: string;
  knowledgePoints?: string[];
  difficultyLevel: 'easy' | 'medium' | 'hard';
  masteryLevel: 'unknown' | 'familiar' | 'mastered';
  reviewCount: number;
  correctCount: number;
  lastReviewAt?: string;
  nextReviewAt?: string;
  source?: string;
  isFavorite: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMistakeParams {
  subjectId: string;
  type: 'choice' | 'fill' | 'essay' | 'other';
  content: string;
  question?: string;
  options?: string;
  answer?: string;
  userAnswer?: string;
  analysis: string;
  knowledgePoints?: string[];
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  source?: string;
  tags?: string[];
}

export interface UpdateMistakeParams {
  content?: string;
  question?: string;
  options?: string;
  answer?: string;
  userAnswer?: string;
  analysis?: string;
  knowledgePoints?: string[];
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  masteryLevel?: 'unknown' | 'familiar' | 'mastered';
  source?: string;
  tags?: string[];
}

export interface MistakeListParams {
  subjectId?: string;
  type?: string;
  masteryLevel?: string;
  isFavorite?: boolean;
  page?: number;
  limit?: number;
  keyword?: string;
  errorCount?: string;
  timeRange?: string;
}

export const mistakeApi = {
  // 智能解析题目
  parse: (content: string) => post<any>('/mistake/parse', { content }),

  // 解析并保存
  parseAndSave: (content: string) => post<Mistake>('/mistake/parse-and-save', { content }),

  // 保存解析后的错题
  save: (params: CreateMistakeParams) => post<Mistake>('/mistake/save', params),

  // 获取错题列表
  getList: (params?: MistakeListParams) => get<{ data: Mistake[]; total: number }>('/mistake', { params }),

  // 获取错题统计概览
  getStatsOverview: () => get<any>('/mistake/stats/overview'),

  // 获取错题详情
  getById: (id: string) => get<Mistake>(`/mistake/${id}`),

  // 更新错题
  update: (id: string, params: UpdateMistakeParams) => put<Mistake>(`/mistake/${id}`, params),

  // 更新掌握程度
  updateMastery: (id: string, masteryLevel: string) => put<Mistake>(`/mistake/${id}/mastery`, { masteryLevel }),

  // 切换收藏状态
  toggleFavorite: (id: string) => put<Mistake>(`/mistake/${id}/favorite`),

  // 删除错题
  delete: (id: string) => del(`/mistake/${id}`),

  // 批量删除
  batchDelete: (ids: string[]) => post('/mistake/batch-delete', { ids }),

  // 获取科目知识点统计
  getStatsBySubject: (subjectId: string) => {
    return get<any>(`/mistake/stats/subject/${subjectId}`);
  },
};
