@echo off
REM ====================================
REM Mistakery - Windows 本地部署脚本
REM ====================================

setlocal enabledelayedexpansion

REM 颜色设置（Windows 10+）
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "WARN=[WARN]"
set "ERROR=[ERROR]"

REM ====================================
REM 函数定义
REM ====================================

:log_info
echo %INFO% %~1
goto :eof

:log_success
echo %SUCCESS% %~1
goto :eof

:log_warn
echo %WARN% %~1
goto :eof

:log_error
echo %ERROR% %~1
goto :eof

REM 检查 Docker 是否运行
:check_docker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "Docker 未运行，请先启动 Docker Desktop"
    exit /b 1
)
call :log_success "Docker 正在运行"
goto :eof

REM 创建必要的目录
:create_directories
call :log_info "创建必要的目录..."

if not exist "docker\mysql\init" mkdir "docker\mysql\init"
if not exist "docker\nginx\conf.d" mkdir "docker\nginx\conf.d"
if not exist "docker\nginx\ssl" mkdir "docker\nginx\ssl"
if not exist "logs" mkdir "logs"
if not exist "uploads" mkdir "uploads"
if not exist "backups" mkdir "backups"

call :log_success "目录创建完成"
goto :eof

REM 设置环境配置
:setup_env
call :log_info "设置环境配置..."

if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        call :log_warn ".env 文件已从 .env.example 创建，请根据需要修改配置"
    ) else (
        call :log_warn ".env.example 文件不存在，创建默认 .env 文件"
        (
            echo # 应用配置
            echo NODE_ENV=production
            echo PORT=3001
            echo.
            echo # 数据库配置
            echo DB_ROOT_PASSWORD=mistakery_root_pass_change_me
            echo DB_NAME=mistakery
            echo DB_USER=mistakery
            echo DB_PASSWORD=mistakery_pass_change_me
            echo DB_PORT=3306
            echo.
            echo # Redis 配置
            echo REDIS_HOST=redis
            echo REDIS_PORT=6379
            echo REDIS_PASSWORD=mistakery_redis_pass_change_me
            echo REDIS_DB=0
            echo.
            echo # JWT 配置
            echo JWT_SECRET=mistakery_jwt_secret_change_me_in_production
            echo JWT_EXPIRES_IN=7d
            echo.
            echo # 前端配置
            echo FRONTEND_URL=http://localhost
            echo VITE_API_BASE_URL=http://localhost:3001/api
        ) > .env
        call :log_warn "请修改 .env 文件中的默认密码！"
    )
) else (
    call :log_info ".env 文件已存在"
)

if not exist "backend\.env" (
    copy ".env" "backend\.env" >nul
    call :log_info "backend\.env 文件已创建"
)

if not exist "frontend\.env" (
    (
            echo VITE_API_BASE_URL=http://localhost:3001/api
            echo VITE_APP_TITLE=错题本
            echo VITE_UPLOAD_URL=http://localhost:3001
    ) > "frontend\.env"
    call :log_info "frontend\.env 文件已创建"
)

call :log_success "环境配置完成"
goto :eof

REM 构建镜像
:build_images
call :log_info "构建 Docker 镜像..."
docker-compose build --parallel
if %errorlevel% neq 0 (
    call :log_error "镜像构建失败"
    exit /b 1
)
call :log_success "镜像构建完成"
goto :eof

REM 启动服务
:start_services
call :log_info "启动服务..."

docker-compose up -d mysql redis
call :log_info "等待数据库和 Redis 启动..."
timeout /t 10 /nobreak >nul

docker-compose up -d backend
call :log_info "等待后端服务启动..."
timeout /t 15 /nobreak >nul

docker-compose up -d frontend

call :log_success "服务启动完成"
call :log_info "访问 http://localhost 查看应用"
goto :eof

REM 停止服务
:stop_services
call :log_info "停止服务..."
docker-compose down
call :log_success "服务已停止"
goto :eof

REM 重启服务
:restart_services
call :stop_services
call :start_services
goto :eof

