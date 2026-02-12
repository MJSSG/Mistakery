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
}
