# ====================================
# Mistakery Backend - Dockerfile
# 多阶段构建：依赖安装 + 构建 + 生产运行
# ====================================

# ====================================
# 阶段 1: 依赖安装
# ====================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制包管理文件
COPY package.json pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# ====================================
# 阶段 2: 构建
# ====================================
FROM node:20-alpine AS builder
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 从 deps 阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 构建
RUN pnpm run build

# ====================================
# 阶段 3: 开发环境（热重载）
# ====================================
FROM node:20-alpine AS development
WORKDIR /app

# 安装 pnpm 和开发依赖
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3001

# 启动开发服务器
CMD ["pnpm", "run", "start:dev"]

# ====================================
# 阶段 4: 生产环境
# ====================================
FROM node:20-alpine AS production

# 安装必要的系统依赖
RUN apk add --no-cache \
    tzdata \
    dumb-init \
    curl

# 设置时区
ENV TZ=Asia/Shanghai

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# 设置工作目录
WORKDIR /app

# 从 builder 复制生产依赖
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 从 builder 复制构建产物
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# 创建必要的目录
RUN mkdir -p /app/logs /app/uploads && \
    chown -R nestjs:nodejs /app/logs /app/uploads

# 切换用户
USER nestjs

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# 使用 dumb-init 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
