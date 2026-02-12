import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
// Import entities directly
import { User } from '../modules/user/entities/user.entity';
import { Mistake } from '../modules/mistake/entities/mistake.entity';
import { Subject } from '../modules/subject/entities/subject.entity';
import { Review } from '../modules/review/entities/review.entity';
import { Practice } from '../modules/practice/entities/practice.entity';
import { Exam } from '../modules/practice/entities/exam.entity';
import { ExamRecord } from '../modules/practice/entities/exam-record.entity';
import { ExamAnswer } from '../modules/practice/entities/exam-answer.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 3306,
        username: configService.get('DB_USERNAME') || 'root',
        password: configService.get('DB_PASSWORD') || '',
        database: configService.get('DB_NAME') || 'mistakery',
        entities: [User, Mistake, Subject, Review, Practice, Exam, ExamRecord, ExamAnswer],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        charset: 'utf8mb4',
        extra: {
          connectionLimit: 10,
        },
        retryAttempts: 3,
        retryDelay: 3000,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
