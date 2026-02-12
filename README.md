# Mistakery 错题追踪与学习优化平台

## 项目简介

Mistakery 是一个基于 Vue 3 + NestJS 的错题追踪和学习优化平台，采用高顿教育橙色主题风格，提供结构化错题录入、智能组卷、间隔重复复习等功能。

## 技术栈

### 前端
- Vue 3.4+ (Composition API + `<script setup>`)
- Vite 5.x
- TypeScript 5.2+
- Element Plus 2.5+
- Pinia 2.x
- Vue Router 4.x
- ECharts 5.x

### 后端
- Node.js 20 LTS
- NestJS 10.x
- TypeScript 5.2+
- TypeORM 0.3.x
- MySQL 8.0
- Redis 7.0
- Passport + JWT

### DevOps
- Docker + Docker Compose
- GitHub Actions CI/CD
- Nginx (反向代理)

## 项目结构

```
Mistakery/
├── frontend/              # Vue 3 前端项目
│   ├── src/
│   │   ├── assets/       # 静态资源
│   │   ├── components/   # 组件
│   │   ├── views/        # 页面
│   │   ├── stores/       # Pinia 状态管理
│   │   ├── api/          # API 服务
│   │   ├── router/       # 路由配置
│   │   └── main.ts
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── backend/              # NestJS 后端项目
│   ├── src/
│   │   ├── modules/      # 业务模块
│   │   ├── common/       # 公共模块
│   │   ├── config/       # 配置文件
│   │   ├── main.ts
│   │   └── app.module.ts
│   ├── Dockerfile
│   └── package.json
├── docker/               # Docker 配置
│   └── mysql/
│       └── init/         # 数据库初始化脚本
├── .github/              # GitHub Actions
│   └── workflows/
├── .gitignore
├── .editorconfig
├── .prettierrc
├── docker-compose.yml
└── README.md
```

## 快速开始

### 方式一：Docker Compose（推荐）

```bash
# 克隆项目
git clone https://github.com/yourusername/mistakery.git
cd mistakery

# 启动所有服务（MySQL、Redis、后端、前端）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

服务启动后：
- 前端：http://localhost:5173
- 后端 API：http://localhost:3001/api
- MySQL：localhost:3306
- Redis：localhost:6379

### 方式二：本地开发

#### 前置要求

- Node.js 20+
- MySQL 8.0+
- Redis 7.0+
- npm 或 pnpm 8+

#### 环境配置

**后端 (.env)：**
```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件：
```env
NODE_ENV=development
PORT=3001

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=mistakery

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

**前端 (.env)：**
```bash
cd frontend
cp .env.example .env
```

编辑 `.env` 文件：
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_TITLE=错题本
```

#### 数据库初始化

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE mistakery CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 导入初始化脚本
mysql -u root -p mistakery < docker/mysql/init/01-init.sql
```

#### 安装依赖

```bash
# 安装前端依赖
cd frontend && npm install

# 安装后端依赖
cd backend && npm install
```

#### 启动开发服务器

```bash
# 启动前端开发服务器 (终端1)
cd frontend && npm run dev

# 启动后端开发服务器 (终端2)
cd backend && npm run start:dev
```

访问 http://localhost:5173 查看应用。

### 生产构建

```bash
# 构建前端
cd frontend && npm run build

# 构建后端
cd backend && npm run build

# 启动生产服务
cd backend && npm run start:prod
```

## 开发命令

### 前端

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run lint         # 运行 ESLint
npm run type-check   # TypeScript 类型检查
npm run test         # 运行测试
npm run test:ui      # 运行测试 UI
npm run format       # 格式化代码
```

### 后端

```bash
npm run start:dev    # 启动开发服务器（热重载）
npm run start:debug  # 启动调试模式
npm run build        # 构建生产版本
npm run start:prod   # 启动生产服务
npm run lint         # 运行 ESLint
npm run test         # 运行测试
npm run test:cov     # 运行测试并生成覆盖率报告
npm run test:watch   # 监听模式运行测试
npm run format       # 格式化代码
```

## 测试

### 运行所有测试
```bash
# 前端测试
cd frontend && npm run test:coverage

# 后端测试
cd backend && npm run test:cov
```

### CI/CD

项目使用 GitHub Actions 进行持续集成和部署：

- `.github/workflows/backend-ci.yml` - 后端 CI（lint、test、build）
- `.github/workflows/frontend-ci.yml` - 前端 CI（lint、test、build）
- `.github/workflows/deploy.yml` - 生产部署（main 分支）

## 开发规范

### 代码风格

- 遵循 ESLint 和 Prettier 配置
- 使用 Conventional Commits 规范提交代码：
  - `feat:` 新功能
  - `fix:` 修复 bug
  - `docs:` 文档更新
  - `style:` 代码格式调整
  - `refactor:` 重构
  - `test:` 测试相关
  - `chore:` 构建/工具链相关

### 命名规范

- **组件**：PascalCase（如 `MistakeCard.vue`）
- **文件**：kebab-case（如 `mistake-service.ts`）
- **变量/函数**：camelCase（如 `getUserById`）
- **常量**：UPPER_SNAKE_CASE（如 `API_BASE_URL`）
- **接口/类型**：PascalCase（如 `User`, `MistakeDto`）

### 分支策略

- `main` - 主分支，生产环境代码
- `develop` - 开发分支
- `feature/xxx` - 功能分支
- `fix/xxx` - 修复分支
- `hotfix/xxx` - 紧急修复分支

### 提交流程

1. 从 `develop` 创建功能分支
2. 完成开发并提交代码
3. 推送到远程仓库
4. 创建 Pull Request
5. 通过代码审查和 CI 检查
6. 合并到 `develop`

## 故障排除

### 常见问题

**1. MySQL 连接失败**
- 检查 MySQL 服务是否启动
- 检查 `.env` 中的数据库配置是否正确
- 确保数据库用户有足够权限

**2. Redis 连接失败**
- 检查 Redis 服务是否启动
- 检查 `.env` 中的 Redis 配置是否正确

**3. 前端 API 请求失败**
- 检查后端服务是否启动
- 检查 `.env` 中的 `VITE_API_BASE_URL` 是否正确

**4. Docker 容器启动失败**
- 清理旧的容器和卷：`docker-compose down -v`
- 重新构建镜像：`docker-compose build`
- 检查端口是否被占用

## 项目进度

- ✅ 阶段 1：项目设置与环境配置（已完成）
- 🔄 阶段 2：核心功能开发（进行中）
- ⏳ 阶段 3：测试与优化
- ⏳ 阶段 4：部署与上线

详细进度请查看 [ProjectPlan.md](./ProjectPlan.md)

## 文档

- [前端设计文档](./FrontendDesignDocument.md)
- [项目设计文档](./ProjectDesignDocument.md)
- [项目计划](./ProjectPlan.md)
- [功能列表](./function.md)
- [UI 设计规范](./UIdesign.md)

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 项目主页：https://github.com/yourusername/mistakery
- 问题反馈：https://github.com/yourusername/mistakery/issues
