import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// 筛选配置
export class FilterConfigDto {
  @ApiPropertyOptional({ description: '知识点列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  knowledgePoints?: string[];

  @ApiPropertyOptional({ description: '题型', enum: ['choice', 'choice-multi', 'fill', 'judge', 'essay'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: '难度', enum: ['easy', 'medium', 'hard'] })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ description: '掌握程度', enum: ['unknown', 'familiar', 'mastered'] })
  @IsOptional()
  @IsString()
  masteryLevel?: string;

  @ApiPropertyOptional({ description: '是否包含已掌握题目' })
  @IsOptional()
  @IsBoolean()
  includeMastered?: boolean;

  @ApiPropertyOptional({ description: '排除的题目ID列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeIds?: string[];
}

// 创建试卷DTO
export class CreateExamDto {
  @ApiProperty({ description: '科目ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ description: '练习名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '筛选配置', type: FilterConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterConfigDto)
  filterConfig?: FilterConfigDto;

  @ApiProperty({ description: '题目数量', minimum: 1, maximum: 100 })
  @IsNumber()
  @Min(1)
  @Max(100)
  questionCount: number;

  @ApiPropertyOptional({ description: '是否随机题目顺序', default: true })
  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({ description: '限时（分钟），0为不限时' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeLimit?: number;
}

// 获取可用题目数量DTO
export class GetAvailableCountDto {
  @ApiProperty({ description: '科目ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiPropertyOptional({ description: '筛选配置', type: FilterConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterConfigDto)
  filterConfig?: FilterConfigDto;
}

// 开始练习DTO
export class StartExamDto {
  @ApiPropertyOptional({ description: '是否随机答案顺序', default: false })
  @IsOptional()
  @IsBoolean()
  shuffleAnswers?: boolean;
}

// 提交答案DTO
export class SubmitAnswerDto {
  @ApiProperty({ description: '题目ID' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: '用户答案' })
  @IsString()
  @IsNotEmpty()
  userAnswer: string;

  @ApiPropertyOptional({ description: '用时（秒）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpent?: number;
}

// 交卷DTO
export class SubmitExamDto {
  @ApiPropertyOptional({ description: '是否强制交卷（忽略未完成题目）' })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

// 查询试卷列表DTO
export class QueryExamDto {
  @ApiPropertyOptional({ description: '状态', enum: ['draft', 'in-progress', 'completed', 'abandoned'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '页码', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// 添加笔记DTO
export class AddNoteDto {
  @ApiProperty({ description: '笔记内容' })
  @IsString()
  @IsNotEmpty()
  note: string;
}
