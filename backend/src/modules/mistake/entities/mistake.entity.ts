import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Subject } from '../../subject/entities/subject.entity';

@Entity('mistakes')
export class Mistake {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.mistakes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @ManyToOne(() => Subject, (subject) => subject.mistakes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({
    type: 'enum',
    enum: ['choice', 'choice-multi', 'fill', 'judge', 'essay', 'other'],
    default: 'choice',
  })
  type: string;

  @Column('text')
  content: string;

  @Column('text', { nullable: true })
  question: string;

  @Column('text', { nullable: true })
  options: string;

  @Column({ length: 50, nullable: true })
  answer: string;

  @Column('text', { nullable: true })
  userAnswer: string;

  @Column('text')
  analysis: string;

  @Column({ name: 'knowledge_points', type: 'json', nullable: true })
  knowledgePoints: string[];

  @Column({ name: 'difficulty_level', type: 'enum', enum: ['easy', 'medium', 'hard'], default: 'medium' })
  difficultyLevel: string;

  @Column({ name: 'mastery_level', type: 'enum', enum: ['unknown', 'familiar', 'mastered'], default: 'unknown' })
  masteryLevel: string;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'int', default: 0 })
  correctCount: number;

  @Column({ name: 'last_review_at', nullable: true })
  lastReviewAt: Date;

  @Column({ name: 'next_review_at', nullable: true })
  nextReviewAt: Date;

  @Column({ name: 'source', length: 50, nullable: true })
  source: string;

  @Column({ name: 'is_favorite', type: 'boolean', default: false })
  isFavorite: boolean;

  @Column({ name: 'tags', type: 'json', nullable: true })
  tags: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
