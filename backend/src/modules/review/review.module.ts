import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Review } from './entities/review.entity';
import { Mistake } from '../mistake/entities/mistake.entity';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { LeitnerScheduler } from './leitner-scheduler.service';

@Module({
  imports: [
    JwtModule,
    TypeOrmModule.forFeature([
      Review,
      Mistake,
    ]),
  ],
  controllers: [ReviewController],
  providers: [
    ReviewService,
    LeitnerScheduler,
  ],
  exports: [
    ReviewService,
    LeitnerScheduler,
  ],
})
export class ReviewModule {}
