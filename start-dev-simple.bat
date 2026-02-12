@echo off
REM ====================================
REM Mistakery - 简化版启动脚本
REM ====================================

setlocal enabledelayedexpansion

set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"

cls
echo.
echo ========================================
echo    Mistakery 开发环境启动
echo ========================================
echo.

REM 启动后端
echo [1/2] 启动后端服务...
start "Mistakery-Backend" /D "%BACKEND_DIR%" cmd /k "npm run start:dev"

REM 等待后端启动
echo 等待后端服务就绪...
timeout /t 8 /nobreak >nul

REM 启动前端
echo.
echo [2/2] 启动前端服务...
start "Mistakery-Frontend" /D "%FRONTEND_DIR%" cmd /k "npm run dev"

echo.
echo 等待前端服务启动...
timeout /t 5 /nobreak >nul

cls
echo.
echo ========================================
echo    启动完成！
echo ========================================
echo.
echo   前端: http://localhost:5173
echo   后端: http://localhost:3001/api
echo.
echo   提示: 运行 stop-dev.bat 停止所有服务
echo.
pause
