# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供在此代码库中工作的指导。

## 项目概述

**Mistakery**（错题追踪与学习优化平台）是一个中文错题追踪与学习优化平台。采用 Vue 3 + NestJS 构建，使用高顿教育橙色主题 (#ff6e00)。

- **前端**: Vue 3.4+（Composition API + `<script setup>`）、Vite 5、Element Plus、Pinia、ECharts
- **后端**: NestJS 10、TypeORM、MySQL 8.0、Redis 7.0、JWT 认证
- **架构**: 模块化 monorepo，使用 Docker Compose 编排

## 常用命令

### 本地开发

```bash
# 前端（在 frontend/ 目录下）
npm run dev              # 启动 Vite 开发服务器（端口 5173）
npm run build            # 生产构建（先执行类型检查）
npm run type-check       # 仅 TypeScript 类型检查
npm run lint             # ESLint 自动修复
npm run test             # 运行 Vitest 测试
npm run test:ui          # Vitest UI 模式
npm run test:coverage    # 生成覆盖率报告
npm run format           # Prettier 格式化

# 后端（在 backend/ 目录下）
npm run start:dev        # NestJS 监听模式启动（端口 3001）
npm run start:debug      # 调试模式启动
npm run build            # 编译 TypeScript 到 dist/
npm run start:prod       # 运行编译后的生产服务器
npm run lint             # ESLint 自动修复
npm run test             # 运行 Jest 测试
npm run test:cov         # Jest 覆盖率
npm run migration:generate # 生成 TypeORM 迁移
npm run migration:run     # 执行待处理的迁移
npm run migration:revert  # 回滚最后一次迁移
```

### Docker 开发

```bash
docker-compose up -d      # 启动所有服务（MySQL、Redis、后端、前端）
docker-compose logs -f    # 查看日志
docker-compose down       # 停止所有服务
```

### 数据库初始化

```bash
# 使用脚本初始化数据库
mysql -u root -p mistakery < docker/mysql/init/01-init.sql
```

## 架构设计

### 模块结构

**后端模块** (`backend/src/modules/`)：
- `auth/` - JWT 认证（注册、登录、刷新令牌）
- `user/` - 用户资料、设置、头像上传
- `mistake/` - 错题增删改查、题目解析、重复检测
- `practice/` - 组卷、练习、提交
- `review/` - Leitner 间隔重复系统
- `analytics/` - 统计分析、趋势、建议生成
- `subject/` - 科目/知识点管理
- `upload/` - 图片/文件上传处理
- `cache/` - Redis 缓存服务

**公共层** (`backend/src/common/`)：
- `guards/` - JwtAuthGuard 路由守卫
- `interceptors/` - 日志、转换、性能监控
- `filters/` - AllExceptionsFilter 全局异常处理
- `decorators/` - @CurrentUser 装饰器获取当前用户
- `entities/` - BaseEntity 基类（id、createdAt、updatedAt）

### 前端结构

```
frontend/src/
├── components/          # 可复用组件
│   ├── common/         # Button、Card、Modal、Loading 等
│   ├── layout/         # MainLayout、Header、Footer
│   ├── mistake/        # MistakeEntry、MistakeCard、FilterPanel
│   ├── practice/       # QuestionCard、AnswerSheet、DrawingCanvas、Timer
│   ├── result/         # StatCard、AccuracyChart、ResultAnswerSheet
│   └── notes/          # DraftNotePanel
├── views/              # 页面组件（路由级别）
├── composables/        # useAuth.ts、useNotes.ts、useTimer.ts
├── stores/             # Pinia 状态管理（auth、mistake、practice、subject）
├── services/           # API 服务层（auth.ts、mistake.ts、practice.ts）
├── router/             # Vue Router 路由守卫
└── utils/              # format.ts、storage.ts、shortcuts.ts
```

### 数据流

1. 用户操作 → Vue 组件
2. 组件 → Pinia Store Action
3. Store → API 服务层（Axios 携带 JWT 令牌）
4. API → NestJS 控制器（通过 Nginx 代理 `/api`）
5. 控制器 → 服务层（业务逻辑）
6. 服务 → 仓储（TypeORM）或 Redis 缓存
7. 响应 → 转换拦截器 → 过滤器 → 客户端

## 重要模式

### 认证机制

- JWT 存储在 localStorage (`mistakery_token`)
- Axios 拦截器自动添加 `Authorization: Bearer <token>` 请求头
- JwtAuthGuard 验证受保护路由的令牌
- 令牌有效期 7 天（可通过 `JWT_EXPIRES_IN` 配置）

### Leitner 复习算法

```typescript
// 复习间隔：[1, 3, 7, 14, 30] 天
// 难度因子初始值 2.5
// 质量评分 (0-5): again=0, hard=2, good=4, easy=5
// 质量 < 3 → 重置为间隔 1
// 质量 >= 3 → 根据难度因子增加间隔
```

### 响应格式

所有 API 响应遵循统一格式：
```typescript
{
  code: number,
  message: string,
  data: any
}
```

**注意**: 后端返回 `{code, message, data}` 格式，通过响应拦截器转换后前端接收 `{success, data, message}` 格式。

### 错误处理

- 全局 `AllExceptionsFilter` 捕获所有异常
- HTTP 状态码：400（验证失败）、401（未授权）、404（未找到）、500（服务器错误）

### 缓存策略 (Redis)

- 用户数据：30 分钟
- 统计数据：10 分钟
- 练习题目：2 小时
- 缓存键格式：`<prefix>:<entity>:<id>`

## 编码规范

### 编辑器配置 (.editorconfig)
- UTF-8 编码
- 2 空格缩进
- LF 换行符
- 去除行尾空格
- 文件末尾插入空行

### 命名规范
- **文件**: kebab-case (`mistake-service.ts`, `mistake-card.vue`)
- **组件**: PascalCase (`MistakeCard.vue`)
- **函数/变量**: camelCase (`getUserById`)
- **常量**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **类型/接口**: PascalCase (`User`, `MistakeDto`)

### 前端模式
- 所有组件使用 `<script setup>` 和 Composition API
- 使用 `@/` 别名导入 `src/` 下的文件
- 基于路由的懒加载实现代码分割
- Pinia stores 管理状态，包含 actions、getters

#### Pinia Store 模式
```typescript
export const useExampleStore = defineStore('example', () => {
  // State
  const items = ref<Item[]>([]);
  const status = ref<'idle' | 'loading' | 'succeeded' | 'failed'>('idle');

  // Getters
  const filteredItems = computed(() => items.value.filter(...));

  // Actions
  async function fetchItems() {
    status.value = 'loading';
    try {
      const response = await api.getItems();
      items.value = response.data;
      status.value = 'succeeded';
    } catch (error) {
      status.value = 'failed';
    }
  }

  return { items, status, filteredItems, fetchItems };
});
```

#### 路由守卫模式
- 路由守卫直接检查 `localStorage` 而非依赖 store
- 避免 store 初始化时序问题
- 未认证时重定向到登录页

#### 组件通信模式
- 父子组件通信优先使用 `v-model` 双向绑定
- 子组件定义 `modelValue` prop 和 `update:modelValue` emit
- 示例：
  ```vue
  <!-- 父组件 -->
  <ChildComponent v-model="filters" />

  <!-- 子组件 -->
  <script setup>
  const props = defineProps<{ modelValue: Filters }>();
  const emit = defineEmits<{ 'update:modelValue': [filters: Filters] }>();
  const localValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  });
  </script>
  ```

### 后端模式
- 模块化架构，NestJS 功能模块
- 构造函数依赖注入
- 装饰器使用：`@Controller`、`@Service`、`@Get`、`@Post`、`@UseGuards`
- DTO 配合 class-validator 进行数据验证

#### 模块文件结构
每个模块遵循固定模式：
- `module-name.controller.ts` - HTTP 请求处理
- `module-name.service.ts` - 业务逻辑
- `module-name.module.ts` - 模块定义和依赖配置
- `dto/` - 数据传输对象 (DTO) 和验证
- `entities/` - TypeORM 数据库实体

## 环境变量

**后端** (`backend/.env`)：
```
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=mistakery
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

**前端** (`frontend/.env`)：
```
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_TITLE=错题本
```

## 设计令牌 (SCSS)

```scss
--primary-color: #ff6e00        // 高顿橙
--success-color: #52c41a
--error-color: #f5222d
--text-primary: rgba(0, 0, 0, 0.85)
--background-primary: rgb(240, 242, 245)
--border-radius: 8px
--spacing-md: 16px
```

## 测试

- **前端**: Vitest + Vue Test Utils，目标覆盖率 85%+
- **后端**: Jest + supertest，目标覆盖率 85%+
- 测试文件：`*.spec.ts`（后端）、`*.test.ts`（前端）

## CI/CD

- `.github/workflows/backend-ci.yml` - 后端 lint、test、build
- `.github/workflows/frontend-ci.yml` - 前端 lint、type-check、test、build
- `.github/workflows/deploy.yml` - main 分支生产部署

## Git 规范

使用 Conventional Commits 规范：
- `feat:` - 新功能
- `fix:` - Bug 修复
- `docs:` - 文档更新
- `style:` - 代码格式
- `refactor:` - 重构
- `test:` - 测试相关
- `chore:` - 构建/工具

## 文档

- `README.md` - 项目概述、快速开始
- `ProjectDesignDocument.md` - 后端架构、API 规范、数据库模式
- `FrontendDesignDocument.md` - 前端架构、组件、设计系统
- `docs/TECHNICAL_DOCUMENTATION.md` - 开发指南、API 文档、部署
- `docs/USER_MANUAL.md` - 用户手册
- `docs/DEPLOYMENT.md` - 部署流程
