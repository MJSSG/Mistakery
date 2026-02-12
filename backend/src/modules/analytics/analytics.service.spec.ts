import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PerformanceAggregator } from './performance-aggregator.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamRecord } from '../practice/entities/exam-record.entity';
import { Mistake } from '../mistake/entities/mistake.entity';
import { TimeRange, SortBy, SortOrder, SubjectStatistics, TrendDataPoint, DetailReportItem } from './dto/analytics.dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let performanceAggregator: jest.Mocked<PerformanceAggregator>;
  let examRecordRepository: jest.Mocked<Repository<ExamRecord>>;
  let mistakeRepository: jest.Mocked<Repository<Mistake>>;

  const mockUserId = 'user-123';
  const mockStartDate = new Date('2024-01-01');
  const mockEndDate = new Date('2024-01-31');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PerformanceAggregator,
          useValue: {
            getUserExamRecords: jest.fn(),
            getSubjectStatistics: jest.fn(),
            getTrendData: jest.fn(),
            getDetailReport: jest.fn(),
            generateStudyAdvice: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ExamRecord),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Mistake),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    performanceAggregator = module.get(PerformanceAggregator);
    examRecordRepository = module.get(getRepositoryToken(ExamRecord));
    mistakeRepository = module.get(getRepositoryToken(Mistake));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStatisticsOverview', () => {
    it('should return overview statistics', async () => {
      performanceAggregator.getUserExamRecords.mockResolvedValue([]);

      const result = await service.getStatisticsOverview(mockUserId, TimeRange.MONTH);

      expect(result).toBeDefined();
      expect(performanceAggregator.getUserExamRecords).toHaveBeenCalledWith(
        mockUserId,
        TimeRange.MONTH
      );
    });

    it('should cache overview results', async () => {
      performanceAggregator.getUserExamRecords.mockResolvedValue([]);

      // First call
      await service.getStatisticsOverview(mockUserId, TimeRange.MONTH);

      // Second call should use cache
      await service.getStatisticsOverview(mockUserId, TimeRange.MONTH);

      // Should only call the aggregator once due to caching
      expect(performanceAggregator.getUserExamRecords).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSubjectStatistics', () => {
    it('should return subject statistics', async () => {
      const mockSubjectStats: SubjectStatistics[] = [
        {
          subjectId: 'math',
          subjectName: '数学',
          totalExams: 10,
          totalQuestions: 40,
          correctCount: 35,
          accuracy: 87.5,
          averageTimePerQuestion: 180,
          masteryLevel: 'proficient',
          trend: 'improving',
        },
        {
          subjectId: 'physics',
          subjectName: '物理',
          totalExams: 8,
          totalQuestions: 30,
          correctCount: 22,
          accuracy: 73.3,
          averageTimePerQuestion: 200,
          masteryLevel: 'learning',
          trend: 'stable',
        },
      ];

      performanceAggregator.getSubjectStatistics.mockResolvedValue(mockSubjectStats);

      const result = await service.getSubjectStatistics(mockUserId, TimeRange.MONTH);

      expect(result).toEqual(mockSubjectStats);
      expect(performanceAggregator.getSubjectStatistics).toHaveBeenCalledWith(
        mockUserId,
        TimeRange.MONTH
      );
    });
  });

  describe('getTrends', () => {
    it('should return trend data with specified interval', async () => {
      const mockTrends: TrendDataPoint[] = [
        {
          date: new Date('2024-01-01'),
          examCount: 5,
          totalQuestions: 20,
          accuracy: 85,
          averageTimePerQuestion: 180,
        },
        {
          date: new Date('2024-01-08'),
          examCount: 6,
          totalQuestions: 25,
          accuracy: 88,
          averageTimePerQuestion: 175,
        },
      ];

      performanceAggregator.getTrendData.mockResolvedValue(mockTrends);

      const result = await service.getTrends(mockUserId, TimeRange.MONTH, 7, null);

      expect(result).toEqual(mockTrends);
      expect(performanceAggregator.getTrendData).toHaveBeenCalledWith(
        mockUserId,
        TimeRange.MONTH,
        7,
        null
      );
    });

    it('should filter trends by subject if subjectId is provided', async () => {
      const mockTrends: TrendDataPoint[] = [
        {
          date: new Date('2024-01-01'),
          examCount: 3,
          totalQuestions: 10,
          accuracy: 80,
          averageTimePerQuestion: 190,
        },
      ];

      performanceAggregator.getTrendData.mockResolvedValue(mockTrends);

      const result = await service.getTrends(mockUserId, TimeRange.MONTH, 7, 'math-subject');

      expect(result).toEqual(mockTrends);
      expect(performanceAggregator.getTrendData).toHaveBeenCalledWith(
        mockUserId,
        TimeRange.MONTH,
        7,
        'math-subject'
      );
    });
  });

  describe('getDetailReport', () => {
    it('should return paginated detail report', async () => {
      const mockDetails = {
        items: [
          {
            examRecordId: '1',
            examName: '数学测试',
            subjectId: 'math',
            subjectName: '数学',
            questionCount: 20,
            correctCount: 17,
            accuracy: 85,
            timeSpent: 1200,
            completedAt: new Date('2024-01-01'),
          },
          {
            examRecordId: '2',
            examName: '物理测试',
            subjectId: 'physics',
            subjectName: '物理',
            questionCount: 15,
            correctCount: 12,
            accuracy: 80,
            timeSpent: 900,
            completedAt: new Date('2024-01-02'),
          },
        ],
        total: 45,
        page: 1,
        limit: 20,
        summary: {
          averageAccuracy: 82.5,
          averageTimeSpent: 1050,
          bestExam: {
            examRecordId: '1',
            examName: '数学测试',
            subjectId: 'math',
            subjectName: '数学',
            questionCount: 20,
            correctCount: 17,
            accuracy: 85,
            timeSpent: 1200,
            completedAt: new Date('2024-01-01'),
          },
          worstExam: {
            examRecordId: '2',
            examName: '物理测试',
            subjectId: 'physics',
            subjectName: '物理',
            questionCount: 15,
            correctCount: 12,
            accuracy: 80,
            timeSpent: 900,
            completedAt: new Date('2024-01-02'),
          },
        },
      };

      performanceAggregator.getDetailReport.mockResolvedValue(mockDetails);

      const result = await service.getDetailReport(
        mockUserId,
        TimeRange.MONTH,
        SortBy.DATE,
        SortOrder.DESC,
        1,
        20
      );

      expect(result).toEqual(mockDetails);
      expect(performanceAggregator.getDetailReport).toHaveBeenCalledWith(
        mockUserId,
        TimeRange.MONTH,
        SortBy.DATE,
        SortOrder.DESC,
        1,
        20
      );
    });
  });

  describe('getStudyAdvice', () => {
    it('should return study advice based on performance', async () => {
      const mockAdvice = {
        overallAdvice: ['需要加强数学练习'],
        subjectAdvice: [
          {
            subjectId: 'math',
            subjectName: '数学',
            advice: ['多做练习题', '复习基础知识'],
          },
        ],
        typeAdvice: [
          {
            type: 'choice',
            typeName: '选择题',
            advice: ['提高准确率'],
          },
        ],
        priorityTopics: [
          {
            subjectId: 'math',
            subjectName: '数学',
            topicName: '代数',
            priority: 'high' as const,
          },
        ],
      };

      performanceAggregator.generateStudyAdvice.mockResolvedValue(mockAdvice);

      const result = await service.getStudyAdvice(mockUserId, TimeRange.MONTH);

      expect(result).toEqual(mockAdvice);
      expect(performanceAggregator.generateStudyAdvice).toHaveBeenCalledWith(
        mockUserId,
        TimeRange.MONTH
      );
    });

    it('should suggest review when mistake count is high', async () => {
      const mockAdvice = {
        overallAdvice: ['错误率较高，建议复习错题'],
        subjectAdvice: [],
        typeAdvice: [],
        priorityTopics: [],
      };

      performanceAggregator.generateStudyAdvice.mockResolvedValue(mockAdvice);

      const result = await service.getStudyAdvice(mockUserId, TimeRange.MONTH);

      expect(result.overallAdvice).toBeDefined();
      expect(Array.isArray(result.overallAdvice)).toBe(true);
    });

    it('should provide positive feedback when performance is good', async () => {
      const mockAdvice = {
        overallAdvice: ['表现优秀，继续保持！'],
        subjectAdvice: [
          {
            subjectId: 'math',
            subjectName: '数学',
            advice: ['掌握良好'],
          },
        ],
        typeAdvice: [],
        priorityTopics: [],
      };

      performanceAggregator.generateStudyAdvice.mockResolvedValue(mockAdvice);

      const result = await service.getStudyAdvice(mockUserId, TimeRange.MONTH);

      expect(result.overallAdvice).toContain('表现优秀');
    });
  });
});
