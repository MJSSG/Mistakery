import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ExamRecord } from '../practice/entities/exam-record.entity';
import { ExamAnswer } from '../practice/entities/exam-answer.entity';
import { Mistake } from '../mistake/entities/mistake.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PerformanceAggregator } from './performance-aggregator.service';

@Module({
  imports: [
    JwtModule,
    TypeOrmModule.forFeature([
      ExamRecord,
      ExamAnswer,
      Mistake,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    PerformanceAggregator,
  ],
  exports: [
    AnalyticsService,
    PerformanceAggregator,
  ],
})
export class AnalyticsModule {}
