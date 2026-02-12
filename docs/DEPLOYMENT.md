# Mistakery 本地部署文档

本文档介绍如何在本地环境中部署 Mistakery 项目。

## 目录

- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [详细说明](#详细说明)
- [服务管理](#服务管理)
- [数据库管理](#数据库管理)
- [故障排查](#故障排查)
- [生产环境配置](#生产环境配置)

---

## 前置要求

### 必需软件

- **Docker Desktop** 20.10+
  - [下载地址](https://www.docker.com/products/docker-desktop/)
- **Git** 2.30+
  - [下载地址](https://git-scm.com/downloads)
- **Node.js** 20+ (仅用于本地开发，Docker部署不需要)
  - [下载地址](https://nodejs.org/)

### 可选软件

- **PM2** (用于进程管理，非 Docker 部署)
  ```bash
  npm install -g pm2
  ```

---

## 快速开始

### Windows 用户

```powershell
# 1. 克隆项目
git clone https://github.com/yourusername/mistakery.git
cd mistakery

# 2. 初始化设置
scripts\deploy.bat setup

# 3. 修改 .env 文件中的默认密码（重要！）
notepad .env

# 4. 构建镜像
scripts\deploy.bat build

# 5. 启动服务
scripts\deploy.bat start

# 6. 检查健康状态
scripts\deploy.bat health
```

### Linux/macOS 用户

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/mistakery.git
cd mistakery

# 2. 添加执行权限
chmod +x scripts/deploy.sh

# 3. 初始化设置
./scripts/deploy.sh setup

# 4. 修改 .env 文件中的默认密码（重要！）
nano .env

# 5. 构建镜像
./scripts/deploy.sh build

# 6. 启动服务
./scripts/deploy.sh start

# 7. 检查健康状态
./scripts/deploy.sh health
```

### 访问应用

- **前端**: http://localhost
- **后端 API**: http://localhost:3001/api
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

---

## 详细说明

### 项目结构

```
mistakery/
├── backend/              # 后端服务 (NestJS)
│   ├── src/             # 源代码
│   ├── dist/            # 构建产物
│   ├── uploads/         # 上传文件目录
│   ├── Dockerfile       # Docker 镜像配置
│   └── ecosystem.config.cjs  # PM2 配置
├── frontend/            # 前端服务 (Vue 3)
│   ├── src/             # 源代码
│   ├── dist/            # 构建产物
│   ├── docker/          # Docker 配置
│   └── Dockerfile       # Docker 镜像配置
├── docker/              # Docker 配置
│   ├── mysql/           # MySQL 初始化脚本
│   └── nginx/           # Nginx 配置
├── scripts/             # 部署脚本
│   ├── deploy.sh        # Linux/macOS 脚本
│   └── deploy.bat       # Windows 脚本
├── logs/                # 日志目录
├── uploads/             # 上传文件目录
├── backups/             # 数据库备份目录
└── docker-compose.yml   # Docker Compose 配置
```

### 环境变量说明

#### 应用配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 后端服务端口 | `3001` |

#### 数据库配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DB_ROOT_PASSWORD` | MySQL root 密码 | `mistakery_root_pass` |
| `DB_NAME` | 数据库名称 | `mistakery` |
| `DB_USER` | 数据库用户 | `mistakery` |
| `DB_PASSWORD` | 数据库密码 | `mistakery_pass` |
| `DB_PORT` | 数据库端口 | `3306` |

#### Redis 配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `REDIS_HOST` | Redis 主机 | `redis` |
| `REDIS_PORT` | Redis 端口 | `6379` |
| `REDIS_PASSWORD` | Redis 密码 | `mistakery_redis_pass` |
| `REDIS_DB` | Redis 数据库 | `0` |

#### JWT 配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `JWT_SECRET` | JWT 密钥 | `mistakery_jwt_secret` |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d` |

#### 前端配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `FRONTEND_URL` | 前端 URL | `http://localhost` |
| `VITE_API_BASE_URL` | API 基础 URL | `http://localhost:3001/api` |

---

## 服务管理

### 启动服务

```bash
# Windows
scripts\deploy.bat start

# Linux/macOS
./scripts/deploy.sh start
```

### 停止服务

```bash
# Windows
scripts\deploy.bat stop

# Linux/macOS
./scripts/deploy.sh stop
```

### 重启服务

```bash
# Windows
scripts\deploy.bat restart

# Linux/macOS
./scripts/deploy.sh restart
```

### 查看服务状态

```bash
# Windows
scripts\deploy.bat status

# Linux/macOS
./scripts/deploy.sh status
```

### 查看日志

```bash
# 查看所有服务日志
scripts\deploy.bat logs

# 查看特定服务日志
scripts\deploy.bat logs backend
scripts\deploy.bat logs frontend
scripts\deploy.bat logs mysql
scripts\deploy.bat logs redis
```

---

## 数据库管理

### 数据库备份

```bash
# Windows
scripts\deploy.bat backup

# Linux/macOS
./scripts/deploy.sh backup
```

备份文件将保存在 `backups/YYYYMMDD_HHMMSS/` 目录下。

### 数据库恢复

```bash
# Windows
scripts\deploy.bat restore backups\20240101_120000\backup.sql

# Linux/macOS
./scripts/deploy.sh restore backups/20240101_120000/backup.sql
```

### 手动备份/恢复

```bash
# 备份
docker-compose exec -T mysql mysqldump -u root -p${DB_ROOT_PASSWORD} mistakery > backup.sql

# 恢复
docker-compose exec -T mysql mysql -u root -p${DB_ROOT_PASSWORD} mistakery < backup.sql
```

---

## 故障排查

### 常见问题

#### 1. Docker 容器启动失败

**问题**: 服务无法启动，日志显示连接错误

**解决方案**:
```bash
# 检查 Docker 是否运行
docker info

# 检查容器状态
docker-compose ps

# 查看详细日志
docker-compose logs [service-name]
```

#### 2. 数据库连接失败

**问题**: 后端无法连接到 MySQL

**解决方案**:
```bash
# 确认 MySQL 容器健康
docker-compose exec mysql mysqladmin ping -h localhost

# 检查数据库是否创建
docker-compose exec mysql mysql -u root -p${DB_ROOT_PASSWORD} -e "SHOW DATABASES;"

# 查看数据库日志
docker-compose logs mysql
```

#### 3. 前端无法访问后端 API

**问题**: 前端显示网络错误

**解决方案**:
1. 检查 `.env` 文件中的 `VITE_API_BASE_URL` 配置
2. 确认后端服务正常运行
3. 检查防火墙设置

#### 4. 端口冲突

**问题**: 端口已被占用

**解决方案**:
```bash
# 修改 docker-compose.yml 中的端口映射
# 例如：将 "3001:3001" 改为 "3002:3001"
```

### 健康检查

```bash
# 执行完整健康检查
scripts\deploy.bat health
```

### 清理和重置

```bash
# 清理所有容器和数据卷
scripts\deploy.bat cleanup

# 重新部署
scripts\deploy.bat setup
scripts\deploy.bat build
scripts\deploy.bat start
```

---

## 生产环境配置

### 使用 Nginx 反向代理

```bash
# 启用 Nginx 服务
docker-compose --profile with-nginx up -d
```

访问地址将变为:
- HTTP: http://localhost:8080
- HTTPS: http://localhost:8443

### SSL/TLS 配置

1. 创建 SSL 证书目录:
```bash
mkdir -p docker/nginx/ssl
```

2. 放置证书文件:
```
docker/nginx/ssl/cert.pem  # 证书文件
docker/nginx/ssl/key.pem   # 私钥文件
```

3. 取消 `docker/nginx/nginx.conf` 中 HTTPS 配置的注释

### 性能优化

#### 增加数据库连接池

修改 `backend/src/config/database.config.ts`:
```typescript
extra: {
  connectionLimit: 50,  // 增加连接数
  // ...
}
```

#### 启用 Redis 持久化

已默认启用 AOF 持久化，配置在 `docker-compose.yml` 中。

#### 日志管理

日志文件保存在以下位置:
- 后端日志: `logs/pm2-*.log`
- Nginx 日志: Docker volume `nginx_logs`
- Docker 日志: `docker-compose logs`

---

## 安全建议

1. **修改默认密码**: 部署前务必修改 `.env` 文件中的所有默认密码
2. **限制网络访问**: 在生产环境中使用防火墙限制端口访问
3. **启用 HTTPS**: 配置 SSL 证书启用 HTTPS
4. **定期备份**: 设置定期备份任务
5. **更新依赖**: 定期更新 Docker 镜像和依赖包

---

## 联系方式

如有问题，请联系:
- GitHub Issues: https://github.com/yourusername/mistakery/issues
- Email: support@mistakery.com
