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
import { User } from '../../user/entities/user.entity';
import { Subject } from '../../subject/entities/subject.entity';

@Entity('exams')
@Index(['userId', 'status'])
@Index(['userId', 'createdAt'])
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column()
  name: string;

  @Column({ type: 'json' })
  questionIds: string[];

  @Column({ type: 'json', nullable: true })
  filterConfig: {
    knowledgePoints?: string[];
    type?: string;
    difficulty?: string;
    masteryLevel?: string;
    includeMastered?: boolean;
    excludeIds?: string[];
  };

  @Column({
    type: 'enum',
    enum: ['draft', 'in-progress', 'completed', 'abandoned'],
    default: 'draft'
  })
  status: 'draft' | 'in-progress' | 'completed' | 'abandoned';

  @Column({ default: 0 })
  questionCount: number;

  @Column({ default: true })
  shuffleQuestions: boolean;

  @Column({ type: 'int', nullable: true })
  timeLimit: number; // 限时，单位：分钟

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'started_at', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;
}
