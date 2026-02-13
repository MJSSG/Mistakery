import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Mistake } from '../../mistake/entities/mistake.entity';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, nullable: true, unique: true })
  code: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  color: string;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ name: 'mistake_count', type: 'int', default: 0 })
  mistakeCount: number;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  // 科目分类：politics(政治理论)、general(常识判断)、verbal(言语理解)、reasoning(判断推理)、quantitative(数量关系)
  @Column({ name: 'category', nullable: true })
  category: string;

  // 父科目ID，用于层级分类
  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @ManyToOne(() => Subject, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Subject;

  @OneToMany(() => Subject, (subject) => subject.parent)
  children: Subject[];

  @OneToMany(() => Mistake, (mistake) => mistake.subject)
  mistakes: Mistake[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
