import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { MistakeService } from './mistake.service';
import { Mistake } from './entities/mistake.entity';
import { Subject } from '../subject/entities/subject.entity';
import { NotFoundException } from '@nestjs/common';
import { QuestionParserService } from './question-parser.service';

describe('MistakeService', () => {
  let service: MistakeService;
  let mistakeRepository: jest.Mocked<Repository<Mistake>>;
  let subjectRepository: jest.Mocked<Repository<Subject>>;
  let questionParser: jest.Mocked<QuestionParserService>;

  const mockSubject: Subject = {
    id: 'subject-123',
    userId: null,
    user: null,
    name: '数学',
    description: '数学科目',
    icon: null,
    color: null,
    isPublic: false,
    mistakeCount: 10,
    sortOrder: 0,
    parentId: null,
    parent: null,
    mistakes: [],
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMistake: Mistake = {
    id: '1',
    userId: 'user-123',
    subjectId: 'subject-123',
    subject: mockSubject,
    type: 'choice',
    content: '1+1等于几？',
    question: '1+1等于几？',
    options: '["A.1","B.2","C.3","D.4"]',
    answer: 'B',
    userAnswer: 'A',
    analysis: '1+1=2',
    knowledgePoints: ['加法'],
    difficultyLevel: 'easy',
    masteryLevel: 'unknown',
    reviewCount: 0,
    correctCount: 0,
    lastReviewAt: null,
    nextReviewAt: null,
    source: 'practice',
    isFavorite: false,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    user: null as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MistakeService,
        {
          provide: getRepositoryToken(Mistake),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findBy: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Subject),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: QuestionParserService,
          useValue: {
            parse: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MistakeService>(MistakeService);
    mistakeRepository = module.get(getRepositoryToken(Mistake));
    subjectRepository = module.get(getRepositoryToken(Subject));
    questionParser = module.get(QuestionParserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new mistake', async () => {
      const createDto = {
        subjectId: 'subject-123',
        type: 'choice',
        content: '1+1等于几？',
        answer: 'B',
        analysis: '1+1=2',
      };

      subjectRepository.findOne.mockResolvedValue(mockSubject);
      mistakeRepository.findOne.mockResolvedValue(null);
      mistakeRepository.create.mockReturnValue(mockMistake);
      mistakeRepository.save.mockResolvedValue(mockMistake);

      const result = await service.create('user-123', createDto);

      expect(result).toEqual(mockMistake);
      expect(subjectRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.subjectId },
      });
    });

    it('should throw NotFoundException if subject not found', async () => {
      const createDto = {
        subjectId: 'non-existent',
        type: 'choice',
        content: '1+1等于几？',
        answer: 'B',
        analysis: '1+1=2',
      };

      subjectRepository.findOne.mockResolvedValue(null);

      await expect(service.create('user-123', createDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if mistake already exists', async () => {
      const createDto = {
        subjectId: 'subject-123',
        type: 'choice',
        content: '1+1等于几？',
        answer: 'B',
        analysis: '1+1=2',
      };

      subjectRepository.findOne.mockResolvedValue(mockSubject);
      mistakeRepository.findOne.mockResolvedValue(mockMistake);

      await expect(service.create('user-123', createDto)).rejects.toThrow(
        '该错题已存在'
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated mistakes', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockMistake], 1]),
      };

      jest.spyOn(mistakeRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll('user-123', { page: 1, limit: 20 });

      expect(result.data).toEqual([mockMistake]);
      expect(result.total).toBe(1);
    });

    it('should filter by subjectId', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockMistake], 1]),
      };

      jest.spyOn(mistakeRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await service.findAll('user-123', { subjectId: 'subject-123' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'mistake.subjectId = :subjectId',
        { subjectId: 'subject-123' }
      );
    });

    it('should filter by masteryLevel', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockMistake], 1]),
      };

      jest.spyOn(mistakeRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await service.findAll('user-123', { masteryLevel: 'mastered' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'mistake.masteryLevel = :masteryLevel',
        { masteryLevel: 'mastered' }
      );
    });
  });

  describe('findOne', () => {
    it('should return a mistake with subject relation', async () => {
      mistakeRepository.findOne.mockResolvedValue(mockMistake);

      const result = await service.findOne('1');

      expect(result).toEqual(mockMistake);
      expect(mistakeRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['subject'],
      });
    });

    it('should throw NotFoundException if mistake not found', async () => {
      mistakeRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    it('should update and return the mistake', async () => {
      const updateDto = { content: 'Updated content' };
      mistakeRepository.findOne.mockResolvedValue(mockMistake);
      mistakeRepository.save.mockResolvedValue({ ...mockMistake, ...updateDto });

      const result = await service.update('1', updateDto);

      expect(mistakeRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if mistake not found', async () => {
      mistakeRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should delete the mistake', async () => {
      mistakeRepository.findOne.mockResolvedValue(mockMistake);
      mistakeRepository.remove.mockResolvedValue(mockMistake);
      subjectRepository.findOne.mockResolvedValue(mockSubject);

      const result = await service.remove('1');

      expect(result).toEqual({ success: true });
      expect(mistakeRepository.remove).toHaveBeenCalledWith(mockMistake);
    });

    it('should throw NotFoundException if mistake not found', async () => {
      mistakeRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getStatsOverview', () => {
    it('should return statistics overview', async () => {
      mistakeRepository.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3)  // mastered
        .mockResolvedValueOnce(4)  // familiar
        .mockResolvedValueOnce(3)  // unknown
        .mockResolvedValueOnce(2); // favorite

      const mockRawResult = {
        subjectId: 'subject-123',
        subjectName: '数学',
        count: '10',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([mockRawResult]),
      };

      jest.spyOn(mistakeRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getStatsOverview('user-123');

      expect(result.total).toBe(10);
      expect(result.masteredCount).toBe(3);
      expect(result.familiarCount).toBe(4);
      expect(result.unknownCount).toBe(3);
      expect(result.favoriteCount).toBe(2);
    });
  });
});
