import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';
import { ExamGeneratorService } from './exam-generator.service';
import { QuestionFilterService } from './question-filter.service';
import { Exam } from './entities/exam.entity';
import { ExamRecord } from './entities/exam-record.entity';
import { ExamAnswer } from './entities/exam-answer.entity';
import { Mistake } from '../mistake/entities/mistake.entity';

@Module({
  imports: [
    JwtModule,
    TypeOrmModule.forFeature([
      Exam,
      ExamRecord,
      ExamAnswer,
      Mistake,
    ]),
  ],
  controllers: [PracticeController],
  providers: [
    PracticeService,
    ExamGeneratorService,
    QuestionFilterService,
  ],
  exports: [
    PracticeService,
    ExamGeneratorService,
    QuestionFilterService,
  ],
})
export class PracticeModule {}
