# Mistakery 项目设计文档

## 1. 概述
Mistakery 是一个专注于错题追踪和学习优化的教育平台。该系统使用户能够：
- 记录和分类学习中的错误
- 分析错误模式
- 实施间隔重复复习
- 追踪知识掌握进度

## 2. 系统架构
```
┌──────────────────────────────┐
│           客户端             │
├──────────────────────────────┤
│ • 基于 Vue 3 的前端          │
│ • TypeScript                 │
│ • Element Plus 组件          │
│ • Vite 构建工具              │
└────────┬─────────────────────┘
         │
┌────────▼───────────────┐
│     API 网关           │
├────────────────────────┤
│ • NestJS               │
│ • JWT 身份验证         │
│ • 速率限制             │
│ • 全局异常过滤器       │
└────────┬─────────────────┘
         │
┌────────▼───────────────┐
│     业务模块层         │
├────────────────────────┤
│ • Mistake Module       │
│ • Review Module        │
│ • Analytics Module     │
│ • Auth Module          │
│ • User Module          │
└────────┬─────────────────┘
         │
┌────────▼───────────────┐
│     数据层             │
├────────────────────────┤
│ • MySQL 数据库         │
│ • Redis 缓存           │
│ • TypeORM              │
└────────────────────────┘
```

## 3. 核心模块

### 3.1 NestJS 模块化架构

