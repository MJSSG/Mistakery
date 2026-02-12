import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mistake } from './entities/mistake.entity';
import { Subject } from '../subject/entities/subject.entity';
import { QuestionParserService } from './question-parser.service';
import { CreateMistakeDto, UpdateMistakeDto, QueryMistakeDto, ParsedMistake } from './dto/mistake.dto';

@Injectable()
export class MistakeService {
  constructor(
    @InjectRepository(Mistake)
    private mistakeRepository: Repository<Mistake>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    private questionParser: QuestionParserService,
  ) {}

  async parseContent(content: string): Promise<ParsedMistake> {
    return this.questionParser.parse(content);
  }

  async create(userId: string, createDto: CreateMistakeDto) {
    // 查找或创建科目
    let subject = await this.subjectRepository.findOne({
      where: { id: createDto.subjectId },
    });

    if (!subject) {
      // 科目不存在，自动创建默认科目
      const defaultSubjects = {
        'politics': { name: '政治理论', icon: '🏛️', color: '#e74c3c' },
        'general': { name: '常识判断', icon: '🌐', color: '#3498db' },
        'verbal': { name: '言语理解', icon: '📖', color: '#9b59b6' },
        'reasoning': { name: '判断推理', icon: '🧩', color: '#1abc9c' },
        'quant': { name: '数量关系', icon: '🔢', color: '#e67e22' },
      };

      const defaultSubject = defaultSubjects[createDto.subjectId as keyof typeof defaultSubjects];
      if (defaultSubject) {
        subject = this.subjectRepository.create({
          id: createDto.subjectId,
          userId,
          name: defaultSubject.name,
          icon: defaultSubject.icon,
          color: defaultSubject.color,
          mistakeCount: 0,
        });
        await this.subjectRepository.save(subject);
      } else {
        throw new NotFoundException('科目不存在');
      }
    }

    // 检查是否已存在相同题目
    const existingMistake = await this.mistakeRepository.findOne({
      where: {
        userId,
        subjectId: createDto.subjectId,
        content: createDto.content,
      },
    });

    if (existingMistake) {
      throw new BadRequestException('该错题已存在');
    }

    // 创建错题
    const mistake = this.mistakeRepository.create({
      userId,
      ...createDto,
    });

    const saved = await this.mistakeRepository.save(mistake);

    // 更新科目的错题数量
    subject.mistakeCount += 1;
    await this.subjectRepository.save(subject);

    return saved;
  }

  async parseAndSave(userId: string, content: string) {
    const parsed = await this.parseContent(content);

    if (!parsed.type) {
      throw new BadRequestException('无法识别题目类型');
    }

    if (!parsed.subjectId) {
      throw new BadRequestException('未指定科目');
    }

    return this.create(userId, parsed as any);
  }

