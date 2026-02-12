import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import {
  GetStatisticsDto,
  GetTrendsDto,
  GetSubjectStatsDto,
  GetDetailReportDto,
  TimeRange,
  SortBy,
  SortOrder,
} from './dto/analytics.dto';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * 获取统计概览
   */
  @Get('overview')
  @ApiOperation({ summary: '获取统计概览' })
  async getOverview(
    @Request() req,
    @Query('timeRange') timeRange?: TimeRange,
  ) {
    const range = timeRange || TimeRange.ALL;
    return this.analyticsService.getStatisticsOverview(req.user.sub, range);
  }

  /**
   * 获取科目统计
   */
  @Get('subjects')
  @ApiOperation({ summary: '获取科目统计' })
  async getSubjectStats(
    @Request() req,
    @Query('timeRange') timeRange?: TimeRange,
  ) {
    const range = timeRange || TimeRange.MONTH;
    return this.analyticsService.getSubjectStatistics(req.user.sub, range);
  }

  /**
   * 获取趋势数据
   */
  @Get('trends')
  @ApiOperation({ summary: '获取学习趋势' })
  async getTrends(
    @Request() req,
    @Query('timeRange') timeRange?: TimeRange,
    @Query('intervalDays') intervalDays?: number,
    @Query('subjectId') subjectId?: string,
  ) {
    const range = timeRange || TimeRange.MONTH;
    const interval = intervalDays ? parseInt(intervalDays.toString()) : 7;
    return this.analyticsService.getTrends(
      req.user.sub,
      range,
      interval,
      subjectId,
    );
  }

  /**
   * 获取详细报告
   */
  @Get('detail')
  @ApiOperation({ summary: '获取详细报告' })
  async getDetailReport(
    @Request() req,
    @Query('timeRange') timeRange?: TimeRange,
    @Query('sortBy') sortBy?: SortBy,
    @Query('sortOrder') sortOrder?: SortOrder,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const range = timeRange || TimeRange.MONTH;
    const sort = sortBy || SortBy.DATE;
    const order = sortOrder || SortOrder.DESC;
    const pageNum = page ? parseInt(page.toString()) : 1;
    const limitNum = limit ? parseInt(limit.toString()) : 20;

    return this.analyticsService.getDetailReport(
      req.user.sub,
      range,
      sort,
      order,
      pageNum,
      limitNum,
    );
  }

  /**
   * 获取学习建议
   */
  @Get('advice')
  @ApiOperation({ summary: '获取学习建议' })
  async getStudyAdvice(
    @Request() req,
    @Query('timeRange') timeRange?: TimeRange,
  ) {
    const range = timeRange || TimeRange.MONTH;
    return this.analyticsService.getStudyAdvice(req.user.sub, range);
  }
}
