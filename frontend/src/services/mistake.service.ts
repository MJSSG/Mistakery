import { api } from './api';

export interface Mistake {
  id: string;
  userId: string;
  subjectId: string;
  subject?: string;
  type: string;
  content: string;
  question?: {
    type: string;
    content: string;
    options?: string[];
    correctAnswer?: string | string[];
    subject?: string;
    difficulty?: string;
    explanation?: string;
  };
  userAnswer?: string | string[];
  analysis?: string;
  knowledgePoints?: string[];
  difficultyLevel: string;
  masteryLevel: string;
  reviewCount: number;
  correctCount: number;
  lastReviewAt?: string;
  nextReviewAt?: string;
  isFavorited?: boolean;
  isMarked?: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMistakeDto {
  subjectId: string;
  type: string;
  content: string;
  question?: {
    type: string;
    content: string;
    options?: string[];
    correctAnswer?: string | string[];
    subject?: string;
    difficulty?: string;
    explanation?: string;
  };
  userAnswer?: string | string[];
  analysis?: string;
  knowledgePoints?: string[];
  difficultyLevel: string;
  source?: string;
}

export interface UpdateMistakeDto {
  type?: string;
  content?: string;
  question?: any;
  userAnswer?: string | string[];
  analysis?: string;
  knowledgePoints?: string[];
  difficultyLevel?: string;
  masteryLevel?: string;
}

export interface QueryMistakeDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  subjectId?: string;
  difficultyLevel?: string;
  masteryLevel?: string;
  keyword?: string;
}

export interface MistakeListResponse {
  items: Mistake[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 错题服务
 */
export const mistakeService = {
  /**
   * 获取错题列表
   */
  getMistakeList: (params: QueryMistakeDto = {}): Promise<MistakeListResponse> => {
    return api.get('/mistake', { params });
  },

  /**
   * 获取错题详情
   */
  getMistakeDetail: (id: string): Promise<Mistake> => {
    return api.get(`/mistake/${id}`);
  },

  /**
   * 解析题目内容
   */
  parseQuestion: (content: string): Promise<any> => {
    return api.post('/mistake/parse', { content });
  },

  /**
   * 保存错题
   */
  saveMistake: (data: CreateMistakeDto): Promise<Mistake> => {
    return api.post('/mistake/save', data);
  },

  /**
   * 解析并保存错题（一步完成）
   */
  parseAndSave: (content: string): Promise<Mistake> => {
    return api.post('/mistake/parse-and-save', { content });
  },

  /**
   * 更新错题
   */
  updateMistake: (id: string, data: UpdateMistakeDto): Promise<Mistake> => {
    return api.put(`/mistake/${id}`, data);
  },

  /**
   * 更新掌握程度
   */
  updateMastery: (id: string, masteryLevel: string): Promise<Mistake> => {
    return api.put(`/mistake/${id}/mastery`, { masteryLevel });
  },

  /**
   * 切换收藏状态
   */
  toggleFavorite: (id: string): Promise<Mistake> => {
    return api.put(`/mistake/${id}/favorite`);
  },

  /**
   * 删除错题
   */
  deleteMistake: (id: string): Promise<void> => {
    return api.delete(`/mistake/${id}`);
  },

  /**
   * 批量删除错题
   */
  batchDeleteMistakes: (ids: string[]): Promise<void> => {
    return api.post('/mistake/batch-delete', ids);
  },

  /**
   * 获取错题统计概览
   */
  getStatsOverview: (): Promise<any> => {
    return api.get('/mistake/stats/overview');
  },

  /**
   * 获取科目知识点统计
   */
  getStatsBySubject: (subjectId: string): Promise<any> => {
    return api.get(`/mistake/stats/subject/${subjectId}`);
  },
};

export default mistakeService;
