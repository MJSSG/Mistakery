import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubjectService } from './subject.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@ApiTags('subject')
@Controller('subjects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  @ApiOperation({ summary: '获取科目列表' })
  async findAll(@Request() req) {
    return this.subjectService.findAll(req.user.sub);
  }

  @Get('default')
  @ApiOperation({ summary: '获取默认科目列表' })
  async findDefault() {
    return this.subjectService.findDefault();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取科目详情' })
  async findOne(@Param('id') id: string) {
    return this.subjectService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建科目' })
  async create(@Request() req, @Body() createDto: CreateSubjectDto) {
    return this.subjectService.create(req.user.sub, createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新科目' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateSubjectDto) {
    return this.subjectService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除科目' })
  async remove(@Param('id') id: string) {
    return this.subjectService.remove(id);
  }
}
