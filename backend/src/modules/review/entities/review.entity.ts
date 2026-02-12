import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'mistake_id' })
  mistakeId: string;

  @Column({ type: 'int', default: 1 })
  stage: number;

  @Column({ type: 'timestamp' })
  nextReviewAt: Date;

  @Column({ type: 'enum', enum: ['pending', 'reviewed', 'skipped'], default: 'pending' })
  status: string;

  @Column({ type: 'boolean', default: false })
  isCorrect: boolean;

  @Column({ type: 'int', default: 0 })
  intervalDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  easeFactor: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
