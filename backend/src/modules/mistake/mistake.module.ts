import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MistakeController } from './mistake.controller';
import { MistakeService } from './mistake.service';
import { QuestionParserService } from './question-parser.service';
import { Mistake } from './entities/mistake.entity';
import { Subject } from '../subject/entities/subject.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mistake, Subject, User]), JwtModule],
  controllers: [MistakeController],
  providers: [MistakeService, QuestionParserService],
  exports: [MistakeService],
})
export class MistakeModule {}
