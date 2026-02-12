import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, nickname, password } = registerDto;

    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new BadRequestException('用户名或邮箱已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = this.userRepository.create({
      username,
      email,
      nickname: nickname || username,
      passwordHash: hashedPassword,
    });

    await this.userRepository.save(user);

    // 生成 JWT
    const payload = { sub: user.id, username: user.username };
    const token = await this.jwtService.signAsync(payload);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
      },
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // 查找用户（需要包含密码哈希）
    const user = await this.userRepository.findOne({
      where: [{ username }, { email: username }],
      select: ['id', 'username', 'email', 'nickname', 'passwordHash', 'avatarUrl'],
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 检查密码哈希是否存在
    if (!user.passwordHash) {
      throw new UnauthorizedException('用户账户异常，请联系管理员');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 生成 JWT
    const payload = { sub: user.id, username: user.username };
    const token = await this.jwtService.signAsync(payload);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    };
  }

  async getProfile(user: any) {
    const userInfo = await this.userRepository.findOne({
      where: { id: user.sub },
      select: ['id', 'username', 'email', 'nickname', 'avatarUrl', 'createdAt'],
    });

    if (!userInfo) {
      throw new UnauthorizedException('用户不存在');
    }

    return userInfo;
  }

  async refreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      const newPayload = { sub: user.id, username: user.username };
      const newToken = await this.jwtService.signAsync(newPayload);

      return {
        token: newToken,
      };
    } catch (error) {
      throw new UnauthorizedException('无效的令牌');
    }
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: [{ username }, { email: username }],
      select: ['id', 'username', 'email', 'nickname', 'passwordHash', 'avatarUrl'],
    });

    if (!user) {
      return null;
    }

    // 检查密码哈希是否存在
    if (!user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }
}