REM 查看状态
:show_status
call :log_info "服务状态："
docker-compose ps
goto :eof

REM 查看日志
:view_logs
set "SERVICE=%~1"
if "%SERVICE%"=="" (
    docker-compose logs -f
) else (
    docker-compose logs -f %SERVICE%
)
goto :eof

REM 清理资源
:cleanup
call :log_warn "清理所有资源（包括数据卷）..."
set /p CONFIRM="确定要清理吗？这将删除所有数据！[y/N]: "
if /i "%CONFIRM%"=="y" (
    docker-compose down -v
    call :log_success "清理完成"
) else (
    call :log_info "取消清理"
)
goto :eof

REM 数据库备份
:backup_database
call :log_info "备份数据库..."

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "datetime=%%I"
set "BACKUP_DIR=backups\%datetime:~0,8%_%datetime:~8,6%"
mkdir "%BACKUP_DIR%" 2>nul

docker-compose exec -T mysql mysqldump -u root -pmistakery_root_pass mistakery > "%BACKUP_DIR%\backup.sql"

if %errorlevel% equ 0 (
    call :log_success "数据库已备份到: %BACKUP_DIR%\backup.sql"
) else (
    call :log_error "数据库备份失败"
)
goto :eof

REM 健康检查
:health_check
call :log_info "健康检查..."

REM 检查 MySQL
docker-compose exec -T mysql mysqladmin ping -h localhost >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "MySQL: 健康"
) else (
    call :log_error "MySQL: 不健康"
)

REM 检查 Redis
docker-compose exec -T redis redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "Redis: 健康"
) else (
    call :log_error "Redis: 不健康"
)

REM 检查后端
curl -f -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "Backend: 健康"
) else (
    call :log_error "Backend: 不健康"
)

REM 检查前端
curl -f -s http://localhost/ >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "Frontend: 健康"
) else (
    call :log_error "Frontend: 不健康"
)
goto :eof

REM 显示帮助
:show_help
echo Mistakery Windows 本地部署脚本
echo.
echo 用法: deploy.bat [命令]
echo.
echo 命令:
echo     check           - 检查 Docker 是否运行
echo     setup           - 初始化设置（创建目录、环境配置）
echo     build           - 构建 Docker 镜像
echo     start           - 启动所有服务
echo     stop            - 停止所有服务
echo     restart         - 重启所有服务
echo     status          - 查看服务状态
echo     logs [service]  - 查看日志（可指定服务）
echo     cleanup         - 清理所有资源（包括数据卷）
echo     backup          - 备份数据库
echo     health          - 健康检查
echo     help            - 显示此帮助信息
echo.
echo 示例:
echo     deploy.bat setup          # 初始化设置
echo     deploy.bat start          # 启动服务
echo     deploy.bat logs backend   # 查看后端日志
echo     deploy.bat health         # 健康检查
echo.
goto :eof

REM ====================================
REM 主函数
REM ====================================
:main
set "COMMAND=%~1"

if "%COMMAND%"=="" set "COMMAND=help"

if "%COMMAND%"=="check" (
    call :check_docker
) else if "%COMMAND%"=="setup" (
    call :check_docker
    call :create_directories
    call :setup_env
) else if "%COMMAND%"=="build" (
    call :build_images
) else if "%COMMAND%"=="start" (
    call :start_services
) else if "%COMMAND%"=="stop" (
    call :stop_services
) else if "%COMMAND%"=="restart" (
    call :restart_services
) else if "%COMMAND%"=="status" (
    call :show_status
) else if "%COMMAND%"=="logs" (
    call :view_logs %~2
) else if "%COMMAND%"=="cleanup" (
    call :cleanup
) else if "%COMMAND%"=="backup" (
    call :backup_database
) else if "%COMMAND%"=="health" (
    call :health_check
) else if "%COMMAND%"=="help" (
    call :show_help
) else (
    call :log_error "未知命令: %COMMAND%"
    call :show_help
    exit /b 1
)

goto :eof

call :main %*
