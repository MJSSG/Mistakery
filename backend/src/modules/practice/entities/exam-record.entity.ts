import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Exam } from './exam.entity';
import { ExamAnswer } from './exam-answer.entity';

@Entity('exam_records')
@Index(['userId', 'status'])
@Index(['examId'])
export class ExamRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'exam_id' })
  examId: string;

  @ManyToOne(() => Exam)
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @Column({ name: 'exam_name' })
  examName: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['draft', 'in-progress', 'completed', 'abandoned'],
    default: 'in-progress'
  })
  status: 'draft' | 'in-progress' | 'completed' | 'abandoned';

  @Column({ default: 0 })
  questionCount: number;

  @Column({ default: 0 })
  correctCount: number;

  @Column({ default: 0 })
  incorrectCount: number;

  @Column({ default: 0 })
  unansweredCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  accuracy: number;

  @Column({ type: 'int', default: 0 })
  timeSpent: number; // 总用时，单位：秒

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @OneToMany(() => ExamAnswer, answer => answer.examRecord)
  answers: ExamAnswer[];
}
