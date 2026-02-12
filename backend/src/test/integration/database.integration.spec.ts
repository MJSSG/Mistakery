import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getConnection } from 'typeorm';
import { Mistake } from '../../modules/mistake/entities/mistake.entity';
import { User } from '../../modules/user/entities/user.entity';
import { Subject } from '../../modules/subject/entities/subject.entity';
import { ExamRecord } from '../../modules/practice/entities/exam-record.entity';

describe('Database Integration Tests', () => {
  let connection: any;

  beforeAll(async () => {
    // Initialize test database connection
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '3306'),
          username: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || 'password',
          database: process.env.DB_NAME || 'mistakery_test',
          entities: [Mistake, User, Subject, ExamRecord],
          synchronize: true, // Auto-create tables for testing
          logging: false,
        }),
      ],
    }).compile();

    connection = module.get('TypeOrmModule');
    await connection.initialize();
  });

  afterAll(async () => {
    await connection.close();
  });

  afterEach(async () => {
    // Clean up all tables after each test
    const entities = connection.options.entities;
    await getConnection().query(`SET FOREIGN_KEY_CHECKS = 0`);

    for (const entity of entities) {
      const repository = connection.getRepository(entity);
      await repository.clear();
    }

    await getConnection().query(`SET FOREIGN_KEY_CHECKS = 1`);
  });

  describe('User Entity', () => {
    it('should create and retrieve a user', async () => {
      const repository = connection.getRepository(User);

      const user = repository.create({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        nickname: 'Test User',
      });

      const savedUser = await repository.save(user);

      expect(savedUser).toHaveProperty('id');
      expect(savedUser.username).toBe('testuser');

      // Retrieve user
      const foundUser = await repository.findOne({
        where: { id: savedUser.id },
      });

      expect(foundUser).toBeDefined();
      expect(foundUser!.username).toBe('testuser');
    });

    it('should enforce unique username constraint', async () => {
      const repository = connection.getRepository(User);

      // Create first user
      await repository.save({
        username: 'duplicate',
        email: 'user1@example.com',
        passwordHash: 'hash1',
      });

      // Try to create second user with same username
      const duplicateUser = repository.create({
        username: 'duplicate',
        email: 'user2@example.com',
        passwordHash: 'hash2',
      });

      await expect(repository.save(duplicateUser)).rejects.toThrow();
    });

    it('should update user fields', async () => {
      const repository = connection.getRepository(User);

      const user = await repository.save({
        username: 'updatetest',
        email: 'update@example.com',
        passwordHash: 'hash',
      });

      user.nickname = 'Updated Nickname';
      user.targetExam = 'gaokao';

      const updatedUser = await repository.save(user);

      expect(updatedUser.nickname).toBe('Updated Nickname');
      expect(updatedUser.targetExam).toBe('gaokao');
    });
  });

  describe('Mistake Entity', () => {
    it('should create a mistake with relations', async () => {
      const mistakeRepository = connection.getRepository(Mistake);
      const userRepository = connection.getRepository(User);

      // First create a user
      const user = await userRepository.save({
        username: 'mistakeuser',
        email: 'mistake@example.com',
        passwordHash: 'hash',
      });

      // Create mistake
      const mistake = mistakeRepository.create({
        userId: user.id,
        subject: '数学',
        questionText: '1+1=?',
        questionType: 'single',
        options: ['A.1', 'B.2', 'C.3', 'D.4'],
        correctAnswer: 'A',
        analysis: '1+1=2',
        difficulty: 'easy',
        status: 'new',
        knowledgePoints: ['加法'],
        timeSpent: 30,
      });

      const savedMistake = await mistakeRepository.save(mistake);

      expect(savedMistake).toHaveProperty('id');
      expect(savedMistake.userId).toBe(user.id);
      expect(savedMistake.subject).toBe('数学');
    });

    it('should support JSON fields (options, knowledgePoints)', async () => {
      const mistakeRepository = connection.getRepository(Mistake);
      const userRepository = connection.getRepository(User);

      const user = await userRepository.save({
        username: 'jsontest',
        email: 'json@example.com',
        passwordHash: 'hash',
      });

      const mistake = await mistakeRepository.save({
        userId: user.id,
        subject: '物理',
        questionText: 'JSON测试',
        questionType: 'multiple',
        options: ['A.选项1', 'B.选项2', 'C.选项3', 'D.选项4'],
        correctAnswer: 'A,B',
        analysis: '解析',
        difficulty: 'medium',
        status: 'learning',
        knowledgePoints: ['力学', '运动学'],
        timeSpent: 60,
      });

      const foundMistake = await mistakeRepository.findOne({
        where: { id: mistake.id },
      });

      expect(foundMistake!.options).toEqual(['A.选项1', 'B.选项2', 'C.选项3', 'D.选项4']);
      expect(foundMistake!.knowledgePoints).toEqual(['力学', '运动学']);
    });
  });

  describe('Subject Entity', () => {
    it('should create a subject with hierarchy', async () => {
      const subjectRepository = connection.getRepository(Subject);

      // Create parent subject
      const parentSubject = await subjectRepository.save({
        name: '数学',
        code: 'math',
        level: 1,
        parentId: null,
      });

      // Create child subject
      const childSubject = await subjectRepository.save({
        name: '代数',
        code: 'math-algebra',
        level: 2,
        parentId: parentSubject.id,
      });

      expect(childSubject.parentId).toBe(parentSubject.id);
    });
  });

  describe('ExamRecord Entity', () => {
    it('should create exam record with answers', async () => {
      const examRecordRepository = connection.getRepository(ExamRecord);
      const userRepository = connection.getRepository(User);

      const user = await userRepository.save({
        username: 'examuser',
        email: 'exam@example.com',
        passwordHash: 'hash',
      });

      const examRecord = await examRecordRepository.save({
        userId: user.id,
        subject: '数学',
        totalCount: 10,
        correctCount: 8,
        wrongCount: 2,
        accuracy: 80,
        timeSpent: 600,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(Date.now() + 600000),
      });

      expect(examRecord.userId).toBe(user.id);
      expect(examRecord.totalCount).toBe(10);
      expect(examRecord.accuracy).toBe(80);
    });

    it('should calculate accuracy automatically', async () => {
      const examRecordRepository = connection.getRepository(ExamRecord);
      const userRepository = connection.getRepository(User);

      const user = await userRepository.save({
        username: 'autocalc',
        email: 'auto@example.com',
        passwordHash: 'hash',
      });

      const examRecord = await examRecordRepository.save({
        userId: user.id,
        subject: '物理',
        totalCount: 20,
        correctCount: 15,
        wrongCount: 5,
        timeSpent: 900,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      expect(examRecord.accuracy).toBe(75); // 15/20 = 0.75
    });
  });

  describe('Database Relations', () => {
    it('should retrieve user with their mistakes', async () => {
      const mistakeRepository = connection.getRepository(Mistake);
      const userRepository = connection.getRepository(User);

      const user = await userRepository.save({
        username: 'relationtest',
        email: 'relation@example.com',
        passwordHash: 'hash',
      });

      await mistakeRepository.save({
        userId: user.id,
        subject: '化学',
        questionText: '测试',
        questionType: 'single',
        options: [],
        correctAnswer: 'A',
        analysis: '解析',
        difficulty: 'easy',
        status: 'new',
        timeSpent: 30,
      });

      await mistakeRepository.save({
        userId: user.id,
        subject: '化学',
        questionText: '测试2',
        questionType: 'single',
        options: [],
        correctAnswer: 'B',
        analysis: '解析2',
        difficulty: 'medium',
        status: 'learning',
        timeSpent: 45,
      });

      const foundUser = await userRepository.findOne({
        where: { id: user.id },
        relations: ['mistakes'],
      });

      expect(foundUser!.mistakes).toHaveLength(2);
    });
  });
});