```
src/
├── modules/
│   ├── mistake/              # 错题管理模块
│   │   ├── mistake.controller.ts
│   │   ├── mistake.service.ts
│   │   ├── mistake.module.ts
│   │   ├── entities/
│   │   │   └── mistake.entity.ts
│   │   ├── dto/
│   │   │   ├── create-mistake.dto.ts
│   │   │   └── update-mistake.dto.ts
│   │   └── parsers/
│   │       └── question-parser.service.ts
│   │
│   ├── practice/             # 练习模块
│   │   ├── practice.controller.ts
│   │   ├── practice.service.ts
│   │   ├── practice.module.ts
│   │   ├── entities/
│   │   │   ├── exam.entity.ts
│   │   │   ├── exam-record.entity.ts
│   │   │   └── answer.entity.ts
│   │   ├── dto/
│   │   │   ├── create-exam.dto.ts
│   │   │   ├── submit-answer.dto.ts
│   │   │   └── submit-exam.dto.ts
│   │   └── services/
│   │       ├── exam-generator.service.ts
│   │       └── answer-validator.service.ts
│   │
│   ├── review/               # 复习系统模块
│   │   ├── review.controller.ts
│   │   ├── review.service.ts
│   │   ├── review.module.ts
│   │   ├── entities/
│   │   │   └── review.entity.ts
│   │   ├── dto/
│   │   │   ├── schedule-review.dto.ts
│   │   │   └── complete-review.dto.ts
│   │   └── schedulers/
│   │       ├── leitner.scheduler.ts
│   │       └── spaced-repetition.service.ts
│   │
│   ├── analytics/            # 分析模块
│   │   ├── analytics.controller.ts
│   │   ├── analytics.service.ts
│   │   ├── analytics.module.ts
│   │   ├── dto/
│   │   │   └── query-stats.dto.ts
│   │   └── aggregators/
│   │       ├── performance.aggregator.ts
│   │       ├── knowledge.aggregator.ts
│   │       └── trend.analyzer.ts
│   │
│   ├── statistics/           # 学习统计模块
│   │   ├── statistics.controller.ts
│   │   ├── statistics.service.ts
│   │   ├── statistics.module.ts
│   │   ├── dto/
│   │   │   └── time-range.dto.ts
│   │   └── generators/
│   │       ├── advice.generator.ts
│   │       └── report.generator.ts
│   │
│   ├── user/                 # 用户模块
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.module.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   │       ├── update-profile.dto.ts
│   │       └── update-settings.dto.ts
│   │
│   ├── question/             # 题目管理模块
│   │   ├── question.controller.ts
│   │   ├── question.service.ts
│   │   ├── question.module.ts
│   │   ├── entities/
│   │   │   └── question.entity.ts
│   │   ├── dto/
│   │   │   ├── create-question.dto.ts
│   │   │   └── query-question.dto.ts
│   │   └── services/
│   │       └── question-filter.service.ts
│   │
│   ├── auth/                 # 认证模块
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── guards/
│   │   │   └── jwt.guard.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   │
│   ├── export/               # 导出模块
│   │   ├── export.controller.ts
│   │   ├── export.service.ts
│   │   ├── export.module.ts
│   │   └── generators/
│   │       ├── pdf.generator.ts
│   │       ├── excel.generator.ts
│   │       └── json.generator.ts
│   │
│   └── upload/               # 文件上传模块
│       ├── upload.controller.ts
│       ├── upload.service.ts
│       ├── upload.module.ts
│       └── strategies/
│           └── local.storage.ts
│
├── common/                   # 共享模块
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   ├── transform.interceptor.ts
│   │   └── cache.interceptor.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── dto/
│   │   └── base.dto.ts
│   └── entities/
│       └── base.entity.ts
│
├── config/                   # 配置模块
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── jwt.config.ts
│   └── app.config.ts
│
├── database/                 # 数据库相关
│   ├── migrations/
│   └── seeds/
│
└── main.ts                   # 应用入口
```
```
src/
├── modules/
│   ├── mistake/              # 错题管理模块
│   │   ├── mistake.controller.ts
│   │   ├── mistake.service.ts
│   │   ├── mistake.module.ts
│   │   ├── entities/
│   │   │   └── mistake.entity.ts
│   │   ├── dto/
│   │   │   ├── create-mistake.dto.ts
│   │   │   └── update-mistake.dto.ts
│   │   └── parsers/
│   │       └── question-parser.service.ts
│   │
│   ├── review/               # 复习系统模块
│   │   ├── review.controller.ts
│   │   ├── review.service.ts
│   │   ├── review.module.ts
│   │   ├── entities/
│   │   │   └── review.entity.ts
│   │   └── schedulers/
│   │       └── leitner.scheduler.ts
│   │
│   ├── analytics/            # 分析模块
│   │   ├── analytics.controller.ts
│   │   ├── analytics.service.ts
│   │   ├── analytics.module.ts
│   │   └── aggregators/
│   │       ├── performance.aggregator.ts
│   │       └── knowledge.aggregator.ts
│   │
│   ├── auth/                 # 认证模块
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── guards/
│   │       └── jwt.guard.ts
│   │
│   └── user/                 # 用户模块
│       ├── user.controller.ts
│       ├── user.service.ts
│       ├── user.module.ts
│       └── entities/
│           └── user.entity.ts
│
├── common/                   # 共享模块
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   └── dto/
│       └── base.dto.ts
│
├── config/                   # 配置模块
│   ├── database.config.ts
│   ├── redis.config.ts
│   └── app.config.ts
│
├── database/                 # 数据库相关
│   ├── migrations/
│   └── seeds/
│
└── main.ts                   # 应用入口
```

### 3.2 错题管理模块 (MistakeModule)

**功能：**
- 结构化错题录入，支持自动解析
- 多格式内容支持（文本/图片）
- 分类系统（5 个主要学科，25+ 个子类别）
- 错误类型分类（概念性、计算性等）
- 重复题目检测与处理

**模块结构：**
```typescript
// mistake/mistake.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Mistake, Question])],
  controllers: [MistakeController],
  providers: [MistakeService, QuestionParserService],
  exports: [MistakeService],
})
export class MistakeModule {}
```

