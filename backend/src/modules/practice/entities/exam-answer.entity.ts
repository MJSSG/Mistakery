import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ExamRecord } from './exam-record.entity';
import { Mistake } from '../../mistake/entities/mistake.entity';

@Entity('exam_answers')
@Index(['examRecordId'])
@Index(['questionId'])
export class ExamAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'exam_record_id' })
  examRecordId: string;

  @ManyToOne(() => ExamRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_record_id' })
  examRecord: ExamRecord;

  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => Mistake)
  @JoinColumn({ name: 'question_id' })
  question: Mistake;

  @Column({ type: 'text', nullable: true })
  userAnswer: string;

  @Column({ type: 'text', nullable: true })
  correctAnswer: string;

  @Column({ type: 'boolean', nullable: true })
  isCorrect: boolean;

  @Column({ type: 'int', default: 0 })
  timeSpent: number; // 本题用时，单位：秒

  @Column({ type: 'boolean', default: false })
  isFavorite: boolean;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'answered_at', nullable: true })
  answeredAt: Date;
}
