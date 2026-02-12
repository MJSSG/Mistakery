@echo off
REM ====================================
REM Mistakery - 本地开发环境启动脚本
REM 同时启动前后端，关闭时自动清理 node.exe 进程
REM ====================================

setlocal enabledelayedexpansion

REM 设置项目根目录
set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"

REM 设置窗口标题
set "BACKEND_TITLE=Mistakery Backend - NestJS"
set "FRONTEND_TITLE=Mistakery Frontend - Vue 3"

REM 设置颜色
set "INFO=[92m[INFO]"
set "WARN=[93m[WARN]"
set "ERROR=[91m[ERROR]"
set "RESET=[0m"

echo.
echo %INFO% ========================================
echo %INFO%   Mistakery 本地开发环境启动
echo %INFO% ========================================
echo %RESET%

REM ====================================
REM 检查环境
REM ====================================

echo %INFO% 检查 Node.js 是否安装...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo %ERROR% Node.js 未安装或未添加到 PATH
    echo %WARN% 请先安装 Node.js 20+ 版本
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node -v') do set "NODE_VERSION=%%i"
echo %INFO% Node.js 版本: %NODE_VERSION%
echo.

REM ====================================
REM 检查依赖是否安装
REM ====================================

echo %INFO% 检查后端依赖...
if not exist "%BACKEND_DIR%\node_modules" (
    echo %WARN% 后端依赖未安装，正在安装...
    cd /d "%BACKEND_DIR%"
    call npm install
    if %errorlevel% neq 0 (
        echo %ERROR% 后端依赖安装失败
        pause
        exit /b 1
    )
    echo %INFO% 后端依赖安装完成
) else (
    echo %INFO% 后端依赖已存在
)

echo.
echo %INFO% 检查前端依赖...
if not exist "%FRONTEND_DIR%\node_modules" (
    echo %WARN% 前端依赖未安装，正在安装...
    cd /d "%FRONTEND_DIR%"
    call npm install
    if %errorlevel% neq 0 (
        echo %ERROR% 前端依赖安装失败
        pause
        exit /b 1
    )
    echo %INFO% 前端依赖安装完成
) else (
    echo %INFO% 前端依赖已存在
)

echo.

REM ====================================
REM 检查环境配置文件
REM ====================================

echo %INFO% 检查环境配置文件...

if not exist "%BACKEND_DIR%\.env" (
    if exist "%BACKEND_DIR%\.env.example" (
        copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
        echo %WARN% 已创建 backend\.env（从 .env.example 复制）
        echo %WARN% 请根据需要修改配置
    )
)

if not exist "%FRONTEND_DIR%\.env" (
    if exist "%FRONTEND_DIR%\.env.example" (
        copy "%FRONTEND_DIR%\.env.example" "%FRONTEND_DIR%\.env" >nul
        echo %WARN% 已创建 frontend\.env（从 .env.example 复制）
    )
)

echo.

REM ====================================
REM 创建临时清理脚本
REM ====================================

set "CLEANUP_SCRIPT=%TEMP%\mistakery_cleanup_%RANDOM%.bat"

(
    echo @echo off
    echo echo 正在关闭 Mistakery 开发服务器...
    echo.
    echo REM 获取当前窗口 PID 的子进程
    echo for /f "tokens=2" %%%%i in ^('tasklist /fi "imagename eq node.exe" /fo csv ^| find "node.exe"'^) do ^(
    echo     taskkill /f /pid %%%%i 2^>nul
    echo ^)
    echo.
    echo echo 所有 node.exe 进程已终止
    echo timeout /t 2 /nobreak ^>nul
    echo del "%%~f0" 2^>nul
) > "%CLEANUP_SCRIPT%"

REM ====================================
REM 启动后端服务
REM ====================================

echo %INFO% 启动后端服务...
echo %RESET%.
echo 后端地址: http://localhost:3001
echo.

start "%BACKEND_TITLE%" cmd /k "cd /d "%BACKEND_DIR%" && npm run start:dev"

REM 等待后端启动
echo %INFO% 等待后端服务启动...
timeout /t 5 /nobreak >nul

echo.

REM ====================================
REM 启动前端服务
REM ====================================

echo %INFO% 启动前端服务...
echo %RESET%.
echo 前端地址: http://localhost:5173
echo.

start "%FRONTEND_TITLE%" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

REM 等待前端启动
echo %INFO% 等待前端服务启动...
timeout /t 3 /nobreak >nul

echo.

REM ====================================
REM 启动完成
REM ====================================

cls
echo.
echo %INFO% ========================================
echo %INFO%   Mistakery 开发环境已启动
echo %INFO% ========================================
echo %RESET%
echo.
echo   [93m前端地址: [92mhttp://localhost:5173
echo   [93m后端地址: [92mhttp://localhost:3001/api
echo   [93mAPI 文档: [92mhttp://localhost:3001/api/docs
echo %RESET%
echo.
echo %INFO% 按 [Ctrl+C] 或关闭此窗口停止所有服务
echo.
echo %INFO% 正在监听服务状态...
echo.

REM ====================================
REM 监听 Ctrl+C 信号并执行清理
REM ====================================

REM 捕获 Ctrl+C 信号
if "%1"=="cleanup" goto :cleanup

REM 等待用户中断
pause

:cleanup
echo.
echo %INFO% 正在停止所有服务...

REM 终止所有 node.exe 进程
echo %INFO% 终止 node.exe 进程...

REM 使用更精确的方式终止进程
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv 2^>nul ^| find "node.exe"') do (
    taskkill /f /pid %%i 2>nul
)

echo.
echo %INFO% 所有服务已停止
echo %RESET%

REM 删除临时脚本
if exist "%CLEANUP_SCRIPT%" del "%CLEANUP_SCRIPT%" 2>nul

timeout /t 2 /nobreak >nul
exit /b 0
