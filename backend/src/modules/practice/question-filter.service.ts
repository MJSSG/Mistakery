import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Mistake } from '../mistake/entities/mistake.entity';
import { FilterConfigDto } from './dto/practice.dto';

/**
 * 题目筛选服务
 * 负责根据各种条件筛选错题
 */
@Injectable()
export class QuestionFilterService {
  constructor(
    @InjectRepository(Mistake)
    private mistakeRepository: Repository<Mistake>,
  ) {}

  /**
   * 根据筛选条件获取可用题目数量
   */
  async getAvailableCount(userId: string, subjectId: string, filterConfig?: FilterConfigDto): Promise<number> {
    const queryBuilder = this.buildFilterQuery(userId, subjectId, filterConfig);
    return queryBuilder.getCount();
  }

  /**
   * 根据筛选条件获取题目列表
   */
  async filterQuestions(
    userId: string,
    subjectId: string,
    filterConfig?: FilterConfigDto,
    limit?: number,
  ): Promise<Mistake[]> {
    const queryBuilder = this.buildFilterQuery(userId, subjectId, filterConfig);

    if (limit) {
      queryBuilder.limit(limit);
    }

    return queryBuilder.getMany();
  }

  /**
   * 随机获取指定数量的题目
   */
  async getRandomQuestions(
    userId: string,
    subjectId: string,
    count: number,
    filterConfig?: FilterConfigDto,
    excludeIds: string[] = [],
  ): Promise<Mistake[]> {
    // 先获取所有符合条件的题目ID
    const queryBuilder = this.buildFilterQuery(userId, subjectId, filterConfig).select(['mistake.id']);

    if (excludeIds.length > 0) {
      queryBuilder.andWhere('mistake.id NOT IN (:...excludeIds)', { excludeIds });
    }

    const questions = await queryBuilder.getRawMany();
    const availableIds = questions.map((q: any) => q.mistake_id);

    if (availableIds.length === 0) {
      throw new NotFoundException('没有找到符合条件的题目');
    }

    if (availableIds.length < count) {
      throw new NotFoundException(`可用题目数量（${availableIds.length}）少于请求数量（${count}）`);
    }

    // 随机选择
    const selectedIds = this.shuffleArray(availableIds).slice(0, count);

    // 获取完整题目信息
    return this.mistakeRepository.find({
      where: { id: In(selectedIds) },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 构建筛选查询
   */
  private buildFilterQuery(userId: string, subjectId: string, filterConfig?: FilterConfigDto) {
    const queryBuilder = this.mistakeRepository.createQueryBuilder('mistake');

    // 基础条件：用户和科目
    queryBuilder
      .where('mistake.userId = :userId', { userId })
      .andWhere('mistake.subjectId = :subjectId', { subjectId });

    // 知识点筛选
    if (filterConfig?.knowledgePoints && filterConfig.knowledgePoints.length > 0) {
      queryBuilder.andWhere('JSON_OVERLAPS(mistake.knowledgePoints, :knowledgePoints)', {
        knowledgePoints: JSON.stringify(filterConfig.knowledgePoints),
      });
    }

    // 题型筛选
    if (filterConfig?.type) {
      queryBuilder.andWhere('mistake.type = :type', { type: filterConfig.type });
    }

    // 难度筛选
    if (filterConfig?.difficulty) {
      queryBuilder.andWhere('mistake.difficultyLevel = :difficulty', { difficulty: filterConfig.difficulty });
    }

    // 掌握程度筛选
    if (filterConfig?.masteryLevel) {
      queryBuilder.andWhere('mistake.masteryLevel = :masteryLevel', { masteryLevel: filterConfig.masteryLevel });
    }

    // 排除已掌握题目
    if (!filterConfig?.includeMastered) {
      queryBuilder.andWhere('mistake.masteryLevel != :mastered', { mastered: 'mastered' });
    }

    // 排除指定题目
    if (filterConfig?.excludeIds && filterConfig.excludeIds.length > 0) {
      queryBuilder.andWhere('mistake.id NOT IN (:...excludeIds)', { excludeIds: filterConfig.excludeIds });
    }

    return queryBuilder;
  }

  /**
   * Fisher-Yates 洗牌算法
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * 获取知识点分布统计
   */
  async getKnowledgePointStats(userId: string, subjectId: string): Promise<Array<{ name: string; count: number }>> {
    const mistakes = await this.mistakeRepository.find({
      where: { userId, subjectId },
      select: ['knowledgePoints'],
    });

    const stats = new Map<string, number>();

    mistakes.forEach((mistake) => {
      if (mistake.knowledgePoints) {
        mistake.knowledgePoints.forEach((point) => {
          stats.set(point, (stats.get(point) || 0) + 1);
        });
      }
    });

    return Array.from(stats.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 获取题型分布统计
   */
  async getTypeStats(userId: string, subjectId: string): Promise<Array<{ type: string; count: number }>> {
    const result = await this.mistakeRepository
      .createQueryBuilder('mistake')
      .select('mistake.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('mistake.userId = :userId', { userId })
      .andWhere('mistake.subjectId = :subjectId', { subjectId })
      .groupBy('mistake.type')
      .getRawMany();

    return result.map((r) => ({ type: r.type, count: parseInt(r.count) }));
  }

  /**
   * 获取难度分布统计
   */
  async getDifficultyStats(userId: string, subjectId: string): Promise<Array<{ difficulty: string; count: number }>> {
    const result = await this.mistakeRepository
      .createQueryBuilder('mistake')
      .select('mistake.difficultyLevel', 'difficulty')
      .addSelect('COUNT(*)', 'count')
      .where('mistake.userId = :userId', { userId })
      .andWhere('mistake.subjectId = :subjectId', { subjectId })
      .groupBy('mistake.difficultyLevel')
      .getRawMany();

    return result.map((r) => ({ difficulty: r.difficulty, count: parseInt(r.count) }));
  }
}
