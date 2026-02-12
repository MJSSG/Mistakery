import { IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
}

export enum TimeRange {
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  ALL = 'all',
}

export enum Orientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

export class ExportDto {
  @ApiProperty({ enum: ExportFormat, description: '导出格式' })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({ enum: TimeRange, description: '时间范围', required: false })
  @IsEnum(TimeRange)
  @IsOptional()
  timeRange?: TimeRange = TimeRange.MONTH;

  @ApiProperty({ enum: Orientation, description: '页面方向 (PDF)', required: false })
  @IsEnum(Orientation)
  @IsOptional()
  orientation?: Orientation = Orientation.PORTRAIT;

  @ApiProperty({ description: '包含的章节', required: false, type: [String] })
  @IsArray()
  @IsOptional()
  includeSections?: string[] = ['overview', 'trends', 'subjects', 'details', 'advice'];

  @ApiProperty({ description: '是否包含图表 (Excel)', required: false })
  @IsOptional()
  includeCharts?: boolean = true;
}

export interface ExportData {
  overview: {
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    accuracy: number;
    totalTime: number;
    studyDays: number;
    avgDailyTime: number;
    subjectStats: Array<{
      subject: string;
      count: number;
      accuracy: number;
    }>;
  };
  trends: Array<{
    date: string;
    studyTime: number;
    questionsCount: number;
    accuracy: number;
  }>;
  subjects: Array<{
    subject: string;
    total: number;
    mastered: number;
    accuracy: number;
    avgTime: number;
  }>;
  details: Array<{
    date: string;
    subject: string;
    questionsCount: number;
    correctCount: number;
    wrongCount: number;
    accuracy: number;
    timeSpent: number;
  }>;
  advice: Array<{
    type: string;
    title: string;
    message: string;
  }>;
}