  async findAll(userId: string, query: QueryMistakeDto) {
    const {
      subjectId,
      type,
      difficultyLevel,
      masteryLevel,
      isFavorite,
      page = 1,
      limit = 20,
      keyword,
      sortBy = 'recent',
      errorCount,
      timeRange,
    } = query;

    const queryBuilder = this.mistakeRepository
      .createQueryBuilder('mistake')
      .where('mistake.userId = :userId', { userId })
      .leftJoinAndSelect('mistake.subject', 'subject');

    // 根据 sortBy 参数设置排序
    switch (sortBy) {
      case 'recent':
        queryBuilder.orderBy('mistake.createdAt', 'DESC');
        break;
      case 'oldest':
        queryBuilder.orderBy('mistake.createdAt', 'ASC');
        break;
      case 'difficulty':
        queryBuilder.orderBy('mistake.difficultyLevel', 'DESC');
        break;
      case 'errorCount':
        queryBuilder.orderBy('mistake.errorCount', 'DESC');
        break;
      case 'reviewCount':
        queryBuilder.orderBy('mistake.reviewCount', 'DESC');
        break;
      default:
        queryBuilder.orderBy('mistake.createdAt', 'DESC');
    }

    if (subjectId) {
      queryBuilder.andWhere('mistake.subjectId = :subjectId', { subjectId });
    }

    if (type) {
      queryBuilder.andWhere('mistake.type = :type', { type });
    }

    if (difficultyLevel) {
      queryBuilder.andWhere('mistake.difficultyLevel = :difficultyLevel', { difficultyLevel });
    }

    if (masteryLevel) {
      queryBuilder.andWhere('mistake.masteryLevel = :masteryLevel', { masteryLevel });
    }

    if (isFavorite !== undefined) {
      queryBuilder.andWhere('mistake.isFavorite = :isFavorite', { isFavorite });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(mistake.content LIKE :keyword OR mistake.question LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 处理错误次数筛选
    if (errorCount) {
      if (errorCount === '4+') {
        queryBuilder.andWhere('mistake.errorCount >= 4');
      } else {
        queryBuilder.andWhere('mistake.errorCount = :errorCount', { errorCount });
      }
    }

    // 处理时间范围筛选
    if (timeRange) {
      const now = new Date();
      switch (timeRange) {
        case 'today':
          queryBuilder.andWhere('mistake.createdAt >= :startDate', {
            startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          });
          break;
        case '3days':
          queryBuilder.andWhere('mistake.createdAt >= :startDate', {
            startDate: new Date(now.setDate(now.getDate() - 3)),
          });
          break;
        case '7days':
          queryBuilder.andWhere('mistake.createdAt >= :startDate', {
            startDate: new Date(now.setDate(now.getDate() - 7)),
          });
          break;
        case '30days':
          queryBuilder.andWhere('mistake.createdAt >= :startDate', {
            startDate: new Date(now.setDate(now.getDate() - 30)),
          });
          break;
      }
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: items,
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const mistake = await this.mistakeRepository.findOne({
      where: { id },
      relations: ['subject'],
    });

    if (!mistake) {
      throw new NotFoundException('错题不存在');
    }

    return mistake;
  }

  async update(id: string, updateDto: UpdateMistakeDto) {
    const mistake = await this.mistakeRepository.findOne({ where: { id } });

    if (!mistake) {
      throw new NotFoundException('错题不存在');
    }

    Object.assign(mistake, updateDto);
    return this.mistakeRepository.save(mistake);
  }

  async updateMastery(id: string, masteryLevel: string) {
    const mistake = await this.mistakeRepository.findOne({ where: { id } });

    if (!mistake) {
      throw new NotFoundException('错题不存在');
    }

    mistake.masteryLevel = masteryLevel;
    return this.mistakeRepository.save(mistake);
  }

  async toggleFavorite(id: string) {
    const mistake = await this.mistakeRepository.findOne({ where: { id } });

    if (!mistake) {
      throw new NotFoundException('错题不存在');
    }

    mistake.isFavorite = !mistake.isFavorite;
    return this.mistakeRepository.save(mistake);
  }

  async remove(id: string) {
    const mistake = await this.mistakeRepository.findOne({ where: { id } });

    if (!mistake) {
      throw new NotFoundException('错题不存在');
    }

    await this.mistakeRepository.remove(mistake);

    // 更新科目的错题数量
    const subject = await this.subjectRepository.findOne({
      where: { id: mistake.subjectId },
    });

    if (subject && subject.mistakeCount > 0) {
      subject.mistakeCount -= 1;
      await this.subjectRepository.save(subject);
    }

    return { success: true };
  }

  async batchRemove(ids: string[]) {
    const mistakes = await this.mistakeRepository.findBy({ id: ids as any });

    // 统计每个科目的错题数量变化
    const subjectCountMap = new Map<string, number>();
    for (const mistake of mistakes) {
      const count = subjectCountMap.get(mistake.subjectId) || 0;
      subjectCountMap.set(mistake.subjectId, count + 1);
    }

    await this.mistakeRepository.remove(mistakes);

    // 更新科目的错题数量
    for (const [subjectId, count] of subjectCountMap) {
      const subject = await this.subjectRepository.findOne({
        where: { id: subjectId },
      });

      if (subject && subject.mistakeCount >= count) {
        subject.mistakeCount -= count;
        await this.subjectRepository.save(subject);
      }
    }

    return { success: true, count: mistakes.length };
  }

  async getStatsOverview(userId: string) {
    const total = await this.mistakeRepository.count({ where: { userId } });

    const masteredCount = await this.mistakeRepository.count({
      where: { userId, masteryLevel: 'mastered' },
    });

    const familiarCount = await this.mistakeRepository.count({
      where: { userId, masteryLevel: 'familiar' },
    });

    const unknownCount = await this.mistakeRepository.count({
      where: { userId, masteryLevel: 'unknown' },
    });

    const favoriteCount = await this.mistakeRepository.count({
      where: { userId, isFavorite: true },
    });

    // 按科目统计
    const subjectStats = await this.mistakeRepository
      .createQueryBuilder('mistake')
      .select('mistake.subjectId', 'subjectId')
      .addSelect('subject.name', 'subjectName')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('mistake.subject', 'subject')
      .where('mistake.userId = :userId', { userId })
      .groupBy('mistake.subjectId')
      .getRawMany();

    return {
      total,
      masteredCount,
      familiarCount,
      unknownCount,
      favoriteCount,
      masteryRate: total > 0 ? ((masteredCount / total) * 100).toFixed(2) : '0',
      subjectStats: subjectStats.map(s => ({
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        count: parseInt(s.count),
      })),
    };
  }
}
