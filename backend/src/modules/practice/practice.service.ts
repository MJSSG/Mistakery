import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { ExamRecord } from './entities/exam-record.entity';
import { ExamAnswer } from './entities/exam-answer.entity';
import { Mistake } from '../mistake/entities/mistake.entity';
import { StartExamDto, SubmitAnswerDto, SubmitExamDto } from './dto/practice.dto';
import { ExamGeneratorService } from './exam-generator.service';
import { QuestionFilterService } from './question-filter.service';

/**
 * 练习服务
 * 负责处理练习流程（开始、答题、交卷等）
 */
@Injectable()
export class PracticeService {
  constructor(
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    @InjectRepository(ExamRecord)
    private examRecordRepository: Repository<ExamRecord>,
    @InjectRepository(ExamAnswer)
    private examAnswerRepository: Repository<ExamAnswer>,
    @InjectRepository(Mistake)
    private mistakeRepository: Repository<Mistake>,
    private examGeneratorService: ExamGeneratorService,
    private questionFilterService: QuestionFilterService,
  ) {}

  /**
   * 开始练习
   */
  async startExam(userId: string, examId: string, startExamDto: StartExamDto) {
    // 获取试卷
    const exam = await this.examGeneratorService.getExamById(userId, examId);

    // 检查是否已有进行中的记录
    const existingRecord = await this.examRecordRepository.findOne({
      where: { examId, userId, status: 'in-progress' },
    });

    if (existingRecord) {
      // 返回现有记录和题目
      const answers = await this.examAnswerRepository.find({
        where: { examRecordId: existingRecord.id },
      });

      const questions = await this.mistakeRepository.find({
        where: { id: In(exam.questionIds) },
      });

      return {
        examRecordId: existingRecord.id,
        questions: this.shuffleAnswersIfNeeded(questions, startExamDto.shuffleAnswers),
        isResume: true,
      };
    }

    // 获取题目
    const questions = await this.mistakeRepository.find({
      where: { id: In(exam.questionIds) },
    });

    if (questions.length !== exam.questionIds.length) {
      throw new BadRequestException('部分题目已不存在');
    }

    // 创建练习记录
    const examRecord = this.examRecordRepository.create({
      examId,
      examName: exam.name,
      userId,
      status: 'in-progress',
      questionCount: exam.questionCount,
      correctCount: 0,
      incorrectCount: 0,
      unansweredCount: exam.questionCount,
      accuracy: 0,
      timeSpent: 0,
      startedAt: new Date(),
    });

    const savedRecord = await this.examRecordRepository.save(examRecord);

    // 更新试卷状态
    await this.examGeneratorService.updateExamStatus(examId, 'in-progress');

    return {
      examRecordId: savedRecord.id,
      questions: this.shuffleAnswersIfNeeded(questions, startExamDto.shuffleAnswers),
      isResume: false,
    };
  }