**API 端点：**
```http
# 错题管理
POST   /api/mistake/parse-and-save    # 解析并保存错题
GET    /api/mistake                   # 获取错题列表
GET    /api/mistake/:id               # 获取错题详情
PUT    /api/mistake/:id               # 更新错题
DELETE /api/mistake/:id               # 删除错题
POST   /api/mistake/batch-delete      # 批量删除错题
POST   /api/mistake/:id/mark          # 标记收藏
GET    /api/mistake/stats/overview    # 获取错题统计概览
```

### 3.3 练习模块 (PracticeModule)

**功能：**
- 智能组卷（多维度筛选）
- 在线答题（实时保存）
- 答题记录管理
- 答题结果分析

**API 端点：**
```http
# 练习管理
POST   /api/practice/exam             # 创建练习试卷
GET    /api/practice/exam/:id         # 获取试卷详情
POST   /api/practice/exam/:id/start   # 开始练习
POST   /api/practice/exam/:id/answer  # 提交单题答案
POST   /api/practice/exam/:id/submit  # 交卷
GET    /api/practice/exam/:id/result  # 获取练习结果
GET    /api/practice/history          # 获取练习历史
```

**请求示例：**
```json
// 创建练习试卷
POST /api/practice/exam
{
  "knowledgePoints": ["politicalTheory.marxism"],
  "type": "wrong",           // random | undone | done | wrong
  "questionType": "single",   // random | single | multiple
  "difficulty": "medium",     // random | easy | medium | hard
  "count": 20,
  "name": "政治理论练习"
}

// 提交单题答案
POST /api/practice/exam/:id/answer
{
  "questionId": 123,
  "answer": ["A"],
  "timeSpent": 45
}
```

### 3.4 复习系统模块 (ReviewModule)
**功能：**
- 结构化错题录入，支持自动解析
- 多格式内容支持（文本/图片）
- 分类系统（5 个主要学科，25+ 个子类别）
- 错误类型分类（概念性、计算性等）

**模块结构：**
```typescript
// mistake/mistake.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Mistake])],
  controllers: [MistakeController],
  providers: [MistakeService, QuestionParserService],
  exports: [MistakeService],
})
export class MistakeModule {}
```

**API 端点：**
```http
POST /api/mistakes
GET /api/mistakes/:id
PUT /api/mistakes/:id
DELETE /api/mistakes/:id
GET /api/mistakes/analysis
```

### 3.3 复习系统模块
**特性：**
- 自适应复习调度（Leitner 系统）
- 智能难度调整
- 复习历史追踪
- 掌握水平计算

**数据库模式：**
```sql
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mistake_id INT NOT NULL,
  user_id INT NOT NULL,
  review_date DATETIME NOT NULL,
  result ENUM('correct','incorrect') NOT NULL,
  interval_days INT DEFAULT 1,
  ease_factor DECIMAL(3,2) DEFAULT 2.50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mistake_id) REFERENCES mistakes(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_mistake (user_id, mistake_id),
  INDEX idx_review_date (review_date)
);
```

**特性：**
- 自适应复习调度（Leitner 系统）
- 智能难度调整
- 复习历史追踪
- 掌握水平计算

**API 端点：**
```http
# 复习管理
GET    /api/review/schedule           # 获取复习计划
GET    /api/review/due                # 获取待复习错题
POST   /api/review/:id/start          # 开始复习
POST   /api/review/:id/complete       # 完成复习
POST   /api/review/batch-start        # 批量开始复习
GET    /api/review/history            # 获取复习历史
GET    /api/review/stats              # 获取复习统计
```

**复习算法 (Leitner System)：**
```typescript
// schedulers/spaced-repetition.service.ts
@Injectable()
export class SpacedRepetitionService {
  private readonly INTERVALS = [1, 3, 7, 14, 30]; // 天数

  calculateNextReview(
    easeFactor: number,
    intervalDays: number,
    quality: number // 0-5: 完全回忆困难-完全回忆轻松
  ): number {
    if (quality < 3) {
      return 1; // 重置
    }

    const newInterval = Math.ceil(intervalDays * easeFactor);
    const newEaseFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    return Math.min(newInterval, 365); // 最大1年
  }

  getDueReviews(userId: number): Promise<Mistake[]> {
    // 查询下次复习时间 <= 当前时间的错题
  }
}
```

