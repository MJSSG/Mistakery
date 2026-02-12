import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { ExcelGeneratorService } from './excel-generator.service';
import { ExamRecord } from '../practice/entities/exam-record.entity';
import { Mistake } from '../mistake/entities/mistake.entity';
import { Review } from '../review/entities/review.entity';

@Module({
  imports: [
    JwtModule,
    TypeOrmModule.forFeature([
      ExamRecord,
      Mistake,
      Review,
    ]),
  ],
  controllers: [ExportController],
  providers: [
    ExportService,
    PdfGeneratorService,
    ExcelGeneratorService,
  ],
  exports: [ExportService],
})
export class ExportModule {}
