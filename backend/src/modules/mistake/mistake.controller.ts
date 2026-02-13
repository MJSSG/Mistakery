import { Controller, Post, Body, Get, Put, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MistakeService } from './mistake.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateMistakeDto, UpdateMistakeDto, QueryMistakeDto, ParseMistakeDto } from './dto/mistake.dto';

@ApiTags('mistake')
@Controller('mistake')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MistakeController {
  constructor(private readonly mistakeService: MistakeService) {}

  @Post('parse')
  @ApiOperation({ summary: '智能解析题目内容' })
  async parse(@Body() parseDto: ParseMistakeDto) {
    return this.mistakeService.parseContent(parseDto.content);
  }

  @Post('save')
  @ApiOperation({ summary: '保存解析后的错题' })
  async save(@Request() req, @Body() createDto: CreateMistakeDto) {
    return this.mistakeService.create(req.user.sub, createDto);
  }

  @Post('parse-and-save')
  @ApiOperation({ summary: '解析并保存错题（一步完成）' })
  async parseAndSave(@Request() req, @Body() parseDto: ParseMistakeDto) {
    return this.mistakeService.parseAndSave(req.user.sub, parseDto.content);
  }

  @Get()
  @ApiOperation({ summary: '获取错题列表' })
  async findAll(@Request() req, @Query() query: QueryMistakeDto) {
    return this.mistakeService.findAll(req.user.sub, query);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: '获取错题统计概览' })
  async getStatsOverview(@Request() req) {
    return this.mistakeService.getStatsOverview(req.user.sub);
  }

  @Get('stats/subject/:subjectId')
  @ApiOperation({ summary: '获取科目知识点统计' })
  async getStatsBySubject(@Request() req, @Param('subjectId') subjectId: string) {
    return this.mistakeService.getStatsBySubject(req.user.sub, subjectId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取错题详情' })
  async findOne(@Param('id') id: string) {
    return this.mistakeService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新错题' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateMistakeDto) {
    return this.mistakeService.update(id, updateDto);
  }

  @Put(':id/mastery')
  @ApiOperation({ summary: '更新掌握程度' })
  async updateMastery(@Param('id') id: string, @Body('masteryLevel') masteryLevel: string) {
    return this.mistakeService.updateMastery(id, masteryLevel);
  }

  @Put(':id/favorite')
  @ApiOperation({ summary: '切换收藏状态' })
  async toggleFavorite(@Param('id') id: string) {
    return this.mistakeService.toggleFavorite(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除错题' })
  async remove(@Param('id') id: string) {
    return this.mistakeService.remove(id);
  }

  @Post('batch-delete')
  @ApiOperation({ summary: '批量删除错题' })
  async batchRemove(@Body('ids') ids: string[]) {
    return this.mistakeService.batchRemove(ids);
  }
}