### 3.5 分析模块 (AnalyticsModule)

**关键指标：**
- 知识保持率
- 错误模式热力图
- 学科掌握进度
- 基于时间的性能趋势

**API 端点：**
```http
# 分析数据
GET    /api/analytics/overview        # 获取概览统计
GET    /api/analytics/subject         # 获取科目分析
GET    /api/analytics/difficulty      # 获取难度分析
GET    /api/analytics/trend           # 获取趋势数据
GET    /api/analytics/knowledge       # 获取知识点分析
GET    /api/analytics/question/:id    # 获取题目详情分析
```

**响应示例：**
```json
// 获取概览统计
GET /api/analytics/overview
{
  "totalQuestions": 1523,
  "correctRate": 0.73,
  "totalTime": 45230,  // 秒
  "practiceDays": 28,
  "todayStats": {
    "questions": 45,
    "correctRate": 0.68,
    "timeSpent": 3600
  },
  "subjectStats": [
    { "subject": "politicalTheory", "count": 320, "correctRate": 0.75 },
    { "subject": "commonSense", "count": 280, "correctRate": 0.71 }
  ]
}
```

### 3.6 统计模块 (StatisticsModule)
**关键指标：**
- 知识保持率
- 错误模式热力图
- 学科掌握进度
- 基于时间的性能趋势

## 4. 数据库设计

### 4.1 核心数据表

**users（用户表）**
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50),
  avatar_url VARCHAR(255),
  target_exam VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username)
);
```

**questions（题目表）**
```sql
CREATE TABLE questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('single','multiple','judge','fill','comprehensive','essay','indefinite') NOT NULL,
  difficulty ENUM('easy','medium','hard') DEFAULT 'medium',
  subject ENUM('politicalTheory','commonSense','verbalUnderstanding','logicalReasoning','quantitativeRelation') NOT NULL,
  knowledge_points JSON NOT NULL,  -- ['marxism', 'philosophy']
  content TEXT NOT NULL,
  options JSON,                    -- {"A": "选项内容", "B": "选项内容"}
  correct_answer JSON NOT NULL,    -- ["A"] 或 ["A","B"]
  explanation TEXT,
  tags JSON,                       -- ['概念理解', '重点']
  site_correct_rate DECIMAL(5,2),  -- 全站正确率
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subject (subject),
  INDEX idx_difficulty (difficulty),
  INDEX idx_type (type),
  INDEX idx_knowledge_points (CAST(knowledge_points AS CHAR(255))),
  FULLTEXT idx_content (content)
);
```

**mistakes（错题记录表）**
```sql
CREATE TABLE mistakes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  user_answer JSON NOT NULL,
  is_correct BOOLEAN NOT NULL,
  status ENUM('new','learning','mastered') DEFAULT 'new',
  review_count INT DEFAULT 0,
  next_review_date DATETIME,
  ease_factor DECIMAL(3,2) DEFAULT 2.50,
  interval_days INT DEFAULT 1,
  is_marked BOOLEAN DEFAULT FALSE,
  mistake_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_question_id (question_id),
  INDEX idx_status (status),
  INDEX idx_next_review (next_review_date),
  UNIQUE KEY uk_user_question (user_id, question_id)
);
```

**exams（练习试卷表）**
```sql
CREATE TABLE exams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  question_ids JSON NOT NULL,     -- [1, 2, 3, 4, 5]
  total_count INT NOT NULL,
  filter_config JSON,             -- {"knowledgePoints": [...], "type": "wrong"}
  status ENUM('created','in_progress','completed') DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);
