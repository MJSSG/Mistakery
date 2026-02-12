@echo off
REM ====================================
REM Mistakery Backend 启动脚本
REM ====================================

cd /d "%~dp0"
echo Starting Mistakery Backend...
echo.
npm run start:dev
