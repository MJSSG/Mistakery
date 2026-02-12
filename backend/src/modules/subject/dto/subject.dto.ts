import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({ description: '科目名称', example: '数学' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: '科目图标', example: '📐', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  icon?: string;

  @ApiProperty({ description: '科目颜色', example: '#1890ff', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  @ApiProperty({ description: '科目描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSubjectDto {
  @ApiProperty({ description: '科目名称', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiProperty({ description: '科目图标', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  icon?: string;

  @ApiProperty({ description: '科目颜色', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  @ApiProperty({ description: '科目描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
