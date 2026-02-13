import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
  ) {}

  async findAll(userId: string) {
    // 确保默认科目已初始化
    await this.seedDefaultSubjects();

    // 获取用户的科目和公共科目
    const [userSubjects, publicSubjects] = await Promise.all([
      this.subjectRepository.find({
        where: { userId },
        order: { sortOrder: 'ASC', name: 'ASC' },
      }),
      this.subjectRepository.find({
        where: { isPublic: true, userId: null },
        order: { sortOrder: 'ASC', name: 'ASC' },
      }),
    ]);

    // 合并去重
    const allSubjects = [...userSubjects];
    const existingIds = new Set(userSubjects.map(s => s.id));

    for (const publicSubject of publicSubjects) {
      if (!existingIds.has(publicSubject.id)) {
        allSubjects.push(publicSubject);
      }
    }

    return allSubjects;
  }

  async findDefault() {
    return this.subjectRepository.find({
      where: { isPublic: true, userId: null },
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: string) {
    const subject = await this.subjectRepository.findOne({
      where: { id },
      relations: ['mistakes'],
    });

    if (!subject) {
      throw new NotFoundException('科目不存在');
    }

    return subject;
  }

  async create(userId: string, createDto: CreateSubjectDto) {
    // 检查同名科目
    const existing = await this.subjectRepository.findOne({
      where: { userId, name: createDto.name },
    });

    if (existing) {
      throw new BadRequestException('科目名称已存在');
    }

    const subject = this.subjectRepository.create({
      userId,
      ...createDto,
      mistakeCount: 0,
    });

    return this.subjectRepository.save(subject);
  }

  async update(id: string, updateDto: UpdateSubjectDto) {
    const subject = await this.subjectRepository.findOne({ where: { id } });

    if (!subject) {
      throw new NotFoundException('科目不存在');
    }

    // 如果修改名称，检查是否重复
    if (updateDto.name && updateDto.name !== subject.name) {
      const existing = await this.subjectRepository.findOne({
        where: { userId: subject.userId, name: updateDto.name },
      });

      if (existing) {
        throw new BadRequestException('科目名称已存在');
      }
    }

    Object.assign(subject, updateDto);
    return this.subjectRepository.save(subject);
  }

  async remove(id: string) {
    const subject = await this.subjectRepository.findOne({
      where: { id },
      relations: ['mistakes'],
    });

    if (!subject) {
      throw new NotFoundException('科目不存在');
    }

    if (subject.mistakes.length > 0) {
      throw new BadRequestException('该科目下还有错题，无法删除');
    }

    await this.subjectRepository.remove(subject);
    return { success: true };
  }

  /**
   * 初始化默认公共科目
   */
  async seedDefaultSubjects() {
    // 检查是否已有默认科目
    const existing = await this.subjectRepository.findOne({
      where: { code: 'politics', userId: null },
    });

    if (existing) {
      return; // 已初始化过
    }

    // 创建默认科目
    const defaultSubjects = [
      {
        id: 'politics',
        userId: null,
        code: 'politics',
        name: '政治理论',
        icon: '🏛️',
        color: '#e74c3c',
        isPublic: true,
        mistakeCount: 0,
        sortOrder: 1,
        category: 'politics',
      },
      {
        id: 'general',
        userId: null,
        code: 'general',
        name: '常识判断',
        icon: '🌐',
        color: '#3498db',
        isPublic: true,
        mistakeCount: 0,
        sortOrder: 2,
        category: 'general',
      },
      {
        id: 'verbal',
        userId: null,
        code: 'verbal',
        name: '言语理解',
        icon: '📖',
        color: '#9b59b6',
        isPublic: true,
        mistakeCount: 0,
        sortOrder: 3,
        category: 'verbal',
      },
      {
        id: 'reasoning',
        userId: null,
        code: 'reasoning',
        name: '判断推理',
        icon: '🧩',
        color: '#1abc9c',
        isPublic: true,
        mistakeCount: 0,
        sortOrder: 4,
        category: 'reasoning',
      },
      {
        id: 'quantitative',
        userId: null,
        code: 'quantitative',
        name: '数量关系',
        icon: '🔢',
        color: '#e67e22',
        isPublic: true,
        mistakeCount: 0,
        sortOrder: 5,
        category: 'quantitative',
      },
    ];

    await this.subjectRepository.save(defaultSubjects);
  }
}
