@echo off
REM ====================================
REM Mistakery - 本地开发环境启动脚本 (改进版)
REM 使用进程组管理，关闭时自动清理所有子进程
REM ====================================

setlocal enabledelayedexpansion

REM 设置项目路径
set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"
set "LOG_DIR=%PROJECT_ROOT%logs"

REM 创建日志目录
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM 颜色定义
for /f %%i in ('echo prompt $E ^| cmd') do set "ESC=%%i"
set "INFO=%ESC%[92m[INFO]"
set "WARN=%ESC%[93m[WARN]"
set "ERROR=%ESC%[91m[ERROR]"
set "RESET=%ESC%[0m"
set "CYAN=%ESC%[96m"

REM ====================================
REM 显示欢迎信息
REM ====================================

cls
echo.
echo %CYAN%╔════════════════════════════════════════╗
echo ║   Mistakery 本地开发环境启动器           ║
echo ║   Vue 3 + Vite + NestJS                   ║
echo ╚════════════════════════════════════════╝%RESET%
echo.

REM ====================================
REM 检查环境
REM ====================================

echo %INFO% 检查运行环境...
echo.

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo %ERROR% Node.js 未安装！
    echo %WARN% 请先安装 Node.js 20 或更高版本
    echo.
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node -v 2^>nul') do set "NODE_VER=%%i"
for /f "tokens=1" %%i in ('npm -v 2^>nul') do set "NPM_VER=%%i"

echo   Node.js: %NODE_VER%
echo   npm:     %NPM_VER%
echo.

REM 检查端口占用
netstat -ano | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo %WARN% 端口 3001 已被占用（可能是后端正在运行）
    echo %INFO% 请先运行 stop-dev.bat 停止现有服务
    echo.
)

netstat -ano | findstr ":5173" >nul 2>&1
if %errorlevel% equ 0 (
    echo %WARN% 端口 5173 已被占用（可能是前端正在运行）
    echo %INFO% 请先运行 stop-dev.bat 停止现有服务
    echo.
)

REM ====================================
REM 检查并安装依赖
REM ====================================

echo %INFO% 检查项目依赖...
echo.

REM 检查后端
if not exist "%BACKEND_DIR%\node_modules" (
    echo %WARN% 后端依赖未安装，正在安装...
    echo %CYAN%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
    cd /d "%BACKEND_DIR%"
    call npm install
    if %errorlevel% neq 0 (
        echo %ERROR% 后端依赖安装失败
        pause
        exit /b 1
    )
    echo %INFO% 后端依赖安装完成
    echo.
) else (
    echo %INFO% 后端依赖已就绪
)

REM 检查前端
if not exist "%FRONTEND_DIR%\node_modules" (
    echo %WARN% 前端依赖未安装，正在安装...
    echo %CYAN%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
    cd /d "%FRONTEND_DIR%"
    call npm install
    if %errorlevel% neq 0 (
        echo %ERROR% 前端依赖安装失败
        pause
        exit /b 1
    )
    echo %INFO% 前端依赖安装完成
    echo.
) else (
    echo %INFO% 前端依赖已就绪
)

echo.

REM ====================================
REM 检查环境配置
REM ====================================

echo %INFO% 检查环境配置...
echo.

if not exist "%BACKEND_DIR%\.env" (
    if exist "%BACKEND_DIR%\.env.example" (
        copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
        echo %WARN% 已创建 backend\.env
    )
)

if not exist "%FRONTEND_DIR%\.env" (
    if exist "%FRONTEND_DIR%\.env.example" (
        copy "%FRONTEND_DIR%\.env.example" "%FRONTEND_DIR%\.env" >nul
        echo %WARN% 已创建 frontend\.env
    )
)

echo.

REM ====================================
REM 创建 PID 文件用于跟踪进程
REM ====================================

set "PID_FILE=%TEMP%\mistakery_pids.txt"
echo # Mistakery 进程 ID 文件 > "%PID_FILE%"

REM ====================================
REM 启动后端服务
REM ====================================

echo %INFO% 启动后端服务...
echo.

REM 使用 start /B 在后台启动，并记录窗口标题
start "Mistakery-Backend" cmd /c "cd /d "%BACKEND_DIR%" && npm run start:dev 2^>^1"

REM 等待后端启动
echo %INFO% 等待后端服务就绪...
timeout /t 6 /nobreak >nul

echo.

REM ====================================
REM 启动前端服务
REM ====================================

echo %INFO% 启动前端服务...
echo.

start "Mistakery-Frontend" cmd /c "cd /d "%FRONTEND_DIR%" && npm run dev 2^>^1"

REM 等待前端启动
echo %INFO% 等待前端服务就绪...
timeout /t 4 /nobreak >nul

echo.

REM ====================================
REM 显示启动完成信息
REM ====================================

cls
echo.
echo %CYAN%╔════════════════════════════════════════╗
echo ║   开发环境启动成功！                      ║
echo ╚════════════════════════════════════════╝%RESET%
echo.
echo.
echo   %CYAN%服务地址%RESET%
echo   ─────────────────────────────────────
echo   %ESC%[92m→ 前端应用:%RESET%      http://localhost:5173
echo   %ESC%[92m→ 后端 API:%RESET%       http://localhost:3001/api
echo   %ESC%[92m→ API 文档:%RESET%       http://localhost:3001/api/docs
echo.
echo   %CYAN%快捷操作%RESET%
echo   ─────────────────────────────────────
echo   查看后端日志:     查看 "Mistakery-Backend" 窗口
echo   查看前端日志:     查看 "Mistakery-Frontend" 窗口
echo   停止所有服务:     运行 stop-dev.bat
echo.
echo   %CYAN%提示%RESET%
echo   ─────────────────────────────────────
echo   按 %ESC%[93mCtrl+C%RESET% 或关闭此窗口将自动停止所有服务
echo.
echo.

REM ====================================
REM 创建清理函数
REM ====================================

:cleanup
echo.
echo %INFO% 正在停止所有服务...
echo.

REM 通过窗口标题查找并终止进程
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv 2^>nul ^| find "node.exe"') do (
    taskkill /f /pid %%i 2>nul
)

echo %INFO% 所有服务已停止
echo.
timeout /t 2 /nobreak >nul
if exist "%PID_FILE%" del "%PID_FILE%" 2>nul
goto :eof

REM ====================================
REM 监听中断信号
REM ====================================

REM 设置 Ctrl+C 处理
REM 当用户按 Ctrl+C 时，Windows 会执行 cleanup

REM 保持脚本运行
echo %INFO% 开发环境运行中... (按 Ctrl+C 停止)
echo.

REM 无限等待，直到用户中断
:wait_loop
timeout /t 60 /nobreak >nul
goto wait_loop
