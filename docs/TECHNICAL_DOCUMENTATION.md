# Mistakery 技术文档

本文档面向开发人员，介绍 Mistakery 项目的技术架构、开发规范和部署指南。

## 目录

- [系统架构](#系统架构)
- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [API 接口文档](#api-接口文档)
- [数据库设计](#数据库设计)
- [缓存策略](#缓存策略)
- [安全机制](#安全机制)
- [开发规范](#开发规范)
- [测试指南](#测试指南)
- [故障排查](#故障排查)

---

## 系统架构

### 整体架构

```
┌─────────────────────────────────────────────────┐
│                   前端层 (Vue 3)                │
├─────────────────────────────────────────────────┤
│  页面层 │ 组件层 │ 状态层 │ 服务层
└──────────────────┬──────────────────────────────┘
                   │ HTTP/HTTPS
┌──────────────────▼──────────────────────────────┐
│              API 网关 (Nginx)                   │
├─────────────────────────────────────────────────┤
│  路由守卫 │ 全局拦截器 │ 异常过滤器 │ 限流      │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│              业务模块层 (NestJS)                 │
├─────────────────────────────────────────────────┤
│  Auth │ User │ Mistake │ Practice │ Analytics  │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│                  数据层                          │
├─────────────────────────────────────────────────┤
│  MySQL 8.0 (主数据) │ Redis 7.0 (缓存/会话)     │
└─────────────────────────────────────────────────┘
```

### 前端架构

```
src/
├── views/           # 页面组件
├── components/      # 可重用组件
├── composables/     # 组合式函数
├── stores/          # Pinia 状态管理
├── services/        # API 服务
├── router/          # 路由配置
├── utils/           # 工具函数
└── assets/          # 静态资源
```

### 后端架构

```
src/
├── modules/         # 功能模块
│   ├── auth/        # 认证模块
│   ├── user/        # 用户模块
│   ├── mistake/     # 错题模块
│   ├── practice/    # 练习模块
│   ├── analytics/   # 分析模块
│   └── review/      # 复习模块
├── common/          # 共享模块
│   ├── guards/      # 路由守卫
│   ├── interceptors/# 拦截器
│   ├── filters/     # 异常过滤器
│   └── dto/         # 数据传输对象
└── config/          # 配置文件
```

---

## 技术栈

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.4+ | 渐进式框架 |
| TypeScript | 5.2+ | 类型系统 |
| Vite | 5.0+ | 构建工具 |
| Element Plus | 2.5+ | UI 组件库 |
| Pinia | 2.1+ | 状态管理 |
| Vue Router | 4.2+ | 路由管理 |
| Axios | 1.6+ | HTTP 客户端 |
| ECharts | 5.5+ | 图表库 |
| Day.js | 1.11+ | 日期处理 |
| Vitest | 1.1+ | 单元测试 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 20 LTS | 运行环境 |
| NestJS | 10.x | 应用框架 |
| TypeScript | 5.2+ | 类型系统 |
| TypeORM | 0.3.x | ORM 框架 |
| MySQL | 8.0 | 关系数据库 |
| Redis | 7.0 | 缓存数据库 |
| Passport | 0.7.x | 认证中间件 |
| JWT | 10.x | Token 认证 |
| class-validator | 0.14.x | 数据验证 |
| Jest | 29.x | 单元测试 |

### 基础设施

| 技术 | 用途 |
|------|------|
| Docker | 容器化 |
| Docker Compose | 本地开发编排 |
| Nginx | 反向代理 |
| PM2 | 进程管理 |

---

## 目录结构

### 前端目录结构

```
frontend/
├── public/                  # 静态资源
├── src/
│   ├── assets/             # 资源文件
│   │   ├── styles/         # 全局样式
│   │   │   ├── variables.scss
│   │   │   ├── mixins.scss
│   │   │   └── global.scss
│   │   └── images/         # 图片资源
│   ├── components/         # 可重用组件
│   │   ├── Common/         # 通用组件
│   │   ├── Layout/         # 布局组件
│   │   ├── Practice/       # 练习组件
│   │   ├── Statistics/     # 统计组件
│   │   └── ...
│   ├── views/              # 页面组件
│   │   ├── auth/           # 认证页面
│   │   ├── mistake/        # 错题页面
│   │   ├── practice/       # 练习页面
│   │   ├── statistics/     # 统计页面
│   │   └── user/           # 用户页面
│   ├── composables/        # 组合式函数
│   │   ├── useAuth.ts
│   │   ├── useMistake.ts
│   │   └── ...
│   ├── stores/             # Pinia 状态
│   │   ├── auth.ts
│   │   ├── mistake.ts
│   │   └── ...
│   ├── services/           # API 服务
│   │   ├── api.ts          # Axios 配置
│   │   └── *.service.ts    # 业务服务
│   ├── router/             # 路由配置
│   │   ├── index.ts
│   │   └── guards.ts       # 路由守卫
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript 类型
│   ├── App.vue
│   └── main.ts
├── tests/                  # 测试文件
├── .env.example
├── Dockerfile
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### 后端目录结构

```
backend/
├── src/
│   ├── modules/            # 功能模块
│   │   ├── auth/
│   │   │   ├── strategies/ # 认证策略
│   │   │   ├── guards/     # 路由守卫
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   └── dto/        # 数据传输对象
│   │   ├── user/
│   │   ├── mistake/
│   │   ├── practice/
│   │   ├── review/
│   │   ├── analytics/
│   │   └── cache/
│   ├── common/             # 共享模块
│   │   ├── controllers/    # 通用控制器
│   │   ├── services/       # 通用服务
│   │   ├── filters/        # 异常过滤器
│   │   ├── interceptors/   # 拦截器
│   │   ├── guards/         # 路由守卫
│   │   ├── pipes/          # 管道
│   │   ├── decorators/     # 装饰器
│   │   └── entities/       # 基础实体
│   ├── config/             # 配置文件
│   ├── database/           # 数据库
│   │   ├── migrations/     # 迁移脚本
│   │   └── seeds/          # 种子数据
│   ├── middlewares/        # 中间件
│   ├── main.ts
│   └── app.module.ts
├── test/                   # 测试文件
│   ├── unit/               # 单元测试
│   ├── integration/        # 集成测试
│   └── e2e/                # 端到端测试
├── .env.example
├── Dockerfile
├── ecosystem.config.cjs    # PM2 配置
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

---

## API 接口文档

### 认证接口

#### 注册
```
POST /api/auth/register
Content-Type: application/json

Request:
{
  "username": "string",
  "email": "string",
  "password": "string",
  "nickname": "string"
}

Response:
{
  "success": true,
  "data": {
    "user": { "id": "string", "username": "string", ... },
    "token": "string"
  }
}
```

#### 登录
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "username": "string",
  "password": "string"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "string"
  }
}
```

#### 刷新令牌
```
POST /api/auth/refresh
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "token": "string"
  }
}
```

### 错题接口

#### 创建错题
```
POST /api/mistake
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "questionText": "string",
  "questionType": "single|multiple|boolean|...",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "string",
  "analysis": "string",
  "subject": "string",
  "difficulty": "easy|medium|hard"
}

Response:
{
  "success": true,
  "data": {
    "id": "string",
    "createdAt": "datetime"
  }
}
```

#### 获取错题列表
```
GET /api/mistake?page=1&limit=20&subject=math&status=pending
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### 练习接口

#### 创建练习
```
POST /api/practice/exam
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "name": "string",
  "subject": "string",
  "questionCount": 20,
  "filterConfig": {
    "types": ["single", "multiple"],
    "difficulty": "medium",
    "status": ["pending"]
  }
}

Response:
{
  "success": true,
  "data": {
    "id": "string",
    "questions": [...]
  }
}
```

#### 提交答案
```
POST /api/practice/exam/:id/answer
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "questionId": "string",
  "userAnswer": "string"
}

Response:
{
  "success": true,
  "data": {
    "isCorrect": true
  }
}
```

### 统计接口

#### 获取概览统计
```
GET /api/analytics/overview?timeRange=week
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "totalQuestions": 100,
    "correctCount": 80,
    "wrongCount": 20,
    "accuracy": 0.8,
    "totalTime": 3600,
    "studyDays": 7
  }
}
```

### 复习接口

#### 获取待复习列表
```
GET /api/review/due
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "items": [...],
    "total": 10
  }
}
```

#### 提交复习结果
```
POST /api/review/:id/submit
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "result": "again|hard|good|easy"
}

Response:
{
  "success": true,
  "data": {
    "nextReviewDate": "datetime",
    "intervalDays": 3
  }
}
```

---

## 数据库设计

### 核心表结构

#### user (用户表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | CHAR(36) | 主键 |
| username | VARCHAR(50) | 用户名 |
| email | VARCHAR(100) | 邮箱 |
| password_hash | VARCHAR(255) | 密码哈希 |
| nickname | VARCHAR(50) | 昵称 |
| avatar_url | VARCHAR(500) | 头像URL |
| target_exam | VARCHAR(100) | 目标考试 |

#### mistake (错题表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | CHAR(36) | 主键 |
| user_id | CHAR(36) | 用户ID |
| question_text | TEXT | 题目内容 |
| question_type | ENUM | 题目类型 |
| options | JSON | 选项 |
| correct_answer | TEXT | 正确答案 |
| analysis | TEXT | 解析 |
| subject | VARCHAR(100) | 科目 |
| status | ENUM | 掌握状态 |
| review_count | INT | 复习次数 |

#### exam_record (练习记录表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | CHAR(36) | 主键 |
| user_id | CHAR(36) | 用户ID |
| name | VARCHAR(200) | 练习名称 |
| question_count | INT | 题目数量 |
| correct_count | INT | 正确数 |
| wrong_count | INT | 错误数 |
| status | ENUM | 状态 |

#### review (复习表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | CHAR(36) | 主键 |
| user_id | CHAR(36) | 用户ID |
| mistake_id | CHAR(36) | 错题ID |
| next_review_date | DATETIME | 下次复习时间 |
| result | ENUM | 复习结果 |
| interval_days | INT | 间隔天数 |
| box_level | INT | 箱子等级 |

---

## 缓存策略

### Redis 缓存配置

```typescript
// 缓存 TTL 配置
const CACHE_TTL = {
  SHORT: 300,      // 5分钟 - 实时数据
  MEDIUM: 1800,    // 30分钟 - 用户数据
  LONG: 7200,      // 2小时 - 统计数据
  PERMANENT: 86400 // 24小时 - 静态数据
};

// 缓存键前缀
const CACHE_PREFIX = {
  AUTH: 'auth',
  USER: 'user',
  ANALYTICS: 'analytics',
  MISTAKE: 'mistake',
  PRACTICE: 'practice',
  REVIEW: 'review'
};
```

### 缓存使用场景

| 数据类型 | TTL | 策略 |
|----------|-----|------|
| 用户信息 | 30分钟 | 修改时失效 |
| 统计数据 | 10分钟 | 定时刷新 |
| 复习计划 | 5分钟 | 实时计算 |
| 练习题目 | 2小时 | 静态缓存 |

---

## 安全机制

### 认证与授权

1. **JWT 认证**
   - 访问令牌有效期：7天
   - 刷新令牌有效期：30天
   - 密钥配置：环境变量

2. **路由守卫**
   - JwtAuthGuard：需要认证
   - RolesGuard：角色权限

### 数据安全

1. **密码加密**
   - 算法：bcrypt
   - 成本因子：10

2. **SQL 注入防护**
   - TypeORM 参数化查询
   - 输入验证和过滤

3. **XSS 防护**
   - 输入内容过滤
   - 输出内容转义

4. **CSRF 防护**
   - 同步令牌模式
   - 令牌有效期：1小时

### 限流策略

| 端点类型 | 限制 |
|----------|------|
| 通用 API | 100请求/分钟 |
| 登录 API | 5次/15分钟 |
| 上传 API | 20次/小时 |

---

## 开发规范

### 代码风格

1. **TypeScript 规范**
   - 使用严格模式
   - 明确类型注解
   - 避免使用 any

2. **命名规范**
   - 文件名：kebab-case
   - 类名：PascalCase
   - 函数/变量：camelCase
   - 常量：UPPER_SNAKE_CASE

3. **注释规范**
   - 公共API必须添加注释
   - 复杂逻辑需要说明
   - 使用JSDoc格式

### Git 提交规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型：
- feat：新功能
- fix：修复bug
- docs：文档更新
- style：代码格式
- refactor：重构
- test：测试
- chore：构建/工具

示例：
```
feat(auth): add refresh token support

Implement token refresh mechanism to improve security.
- Add refresh endpoint
- Update JWT strategy
- Add unit tests

Closes #123
```

---

## 测试指南

### 单元测试

```bash
# 前端测试
cd frontend
npm run test:coverage

# 后端测试
cd backend
npm run test:cov
```

### 集成测试

```bash
# API 集成测试
cd backend
npm run test:integration
```

### E2E 测试

```bash
# Playwright E2E 测试
npm run test:e2e
```

### 覆盖率要求

- 单元测试：≥85%
- 集成测试：≥70%
- E2E 测试：关键流程100%

---

## 故障排查

### 常见问题

#### 1. 数据库连接失败

**症状**：后端启动时报错 "ECONNREFUSED"

**解决方案**：
```bash
# 检查 MySQL 是否运行
docker-compose ps mysql

# 查看日志
docker-compose logs mysql

# 重启服务
docker-compose restart mysql
```

#### 2. Redis 连接失败

**症状**：缓存操作超时

**解决方案**：
```bash
# 检查 Redis 是否运行
docker-compose ps redis

# 测试连接
docker-compose exec redis redis-cli ping
```

#### 3. 前端构建失败

**症状**：npm run build 报错

**解决方案**：
```bash
# 清理缓存
rm -rf node_modules dist
npm install
npm run build
```

### 日志位置

| 服务 | 日志位置 |
|------|----------|
| 后端应用 | logs/pm2-*.log |
| Nginx | docker volume nginx_logs |
| MySQL | docker-compose logs mysql |
| Redis | docker-compose logs redis |

---

## 性能优化建议

### 前端优化

1. 代码分割：路由懒加载
2. 资源压缩：Gzip/Brotli
3. 图片优化：WebP格式、懒加载
4. 缓存策略：Service Worker

### 后端优化

1. 数据库索引：优化查询
2. 连接池：合理配置大小
3. 缓存策略：Redis缓存热数据
4. 异步处理：使用消息队列

---

## 部署指南

详细的部署文档请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**文档版本：v1.0**
**最后更新：2026年2月**
