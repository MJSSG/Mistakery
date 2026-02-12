import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PracticeService } from './practice.service';
import { ExamGeneratorService } from './exam-generator.service';
import { QuestionFilterService } from './question-filter.service';
import {
  CreateExamDto,
  GetAvailableCountDto,
  StartExamDto,
  SubmitAnswerDto,
  SubmitExamDto,
  QueryExamDto,
  AddNoteDto,
} from './dto/practice.dto';

@ApiTags('practice')
@Controller('practice')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PracticeController {
  constructor(
    private practiceService: PracticeService,
    private examGeneratorService: ExamGeneratorService,
    private questionFilterService: QuestionFilterService,
  ) {}

  /**
   * 获取可用题目数量
   */
  @Post('available-count')
  @ApiOperation({ summary: '获取可用题目数量' })
  async getAvailableCount(@Request() req, @Body() dto: GetAvailableCountDto) {
    const count = await this.questionFilterService.getAvailableCount(
      req.user.sub,
      dto.subjectId,
      dto.filterConfig,
    );
    return { count };
  }

  /**
   * 创建试卷（智能组卷）
   */
  @Post('exam')
  @ApiOperation({ summary: '创建试卷（智能组卷）' })
  async createExam(@Request() req, @Body() createExamDto: CreateExamDto) {
    return this.examGeneratorService.createExam(req.user.sub, createExamDto);
  }

  /**
   * 获取试卷列表
   */
  @Get('exam')
  @ApiOperation({ summary: '获取试卷列表' })
  async getExamList(@Request() req, @Query() query: QueryExamDto) {
    return this.examGeneratorService.getUserExams(req.user.sub, query);
  }

  /**
   * 获取试卷详情
   */
  @Get('exam/:id')
  @ApiOperation({ summary: '获取试卷详情' })
  async getExamById(@Request() req, @Param('id') id: string) {
    return this.examGeneratorService.getExamById(req.user.sub, id);
  }

  /**
   * 删除试卷
   */
  @Delete('exam/:id')
  @ApiOperation({ summary: '删除试卷' })
  async deleteExam(@Request() req, @Param('id') id: string) {
    await this.examGeneratorService.deleteExam(req.user.sub, id);
    return { success: true };
  }

  /**
   * 开始练习
   */
  @Post('exam/:id/start')
  @ApiOperation({ summary: '开始练习' })
  async startExam(
    @Request() req,
    @Param('id') id: string,
    @Body() startExamDto: StartExamDto,
  ) {
    return this.practiceService.startExam(req.user.sub, id, startExamDto);
  }

  /**
   * 检查练习是否超时
   */
  @Get('exam-record/:examRecordId/timeout')
  @ApiOperation({ summary: '检查练习是否超时' })
  async checkTimeout(
    @Request() req,
    @Param('examRecordId') examRecordId: string,
  ) {
    return this.practiceService.checkTimeout(examRecordId, req.user.sub);
  }

  /**
   * 提交单题答案
   */
  @Post('exam-record/:examRecordId/answer')
  @ApiOperation({ summary: '提交单题答案' })
  async submitAnswer(
    @Request() req,
    @Param('examRecordId') examRecordId: string,
    @Body() submitAnswerDto: SubmitAnswerDto,
  ) {
    return this.practiceService.submitAnswer(examRecordId, req.user.sub, submitAnswerDto);
  }

  /**
   * 获取答题进度
   */
  @Get('exam-record/:examRecordId/progress')
  @ApiOperation({ summary: '获取答题进度' })
  async getProgress(@Request() req, @Param('examRecordId') examRecordId: string) {
    return this.practiceService.getProgress(examRecordId, req.user.sub);
  }

  /**
   * 交卷
   */
  @Post('exam-record/:examRecordId/submit')
  @ApiOperation({ summary: '交卷' })
  async submitExam(
    @Request() req,
    @Param('examRecordId') examRecordId: string,
    @Body() submitExamDto: SubmitExamDto,
  ) {
    return this.practiceService.submitExam(examRecordId, req.user.sub, submitExamDto);
  }

  /**
   * 获取练习结果
   */
  @Get('exam-record/:examRecordId/result')
  @ApiOperation({ summary: '获取练习结果' })
  async getResult(@Request() req, @Param('examRecordId') examRecordId: string) {
    return this.practiceService.getResult(examRecordId, req.user.sub);
  }

  /**
   * 获取练习记录列表
   */
  @Get('exam-record')
  @ApiOperation({ summary: '获取练习记录列表' })
  async getExamRecordList(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.practiceService.getExamRecords(req.user.sub, { page, limit });
  }

  /**
   * 获取练习记录详情
   */
  @Get('exam-record/:id')
  @ApiOperation({ summary: '获取练习记录详情' })
  async getExamRecordById(@Request() req, @Param('id') id: string) {
    const result = await this.practiceService.getResult(id, req.user.sub);
    return result;
  }

  /**
   * 收藏/取消收藏题目
   */
  @Put('exam-record/:examRecordId/answer/:questionId/favorite')
  @ApiOperation({ summary: '收藏/取消收藏题目' })
  async toggleFavorite(
    @Request() req,
    @Param('examRecordId') examRecordId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.practiceService.toggleFavorite(examRecordId, questionId, req.user.sub);
  }

  /**
   * 添加笔记
   */
  @Put('exam-record/:examRecordId/answer/:questionId/note')
  @ApiOperation({ summary: '添加笔记' })
  async addNote(
    @Request() req,
    @Param('examRecordId') examRecordId: string,
    @Param('questionId') questionId: string,
    @Body() addNoteDto: AddNoteDto,
  ) {
    return this.practiceService.addNote(examRecordId, questionId, addNoteDto.note, req.user.sub);
  }
}
