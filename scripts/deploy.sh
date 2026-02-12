#!/bin/bash

# ====================================
# Mistakery - 本地部署脚本
# ====================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查必要的工具
check_requirements() {
    log_info "检查必要的工具..."

    if ! command_exists docker; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command_exists docker-compose; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    log_success "所有必要的工具已安装"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."

    mkdir -p docker/mysql/init
    mkdir -p docker/nginx/conf.d
    mkdir -p docker/nginx/ssl
    mkdir -p logs
    mkdir -p uploads

    log_success "目录创建完成"
}

# 复制环境配置
setup_env() {
    log_info "设置环境配置..."

    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            log_warn ".env 文件已从 .env.example 创建，请根据需要修改配置"
        else
            log_warn ".env.example 文件不存在，创建默认 .env 文件"
            cat > .env << 'EOF'
# 应用配置
NODE_ENV=production
PORT=3001

# 数据库配置
DB_ROOT_PASSWORD=mistakery_root_pass_change_me
DB_NAME=mistakery
DB_USER=mistakery
DB_PASSWORD=mistakery_pass_change_me
DB_PORT=3306

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=mistakery_redis_pass_change_me
REDIS_DB=0

# JWT 配置
JWT_SECRET=mistakery_jwt_secret_change_me_in_production
JWT_EXPIRES_IN=7d

# 前端配置
FRONTEND_URL=http://localhost
VITE_API_BASE_URL=http://localhost:3001/api

# Nginx 配置
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
EOF
            log_warn "请修改 .env 文件中的默认密码！"
        fi
    else
        log_info ".env 文件已存在"
    fi

    # Backend .env
    if [ ! -f backend/.env ]; then
        cp .env backend/.env
        log_info "backend/.env 文件已创建"
    fi

    # Frontend .env
    if [ ! -f frontend/.env ]; then
        cat > frontend/.env << EOF
VITE_API_BASE_URL=\${VITE_API_BASE_URL:-http://localhost:3001/api}
VITE_APP_TITLE=错题本
VITE_UPLOAD_URL=http://localhost:3001
EOF
        log_info "frontend/.env 文件已创建"
    fi

    log_success "环境配置完成"
}

# 构建镜像
build_images() {
    log_info "构建 Docker 镜像..."

    docker-compose build --parallel

    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."

    docker-compose up -d mysql redis

    log_info "等待数据库和 Redis 启动..."
    sleep 10

    docker-compose up -d backend

    log_info "等待后端服务启动..."
    sleep 15

    docker-compose up -d frontend

    log_success "服务启动完成"
}

# 停止服务
stop_services() {
    log_info "停止服务..."

    docker-compose down

    log_success "服务已停止"
}

# 查看日志
view_logs() {
    service=$1
    if [ -z "$service" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$service"
    fi
}

# 查看状态
show_status() {
    log_info "服务状态："
    docker-compose ps
}

# 清理资源
cleanup() {
    log_warn "清理所有资源（包括数据卷）..."
    read -p "确定要清理吗？这将删除所有数据！[y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        log_success "清理完成"
    else
        log_info "取消清理"
    fi
}

# 数据库备份
backup_database() {
    log_info "备份数据库..."

    backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"

    docker-compose exec -T mysql mysqldump -u root -p"${DB_ROOT_PASSWORD}" "${DB_NAME}" > "$backup_dir/backup.sql"

    log_success "数据库已备份到: $backup_dir/backup.sql"
}

# 数据库恢复
restore_database() {
    backup_file=$1
    if [ -z "$backup_file" ]; then
        log_error "请指定备份文件路径"
        exit 1
    fi

    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        exit 1
    fi

    log_info "恢复数据库从: $backup_file"

    docker-compose exec -T mysql mysql -u root -p"${DB_ROOT_PASSWORD}" "${DB_NAME}" < "$backup_file"

    log_success "数据库恢复完成"
}

# 健康检查
health_check() {
    log_info "健康检查..."

    # 检查 MySQL
    if docker-compose exec -T mysql mysqladmin ping -h localhost --silent; then
        log_success "MySQL: 健康"
    else
        log_error "MySQL: 不健康"
    fi

    # 检查 Redis
    if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
        log_success "Redis: 健康"
    else
        log_error "Redis: 不健康"
    fi

    # 检查后端
    if curl -f -s http://localhost:3001/api/health > /dev/null; then
        log_success "Backend: 健康"
    else
        log_error "Backend: 不健康"
    fi

    # 检查前端
    if curl -f -s http://localhost/ > /dev/null; then
        log_success "Frontend: 健康"
    else
        log_error "Frontend: 不健康"
    fi
}

# 显示帮助
show_help() {
    cat << EOF
Mistakery 本地部署脚本

用法: ./deploy.sh [命令]

命令:
    check           - 检查必要的工具
    setup           - 初始化设置（创建目录、环境配置）
    build           - 构建 Docker 镜像
    start           - 启动所有服务
    stop            - 停止所有服务
    restart         - 重启所有服务
    logs [service]  - 查看日志（可指定服务）
    status          - 查看服务状态
    cleanup         - 清理所有资源（包括数据卷）
    backup          - 备份数据库
    restore <file>  - 恢复数据库
    health          - 健康检查
    help            - 显示此帮助信息

示例:
    ./deploy.sh setup          # 初始化设置
    ./deploy.sh start          # 启动服务
    ./deploy.sh logs backend   # 查看后端日志
    ./deploy.sh health         # 健康检查

EOF
}

# ====================================
# 主函数
# ====================================
main() {
    case "${1:-help}" in
        check)
            check_requirements
            ;;
        setup)
            check_requirements
            create_directories
            setup_env
            ;;
        build)
            build_images
            ;;
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            stop_services
            start_services
            ;;
        logs)
            view_logs "$2"
            ;;
        status)
            show_status
            ;;
        cleanup)
            cleanup
            ;;
        backup)
            backup_database
            ;;
        restore)
            restore_database "$2"
            ;;
        health)
            health_check
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