  /**
   * 提交单题答案
   */
  async submitAnswer(examRecordId: string, userId: string, submitAnswerDto: SubmitAnswerDto) {
    const { questionId, userAnswer, timeSpent = 0 } = submitAnswerDto;

    // 获取练习记录
    const examRecord = await this.examRecordRepository.findOne({
      where: { id: examRecordId, userId },
    });

    if (!examRecord) {
      throw new NotFoundException('练习记录不存在');
    }

    if (examRecord.status !== 'in-progress') {
      throw new BadRequestException('练习已结束，无法提交答案');
    }

    // 获取题目
    const question = await this.mistakeRepository.findOne({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('题目不存在');
    }

    // 检查是否已经提交过答案
    const existingAnswer = await this.examAnswerRepository.findOne({
      where: { examRecordId, questionId },
    });

    // 判断答案是否正确
    const isCorrect = this.checkAnswer(question, userAnswer);

    // 创建或更新答案记录
    let answer: ExamAnswer;

    if (existingAnswer) {
      // 更新已有答案
      const oldIsCorrect = existingAnswer.isCorrect;
      existingAnswer.userAnswer = userAnswer;
      existingAnswer.isCorrect = isCorrect;
      existingAnswer.timeSpent = timeSpent;
      existingAnswer.answeredAt = new Date();

      answer = await this.examAnswerRepository.save(existingAnswer);

      // 更新统计（如果有变化）
      if (oldIsCorrect !== isCorrect) {
        await this.updateExamRecordStats(examRecord);
      }
    } else {
      // 创建新答案
      answer = this.examAnswerRepository.create({
        examRecordId,
        questionId,
        userAnswer,
        correctAnswer: question.answer,
        isCorrect,
        timeSpent,
        answeredAt: new Date(),
      });

      answer = await this.examAnswerRepository.save(answer);

      // 更新统计
      await this.updateExamRecordStats(examRecord);
    }

    return answer;
  }

  /**
   * 获取答题进度
   */
  async getProgress(examRecordId: string, userId: string) {
    const examRecord = await this.examRecordRepository.findOne({
      where: { id: examRecordId, userId },
    });

    if (!examRecord) {
      throw new NotFoundException('练习记录不存在');
    }

    const answers = await this.examAnswerRepository.find({
      where: { examRecordId },
    });

    return {
      answeredCount: answers.filter((a) => a.userAnswer).length,
      totalCount: examRecord.questionCount,
      answers,
    };
  }

  /**
   * 交卷
   */
  async submitExam(examRecordId: string, userId: string, submitExamDto: SubmitExamDto) {
    const examRecord = await this.examRecordRepository.findOne({
      where: { id: examRecordId, userId },
    });

    if (!examRecord) {
      throw new NotFoundException('练习记录不存在');
    }

    if (examRecord.status !== 'in-progress') {
      throw new BadRequestException('练习已结束');
    }

    // 检查是否有未完成题目
    const { answeredCount, totalCount } = await this.getProgress(examRecordId, userId);

    if (answeredCount < totalCount && !submitExamDto.force) {
      throw new BadRequestException(
        `还有 ${totalCount - answeredCount} 道题未完成，请确认后再交卷`,
      );
    }

    // 更新练习记录状态
    examRecord.status = 'completed';
    examRecord.completedAt = new Date();

    // 计算总用时
    const answers = await this.examAnswerRepository.find({
      where: { examRecordId },
    });

    examRecord.timeSpent = answers.reduce((sum, a) => sum + a.timeSpent, 0);

    await this.examRecordRepository.save(examRecord);

    // 更新试卷状态
    await this.examGeneratorService.updateExamStatus(examRecord.examId, 'completed');

    // 返回结果
    return this.getResult(examRecordId, userId);
  }

  /**
   * 获取练习结果
   */
  async getResult(examRecordId: string, userId: string) {
    const examRecord = await this.examRecordRepository.findOne({
      where: { id: examRecordId, userId },
    });

    if (!examRecord) {
      throw new NotFoundException('练习记录不存在');
    }

    const answers = await this.examAnswerRepository.find({
      where: { examRecordId },
      relations: ['question'],
    });

    // 获取题目信息
    const questionIds = answers.map((a) => a.questionId);
    const questions = await this.mistakeRepository.find({
      where: { id: In(questionIds) },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // 统计分析
    const statistics = this.calculateStatistics(answers, questionMap);

    // 生成建议
    const recommendations = this.generateRecommendations(statistics);

    return {
      examRecord,
      answers: answers.map((a) => ({
        ...a,
        question: questionMap.get(a.questionId),
      })),
      statistics,
      recommendations,
    };
  }

  /**
   * 收藏/取消收藏题目
   */
  async toggleFavorite(examRecordId: string, questionId: string, userId: string) {
    const answer = await this.examAnswerRepository.findOne({
      where: { examRecordId, questionId },
    });

    if (!answer) {
      throw new NotFoundException('答案记录不存在');
    }

    answer.isFavorite = !answer.isFavorite;
    return this.examAnswerRepository.save(answer);
  }

  /**
   * 添加笔记
   */
  async addNote(examRecordId: string, questionId: string, note: string, userId: string) {
    const answer = await this.examAnswerRepository.findOne({
      where: { examRecordId, questionId },
    });

    if (!answer) {
      throw new NotFoundException('答案记录不存在');
    }

    answer.note = note;
    return this.examAnswerRepository.save(answer);
  }

  /**
   * 获取练习记录列表
   */
  async getExamRecords(userId: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = options;

    const queryBuilder = this.examRecordRepository.createQueryBuilder('record');

    queryBuilder.where('record.userId = :userId', { userId });
    queryBuilder.orderBy('record.startedAt', 'DESC');

    const total = await queryBuilder.getCount();

    queryBuilder.skip((page - 1) * limit).take(limit);

    const data = await queryBuilder.getMany();

    return { data, total };
  }

  /**
   * 检查练习是否超时
   * 如果超时，自动交卷并返回结果；否则返回剩余时间
   */
  async checkTimeout(examRecordId: string, userId: string) {
    const examRecord = await this.examRecordRepository.findOne({
      where: { id: examRecordId, userId },
    });

    if (!examRecord) {
      throw new NotFoundException('练习记录不存在');
    }

    if (examRecord.status !== 'in-progress') {
      throw new BadRequestException('练习已结束');
    }

    // 获取试卷信息
    const exam = await this.examRepository.findOne({
      where: { id: examRecord.examId },
    });

    if (!exam || !exam.timeLimit) {
      // 没有设置限时
      return { hasTimeout: false, remainingTime: null };
    }

    // 计算已用时间（秒）
    const elapsed = Math.floor((Date.now() - examRecord.startedAt.getTime()) / 1000);
    const timeLimitSeconds = exam.timeLimit * 60;

    if (elapsed >= timeLimitSeconds) {
      // 已超时，自动交卷
      return {
        hasTimeout: true,
        remainingTime: 0,
        result: await this.submitExam(examRecordId, userId, { force: true }),
      };
    }

    // 未超时，返回剩余时间
    return {
      hasTimeout: false,
      remainingTime: timeLimitSeconds - elapsed,
    };
  }

  /**
   * 检查所有进行中的练习是否有超时
   * 可以通过定时任务调用此方法
   */
  async checkAllTimeouts() {
    // 查找所有进行中的练习记录
    const inProgressRecords = await this.examRecordRepository.find({
      where: { status: 'in-progress' },
      relations: ['exam'],
    });

    const timeoutResults = [];

    for (const record of inProgressRecords) {
      if (!record.exam || !record.exam.timeLimit) {
        continue;
      }

      const elapsed = Math.floor((Date.now() - record.startedAt.getTime()) / 1000);
      const timeLimitSeconds = record.exam.timeLimit * 60;

      if (elapsed >= timeLimitSeconds) {
        // 超时，自动交卷
        try {
          const result = await this.submitExam(record.id, record.userId, { force: true });
          timeoutResults.push({
            examRecordId: record.id,
            userId: record.userId,
            elapsed,
            timeLimit: record.exam.timeLimit,
            result,
          });
        } catch (error) {
          console.error(`Failed to auto-submit exam ${record.id}:`, error);
        }
      }
    }

    return timeoutResults;
  }

  /**
   * 判断答案是否正确
   */
  private checkAnswer(question: Mistake, userAnswer: string): boolean | null {
    const correctAnswer = question.answer?.trim().toLowerCase();
    const answer = userAnswer.trim().toLowerCase();

    if (!correctAnswer) {
      return null;
    }

    // 多选题需要完全匹配
    if (question.type === 'choice-multi') {
      return answer === correctAnswer;
    }

    // 判断题
    if (question.type === 'judge') {
      const judgeMap: Record<string, string> = {
        '对': 'true',
        '错': 'false',
        '√': 'true',
        '×': 'false',
        '✓': 'true',
        'true': 'true',
        'false': 'false',
        't': 'true',
        'f': 'false',
      };
      const normalizedJudge = judgeMap[answer] || answer;
      const normalizedCorrect = judgeMap[correctAnswer] || correctAnswer;
      return normalizedJudge === normalizedCorrect;
    }

    // 单选题精确匹配
    if (question.type === 'choice') {
      return answer === correctAnswer || answer === correctAnswer.replace(/[^\w]/g, '');
    }

    // 填空题和解答题模糊匹配（忽略大小写和空格）
    const normalizedAnswer = answer.replace(/\s+/g, '');
    const normalizedCorrect = correctAnswer.replace(/\s+/g, '');
    return normalizedAnswer === normalizedCorrect;
  }

  /**
   * 更新练习记录统计
   */
  private async updateExamRecordStats(examRecord: ExamRecord) {
    const answers = await this.examAnswerRepository.find({
      where: { examRecordId: examRecord.id },
    });

    const answered = answers.filter((a) => a.userAnswer);
    const correct = answered.filter((a) => a.isCorrect === true);
    const incorrect = answered.filter((a) => a.isCorrect === false);

    examRecord.correctCount = correct.length;
    examRecord.incorrectCount = incorrect.length;
    examRecord.unansweredCount = examRecord.questionCount - answered.length;
    examRecord.accuracy = answered.length > 0 ? (correct.length / answered.length) * 100 : 0;

    await this.examRecordRepository.save(examRecord);
  }

  /**
   * 计算统计数据
   */
  private calculateStatistics(answers: ExamAnswer[], questionMap: Map<string, Mistake>) {
    const totalQuestions = answers.length;
    const correctCount = answers.filter((a) => a.isCorrect === true).length;
    const incorrectCount = answers.filter((a) => a.isCorrect === false).length;
    const unansweredCount = answers.filter((a) => !a.userAnswer).length;
    const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    const totalTimeSpent = answers.reduce((sum, a) => sum + a.timeSpent, 0);
    const averageTimePerQuestion = totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0;

    // 按科目统计
    const subjectStats = new Map<string, { correctCount: number; totalCount: number }>();

    // 按难度统计
    const difficultyStats = new Map<string, { correctCount: number; totalCount: number }>();

    // 按题型统计
    const typeStats = new Map<string, { correctCount: number; totalCount: number }>();

    answers.forEach((answer) => {
      const question = questionMap.get(answer.questionId);
      if (!question) return;

      // 科目统计
      const subjectId = question.subjectId;
      if (!subjectStats.has(subjectId)) {
        subjectStats.set(subjectId, { correctCount: 0, totalCount: 0 });
      }
      const subjectStat = subjectStats.get(subjectId)!;
      subjectStat.totalCount++;
      if (answer.isCorrect === true) {
        subjectStat.correctCount++;
      }

      // 难度统计
      const difficulty = question.difficultyLevel;
      if (!difficultyStats.has(difficulty)) {
        difficultyStats.set(difficulty, { correctCount: 0, totalCount: 0 });
      }
      const difficultyStat = difficultyStats.get(difficulty)!;
      difficultyStat.totalCount++;
      if (answer.isCorrect === true) {
        difficultyStat.correctCount++;
      }

      // 题型统计
      const type = question.type;
      if (!typeStats.has(type)) {
        typeStats.set(type, { correctCount: 0, totalCount: 0 });
      }
      const typeStat = typeStats.get(type)!;
      typeStat.totalCount++;
      if (answer.isCorrect === true) {
        typeStat.correctCount++;
      }
    });

    return {
      totalQuestions,
      correctCount,
      incorrectCount,
      unansweredCount,
      accuracy: parseFloat(accuracy.toFixed(2)),
      averageTimePerQuestion: parseFloat(averageTimePerQuestion.toFixed(2)),
      totalTimeSpent,
      subjectStats: Array.from(subjectStats.entries()).map(([subjectId, stats]) => ({
        subjectId,
        subjectName: questionMap.get(answers.find((a) => questionMap.get(a.questionId)?.subjectId === subjectId)!.questionId!)?.subjectId || subjectId,
        correctCount: stats.correctCount,
        totalCount: stats.totalCount,
        accuracy: parseFloat(((stats.correctCount / stats.totalCount) * 100).toFixed(2)),
      })),
      difficultyStats: Array.from(difficultyStats.entries()).map(([difficulty, stats]) => ({
        difficulty,
        correctCount: stats.correctCount,
        totalCount: stats.totalCount,
        accuracy: parseFloat(((stats.correctCount / stats.totalCount) * 100).toFixed(2)),
      })),
      typeStats: Array.from(typeStats.entries()).map(([type, stats]) => ({
        type,
        correctCount: stats.correctCount,
        totalCount: stats.totalCount,
        accuracy: parseFloat(((stats.correctCount / stats.totalCount) * 100).toFixed(2)),
      })),
    };
  }

  /**
   * 生成学习建议
   */
  private generateRecommendations(statistics: any): string[] {
    const recommendations: string[] = [];

    const { accuracy, difficultyStats, typeStats } = statistics;

    // 准确率建议
    if (accuracy >= 90) {
      recommendations.push('太棒了！你的正确率非常高，继续保持！');
    } else if (accuracy >= 70) {
      recommendations.push('你的表现不错，但还有提升空间，重点关注错题。');
    } else if (accuracy >= 50) {
      recommendations.push('建议复习相关知识点，多加练习巩固。');
    } else {
      recommendations.push('建议从基础题目开始，先掌握核心概念。');
    }

    // 难度建议
    const hardAccuracy = difficultyStats.find((s: any) => s.difficulty === 'hard')?.accuracy || 0;
    if (hardAccuracy < 50) {
      recommendations.push('困难题准确率较低，建议先巩固中等难度题目。');
    }

    // 题型建议
    const typeAccuracyMap = new Map<string, number>(typeStats.map((s: any) => [s.type, s.accuracy]));
    const weakTypes = Array.from(typeAccuracyMap.entries())
      .filter(([_, accuracy]: [string, number]) => accuracy < 60)
      .map(([type]) => type);

    if (weakTypes.length > 0) {
      const typeNames: Record<string, string> = {
        choice: '单选题',
        'choice-multi': '多选题',
        fill: '填空题',
        judge: '判断题',
        essay: '解答题',
      };
      const weakTypeNames = weakTypes.map((t) => typeNames[t] || t).join('、');
      recommendations.push(`${weakTypeNames}准确率较低，建议针对性练习。`);
    }

    return recommendations;
  }

  /**
   * 根据需要打乱答案顺序
   */
  private shuffleAnswersIfNeeded(questions: Mistake[], shuffleAnswers?: boolean): Mistake[] {
    if (!shuffleAnswers) {
      return questions;
    }

    return questions.map((question) => {
      if (!question.options || question.type !== 'choice') {
        return question;
      }

      // 解析选项
      const options = question.options.split('\n').filter((o) => o.trim());

      // 打乱选项
      const shuffled = this.shuffleArray(options.map((o, i) => ({ original: o, index: i })));

      // 重新组合
      question.options = shuffled.map((s) => s.original).join('\n');

      return question;
    });
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
}
