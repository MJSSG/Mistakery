import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, MaxLength } from 'class-validator';

export class CreateMistakeDto {
  @ApiProperty({ description: '科目ID', example: 'uuid-math' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ description: '题型', enum: ['choice', 'choice-multi', 'fill', 'judge', 'essay', 'other'] })
  @IsEnum(['choice', 'choice-multi', 'fill', 'judge', 'essay', 'other'])
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: '题目内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '题目（分离后）', required: false })
  @IsString()
  @IsOptional()
  question?: string;

  @ApiProperty({ description: '选项（JSON字符串）', required: false })
  @IsString()
  @IsOptional()
  options?: string;

  @ApiProperty({ description: '正确答案' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty({ description: '用户答案', required: false })
  @IsString()
  @IsOptional()
  userAnswer?: string;

  @ApiProperty({ description: '解析' })
  @IsString()
  @IsNotEmpty()
  analysis: string;

  @ApiProperty({ description: '知识点列表', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  knowledgePoints?: string[];

  @ApiProperty({ description: '难度级别', enum: ['easy', 'medium', 'hard'], required: false })
  @IsEnum(['easy', 'medium', 'hard'])
  @IsOptional()
  difficultyLevel?: 'easy' | 'medium' | 'hard';

  @ApiProperty({ description: '来源', required: false })
  @IsString()
  @IsOptional()
  source?: string;
}

export class UpdateMistakeDto {
  @ApiProperty({ description: '题型', required: false })
  @IsEnum(['choice', 'choice-multi', 'fill', 'judge', 'essay', 'other'])
  @IsOptional()
  type?: string;

  @ApiProperty({ description: '题目内容', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: '选项（JSON字符串）', required: false })
  @IsString()
  @IsOptional()
  options?: string;

  @ApiProperty({ description: '正确答案', required: false })
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiProperty({ description: '用户答案', required: false })
  @IsString()
  @IsOptional()
  userAnswer?: string;

  @ApiProperty({ description: '解析', required: false })
  @IsString()
  @IsOptional()
  analysis?: string;

  @ApiProperty({ description: '知识点列表', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  knowledgePoints?: string[];

  @ApiProperty({ description: '难度级别', required: false })
  @IsEnum(['easy', 'medium', 'hard'])
  @IsOptional()
  difficultyLevel?: 'easy' | 'medium' | 'hard';

  @ApiProperty({ description: '来源', required: false })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ description: '标签', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class QueryMistakeDto {
  @ApiProperty({ description: '科目ID', required: false })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiProperty({ description: '题型', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: '难度级别', required: false, enum: ['easy', 'medium', 'hard'] })
  @IsEnum(['easy', 'medium', 'hard'])
  @IsOptional()
  difficultyLevel?: 'easy' | 'medium' | 'hard';

  @ApiProperty({ description: '掌握程度', required: false, enum: ['new', 'reviewing', 'reviewed', 'mastered'] })
  @IsEnum(['new', 'reviewing', 'reviewed', 'mastered'])
  @IsOptional()
  masteryLevel?: 'new' | 'reviewing' | 'reviewed' | 'mastered';

  @ApiProperty({ description: '是否收藏', required: false })
  @IsOptional()
  isFavorite?: boolean;

  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: '每页数量', required: false, default: 20 })
  @IsOptional()
  limit?: number;

  @ApiProperty({ description: '搜索关键词', required: false })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({ description: '排序方式', required: false, enum: ['recent', 'oldest', 'difficulty', 'errorCount', 'reviewCount'] })
  @IsString()
  @IsOptional()
  sortBy?: 'recent' | 'oldest' | 'difficulty' | 'errorCount' | 'reviewCount';

  @ApiProperty({ description: '错误次数', required: false })
  @IsString()
  @IsOptional()
  errorCount?: string;

  @ApiProperty({ description: '时间范围', required: false })
  @IsString()
  @IsOptional()
  timeRange?: string;
}

export class ParseMistakeDto {
  @ApiProperty({ description: '题目内容', example: '1. 下列关于...的说法，正确的是（）\nA. ...\nB. ...\nC. ...\nD. ...\n答案：A\n解析：...' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export interface ParsedMistake {
  subjectId?: string;
  type: string;
  content: string;
  question: string;
  options: string[];
  answer: string;
  analysis: string;
  knowledgePoints: string[];
  difficultyLevel: 'easy' | 'medium' | 'hard';
}

export interface MistakeListResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MistakeStatsResponse {
  total: number;
  masteredCount: number;
  familiarCount: number;
  unknownCount: number;
  favoriteCount: number;
  masteryRate: string;
  subjectStats: Array<{
    subjectId: string;
    subjectName: string;
    count: number;
  }>;
}
