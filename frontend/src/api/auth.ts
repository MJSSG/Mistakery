import { post, get } from './request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    nickname?: string;
    avatarUrl?: string;
  };
  token: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  nickname?: string;
  avatarUrl?: string;
  phone?: string;
  status: string;
  createdAt: string;
}

export const authApi = {
  // 用户登录
  login: (params: LoginParams) => post<AuthResponse>('/auth/login', params),

  // 用户注册
  register: (params: RegisterParams) => post<AuthResponse>('/auth/register', params),

  // 获取用户信息
  getProfile: () => get<User>('/auth/profile'),

  // 刷新令牌
  refreshToken: (token: string) => post<{ token: string }>('/auth/refresh', { token }),
};
