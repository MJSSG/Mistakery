import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    nickname: 'Test User',
    avatarUrl: null,
    phone: null,
    status: 'active',
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    mistakes: [],
  };

  const mockAuthResponse = {
    user: {
      id: mockUser.id,
      username: mockUser.username,
      email: mockUser.email,
      nickname: mockUser.nickname,
    },
    token: 'mock-token',
  };

  const mockRefreshResponse = {
    token: 'new-mock-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue(mockAuthResponse),
            register: jest.fn().mockResolvedValue(mockAuthResponse),
            refreshToken: jest.fn().mockResolvedValue(mockRefreshResponse),
            getProfile: jest.fn().mockResolvedValue({
              id: mockUser.id,
              username: mockUser.username,
              email: mockUser.email,
              nickname: mockUser.nickname,
              avatarUrl: mockUser.avatarUrl,
              createdAt: mockUser.createdAt,
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn().mockReturnValue({ userId: mockUser.id }),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw conflict error if user exists', async () => {
      const registerDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(authService, 'register').mockRejectedValue({
        message: '用户已存在',
      });

      await expect(controller.register(registerDto)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should return auth token for valid credentials', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'password123',
      };

      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw unauthorized error for invalid credentials', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      jest.spyOn(authService, 'login').mockRejectedValue({
        message: '用户名或密码错误',
      });

      await expect(controller.login(loginDto)).rejects.toThrow();
    });
  });

  describe('getProfile', () => {
    it('should return user profile if authenticated', async () => {
      const req = { user: { sub: mockUser.id } };
      const mockProfile = {
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        nickname: mockUser.nickname,
        avatarUrl: mockUser.avatarUrl,
        createdAt: mockUser.createdAt,
      };

      authService.getProfile.mockResolvedValue(mockProfile as any);

      const result = await controller.getProfile(req);

      expect(result).toEqual(mockProfile);
      expect(authService.getProfile).toHaveBeenCalledWith(req.user);
    });
  });

  describe('refresh', () => {
    it('should return new token for valid refresh token', async () => {
      const refreshTokenDto = { token: 'valid-refresh-token' };

      authService.refreshToken.mockResolvedValue(mockRefreshResponse);

      const result = await controller.refresh(refreshTokenDto);

      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto.token);
      expect(result.token).toBe('new-mock-token');
    });

    it('should throw error for invalid refresh token', async () => {
      const refreshTokenDto = { token: 'invalid-refresh-token' };

      const unauthorizedError = new Error('Invalid token');
      jest.spyOn(authService, 'refreshToken').mockRejectedValue(unauthorizedError);

      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow();
    });
  });
});
