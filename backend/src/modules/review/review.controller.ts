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
import { ReviewService } from './review.service';
import { LeitnerScheduler } from './leitner-scheduler.service';
import {
  AddToReviewDto,
  StartReviewDto,
  GetReviewScheduleDto,
  GetDueReviewsDto,
  ReviewResult,
  ReviewDifficulty,
} from './dto/review.dto';

@ApiTags('review')
@Controller('review')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly leitnerScheduler: LeitnerScheduler,
  ) {}

  /**
   * 添加错题到复习队列
   */
  @Post('add')
  @ApiOperation({ summary: '添加错题到复习队列' })
  async addToReview(@Request() req, @Body() dto: AddToReviewDto) {
    return this.reviewService.addToReview(req.user.sub, dto);
  }

  /**
   * 批量添加到复习队列
   */
  @Post('add-batch')
  @ApiOperation({ summary: '批量添加错题到复习队列' })
  async batchAddToReview(
    @Request() req,
    @Body('mistakeIds') mistakeIds: string[],
    @Body('initialStage') initialStage?: number,
  ) {
    return this.reviewService.batchAddToReview(
      req.user.sub,
      mistakeIds,
      initialStage,
    );
  }

  /**
   * 获取待复习的错题
   */
  @Get('due')
  @ApiOperation({ summary: '获取待复习的错题' })
  async getDueReviews(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('subjectId') subjectId?: string,
    @Query('box') box?: number,
  ) {
    return this.reviewService.getDueReviews(req.user.sub, {
      limit: limit ? parseInt(limit.toString()) : undefined,
      subjectId,
      box,
    });
  }

  /**
   * 开始复习会话
   */
  @Post('session/start')
  @ApiOperation({ summary: '开始复习会话' })
  async startSession(
    @Request() req,
    @Body() dto: StartReviewDto,
  ) {
    return this.reviewService.startSession(req.user.sub, {
      count: dto.count,
      subjectId: dto.subjectId,
      includeNew: dto.includeNew,
    });
  }

  /**
   * 提交复习结果
   */
  @Post(':id/submit')
  @ApiOperation({ summary: '提交复习结果' })
  async submitReview(
    @Request() req,
    @Param('id') id: string,
    @Body()
    body: {
      result: ReviewResult;
      difficulty?: ReviewDifficulty;
      timeSpent?: number;
      note?: string;
    },
  ) {
    return this.reviewService.submitReview(
      req.user.sub,
      id,
      body.result,
      body.difficulty,
      body.timeSpent,
      body.note,
    );
  }

  /**
   * 跳过复习
   */
  @Put(':id/skip')
  @ApiOperation({ summary: '跳过复习' })
  async skipReview(@Request() req, @Param('id') id: string) {
    await this.reviewService.skipReview(req.user.sub, id);
    return { success: true };
  }

  /**
   * 删除复习记录
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除复习记录' })
  async removeReview(@Request() req, @Param('id') id: string) {
    await this.reviewService.removeReview(req.user.sub, id);
    return { success: true };
  }

  /**
   * 获取复习统计
   */
  @Get('statistics')
  @ApiOperation({ summary: '获取复习统计' })
  async getStatistics(@Request() req) {
    return this.reviewService.getStatistics(req.user.sub);
  }

  /**
   * 获取复习计划
   */
  @Get('schedule')
  @ApiOperation({ summary: '获取复习计划' })
  async getSchedule(
    @Request() req,
    @Query('days') days?: number,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.reviewService.getSchedule(
      req.user.sub,
      days ? parseInt(days.toString()) : 7,
      subjectId,
    );
  }

  /**
   * 获取复习历史
   */
  @Get('history')
  @ApiOperation({ summary: '获取复习历史' })
  async getHistory(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewService.getHistory(
      req.user.sub,
      page ? parseInt(page.toString()) : 1,
      limit ? parseInt(limit.toString()) : 20,
    );
  }

  /**
   * 获取 Leitner 箱子配置
   */
  @Get('boxes')
  @ApiOperation({ summary: '获取 Leitner 箱子配置' })
  async getBoxes() {
    return this.leitnerScheduler.getAllBoxes();
  }

  /**
   * 预测复习负荷
   */
  @Get('predict')
  @ApiOperation({ summary: '预测未来复习负荷' })
  async predictLoad(
    @Request() req,
    @Query('days') days?: number,
  ) {
    // TODO: 实现负荷预测
    const daysToPredict = days ? parseInt(days.toString()) : 7;
    return {
      message: '负荷预测功能开发中',
      days: daysToPredict,
    };
  }
}