```

**exam_records（练习记录表）**
```sql
CREATE TABLE exam_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  exam_id INT NOT NULL,
  user_id INT NOT NULL,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  time_spent INT DEFAULT 0,       -- 秒
  total_questions INT NOT NULL,
  correct_count INT DEFAULT 0,
  wrong_count INT DEFAULT 0,
  correct_rate DECIMAL(5,2),
  status ENUM('in_progress','completed','abandoned') DEFAULT 'in_progress',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_exam_id (exam_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);
```

**exam_answers（答题记录表）**
```sql
CREATE TABLE exam_answers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  exam_record_id INT NOT NULL,
  question_id INT NOT NULL,
  user_answer JSON NOT NULL,
  is_correct BOOLEAN,
  time_spent INT DEFAULT 0,       -- 秒
  answered_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_record_id) REFERENCES exam_records(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_exam_record_id (exam_record_id),
  INDEX idx_question_id (question_id)
);
```

**reviews（复习记录表）**
```sql
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mistake_id INT NOT NULL,
  user_id INT NOT NULL,
  review_date DATETIME NOT NULL,
  result ENUM('correct','incorrect') NOT NULL,
  interval_days INT NOT NULL,
  ease_factor DECIMAL(3,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mistake_id) REFERENCES mistakes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_mistake_id (mistake_id),
  INDEX idx_user_id (user_id),
  INDEX idx_review_date (review_date)
);
```

**user_settings（用户设置表）**
```sql
CREATE TABLE user_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  theme ENUM('light','dark') DEFAULT 'light',
  font_size ENUM('small','medium','large') DEFAULT 'medium',
  auto_next BOOLEAN DEFAULT TRUE,
  default_open_sheet BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_id (user_id)
);
```

### 4.2 数据库索引策略

**复合索引**
```sql
-- 错题查询优化
CREATE INDEX idx_user_status_review ON mistakes(user_id, status, next_review_date);

-- 练习统计优化
CREATE INDEX idx_exam_user_status ON exam_records(user_id, status, completed_at);

-- 题目筛选优化
CREATE INDEX idx_question_subject_diff ON questions(subject, difficulty);
```

**全文索引**
```sql
-- 题目内容搜索
ALTER TABLE questions ADD FULLTEXT INDEX ft_content_search(content);
ALTER TABLE questions ADD FULLTEXT INDEX ft_explanation_search(explanation);
```

### 4.3 Redis 缓存策略

```typescript
// 用户数据缓存
Key: user:{userId}
TTL: 3600s

// 错题列表缓存
Key: mistakes:{userId}:{filters}
TTL: 300s

// 待复习错题
Key: review:due:{userId}
TTL: 60s

// 统计数据缓存
Key: stats:overview:{userId}
TTL: 600s

// 题目详情缓存
Key: question:{questionId}
TTL: 3600s
```

## 5. 安全设计
- 基于 JWT 的身份验证
- 基于角色的访问控制
- 输入验证和清理
- 安全的 API 通信（HTTPS）
- 数据库保护（预编译语句）

## 5. 部署架构
```
┌───────────────┐   ┌───────────────┐
│   负载        │   │   应用        │
│   均衡器      │───►   集群        │
└───────────────┘   │   (3 个节点)   │
                    └───────────────┘
                            │
                    ┌───────┴───────┐
                    │   数据库      │
                    │   集群        │
                    └───────────────┘
                            │
                    ┌───────┴───────┐
                    │   对象        │
                    │   存储        │
                    └───────────────┘
