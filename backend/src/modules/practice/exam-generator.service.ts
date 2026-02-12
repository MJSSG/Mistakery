import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { CreateExamDto } from './dto/practice.dto';
import { QuestionFilterService } from './question-filter.service';

/**
 * 智能组卷服务
 * 负责根据筛选条件生成试卷
 */
@Injectable()
export class ExamGeneratorService {
  constructor(
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    private questionFilterService: QuestionFilterService,
  ) {}

  /**
   * 创建试卷（智能组卷）
   */
  async createExam(userId: string, createExamDto: CreateExamDto): Promise<Exam> {
    const { subjectId, name, filterConfig, questionCount, shuffleQuestions, timeLimit } = createExamDto;

    // 检查可用题目数量
    const availableCount = await this.questionFilterService.getAvailableCount(userId, subjectId, filterConfig);

    if (availableCount === 0) {
      throw new NotFoundException('没有找到符合条件的题目');
    }

    if (availableCount < questionCount) {
      throw new BadRequestException(
        `可用题目数量（${availableCount}）少于请求数量（${questionCount}）`,
      );
    }

    // 获取题目ID列表
    const questions = await this.questionFilterService.getRandomQuestions(
      userId,
      subjectId,
      questionCount,
      filterConfig,
    );

    const questionIds = questions.map((q) => q.id);

    // 如果需要打乱题目顺序
    if (shuffleQuestions) {
      this.shuffleArray(questionIds);
    }

    // 创建试卷记录
    const exam = this.examRepository.create({
      userId,
      subjectId,
      name,
      questionIds,
      filterConfig,
      status: 'draft',
      questionCount,
      shuffleQuestions: shuffleQuestions ?? true,
      timeLimit,
    });

    return this.examRepository.save(exam);
  }

  /**
   * 获取试卷详情
   */
  async getExamById(userId: string, examId: string): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('试卷不存在');
    }

    if (exam.userId !== userId) {
      throw new BadRequestException('无权访问此试卷');
    }

    return exam;
  }

  /**
   * 获取用户的试卷列表
   */
  async getUserExams(
    userId: string,
    options: { status?: string; page?: number; limit?: number } = {},
  ): Promise<{ data: Exam[]; total: number }> {
    const { status, page = 1, limit = 20 } = options;

    const queryBuilder = this.examRepository.createQueryBuilder('exam');

    queryBuilder.where('exam.userId = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('exam.status = :status', { status });
    }

    queryBuilder.orderBy('exam.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    queryBuilder.skip((page - 1) * limit).take(limit);

    const data = await queryBuilder.getMany();

    return { data, total };
  }

  /**
   * 删除试卷
   */
  async deleteExam(userId: string, examId: string): Promise<void> {
    const exam = await this.getExamById(userId, examId);

    // 只能删除草稿状态的试卷
    if (exam.status !== 'draft') {
      throw new BadRequestException('只能删除草稿状态的试卷');
    }

    await this.examRepository.remove(exam);
  }

  /**
   * 更新试卷状态
   */
  async updateExamStatus(examId: string, status: 'draft' | 'in-progress' | 'completed' | 'abandoned'): Promise<void> {
    await this.examRepository.update(examId, { status });
  }

  /**
   * Fisher-Yates 洗牌算法
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * 克隆试卷（创建副本）
   */
  async cloneExam(userId: string, examId: string, newName?: string): Promise<Exam> {
    const original = await this.getExamById(userId, examId);

    const cloned = this.examRepository.create({
      userId,
      subjectId: original.subjectId,
      name: newName || `${original.name} (副本)`,
      questionIds: [...original.questionIds],
      filterConfig: original.filterConfig,
      status: 'draft',
      questionCount: original.questionCount,
      shuffleQuestions: original.shuffleQuestions,
      timeLimit: original.timeLimit,
    });

    return this.examRepository.save(cloned);
  }

  /**
   * 根据历史数据推荐题目数量
   */
  async recommendQuestionCount(userId: string, subjectId: string): Promise<number> {
    const { total } = await this.getUserExams(userId, {});

    if (total === 0) {
      return 20; // 默认20题
    }

    // 计算用户平均题目数量
    const exams = await this.getUserExams(userId, { limit: 100 });
    const avgCount =
      exams.data.reduce((sum, exam) => sum + exam.questionCount, 0) / exams.data.length;

    return Math.round(avgCount);
  }
}
