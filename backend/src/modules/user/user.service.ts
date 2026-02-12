import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'nickname', 'avatarUrl', 'phone', 'status', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async getStats(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['mistakes'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const totalMistakes = user.mistakes.length;
    const masteredCount = user.mistakes.filter(m => m.masteryLevel === 'mastered').length;
    const favoriteCount = user.mistakes.filter(m => m.isFavorite).length;

    return {
      totalMistakes,
      masteredCount,
      favoriteCount,
      accuracy: totalMistakes > 0 ? (masteredCount / totalMistakes * 100).toFixed(2) : 0,
    };
  }
}