```

## 6. 技术栈
| 层 | 技术 |
|-------|--------------|
| 前端 | Vue 3.4+、TypeScript 5.2+、Element Plus、Vite 5.x |
| 后端 | Node.js 20、NestJS 10.x、TypeScript 5.2+ |
| 数据库 | MySQL 8.0、Redis 7.0 |
| ORM | TypeORM 0.3.x |
| 存储 | AWS S3 / 阿里云 OSS |
| 构建 | Docker、CI/CD 流水线 |
| 监控 | Prometheus、Grafana |

## 7. API 规范
**错题录入请求：**
```json
{
  "category": "politicalTheory",
  "subCategory": "marxism",
  "content": "## 2026/2/9 00:58:01\n\n资本主义的基本矛盾是什么？\nA. 生产和消费的矛盾\nB. 无产阶级和资产阶级的矛盾\nC. 私人劳动和社会劳动的矛盾\nD. 生产社会化和生产资料资本主义私人占有之间的矛盾\n\n我的答案：A\n正确答案：D\n解析：资本主义的基本矛盾是生产社会化和生产资料资本主义私人占有之间的矛盾..."
}
```

**响应：**
```json
{
  "questionId": 12345,
  "mistakeId": 67890,
  "parsedData": {
    "type": "single",
    "difficulty": "medium",
    "subject": "politicalTheory",
    "knowledgePoints": ["marxism"],
    "content": "资本主义的基本矛盾是什么？",
    "options": {
      "A": "生产和消费的矛盾",
      "B": "无产阶级和资产阶级的矛盾",
      "C": "私人劳动和社会劳动的矛盾",
      "D": "生产社会化和生产资料资本主义私人占有之间的矛盾"
    },
    "correctAnswer": ["D"],
    "userAnswer": ["A"],
    "explanation": "资本主义的基本矛盾是生产社会化和生产资料资本主义私人占有之间的矛盾..."
  }
}
```

## 8. 错误处理策略
| 错误类型 | 处理机制 |
|------------|--------------------|
| 输入验证错误 | 400 Bad Request，附带详细错误消息 |
| 身份验证错误 | 401 Unauthorized，提供令牌刷新选项 |
| 资源未找到 | 404 Not Found，提供资源建议 |
| 系统错误 | 500 Internal Server Error，记录日志 |
| 速率限制 | 429 Too Many Requests，附带 retry-after 头 |

## 9. 性能要求
| 指标 | 目标 |
|--------|--------|
| API 响应时间 | < 200ms（95% 的请求）|
| 页面加载时间 | < 1.5s（首次内容绘制）|
| 并发 | 1000+ 同时用户 |
| 正常运行时间 | 99.9% SLA |

## 10. 未来路线图
1. AI 驱动的错题分析
2. 协作学习功能
3. 移动应用支持
4. 与教育平台集成
5. 高级分析仪表板

## 11. NestJS 后端模块化设计规范

### 11.1 模块设计原则
```
单一职责原则：每个模块只负责一个业务领域
依赖注入：通过构造函数注入依赖
接口隔离：使用 DTO 定义清晰的 API 契约
开闭原则：通过装饰器和扩展点支持功能扩展
```

### 11.2 模块间通信
```typescript
// 模块间服务调用示例
@Module({
  imports: [MistakeModule],
  providers: [ReviewService],
})
export class ReviewModule {
  constructor(private mistakeService: MistakeService) {}
}

// 使用事件驱动进行解耦
@Injectable()
export class ReviewService {
  constructor(
    @Inject(EVENT_BUS) private eventBus: EventBus,
  ) {}

  async completeReview(reviewDto: CompleteReviewDto) {
    // 完成复习逻辑
    this.eventBus.publish(new ReviewCompletedEvent(reviewDto));
  }
}
```

### 11.3 可扩展性设计
```typescript
// 策略模式支持不同的解析器
@Injectable()
export class QuestionParserService {
  private parsers: Map<string, QuestionParser>;

  constructor() {
    this.parsers = new Map([
      ['text', new TextQuestionParser()],
      ['image', new ImageQuestionParser()],
      ['auto', new AutoQuestionParser()],
    ]);
  }

  parse(type: string, content: string) {
    return this.parsers.get(type)?.parse(content);
  }
}
```

### 11.4 配置管理
```typescript
// config/app.config.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mistakery',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
});
