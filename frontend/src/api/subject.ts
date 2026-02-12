import { get, post, put, del } from './request';

export interface Subject {
  id: string;
  userId?: string;
  parentId?: string;
  parent?: Subject;
  children?: Subject[];
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  isPublic: boolean;
  mistakeCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectParams {
  name: string;
  icon?: string;
  color?: string;
  description?: string;
}

export interface UpdateSubjectParams {
  name?: string;
  icon?: string;
  color?: string;
  description?: string;
}

export const subjectApi = {
  // 获取科目列表
  getList: () => get<Subject[]>('/subjects'),

  // 获取科目详情
  getById: (id: string) => get<Subject>(`/subjects/${id}`),

  // 创建科目
  create: (params: CreateSubjectParams) => post<Subject>('/subjects', params),

  // 更新科目
  update: (id: string, params: UpdateSubjectParams) => put<Subject>(`/subjects/${id}`, params),

  // 删除科目
  delete: (id: string) => del(`/subjects/${id}`),
};
