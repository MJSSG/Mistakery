@echo off
REM ====================================
REM Mistakery - 停止开发环境
REM 终止所有相关 node.exe 进程
REM ====================================

setlocal enabledelayedexpansion

set "INFO=[92m[INFO]"
set "WARN=[93m[WARN]"
set "RESET=[0m"

cls
echo.
echo %INFO% ========================================
echo %INFO%   停止 Mistakery 开发环境
echo %INFO% ========================================
echo %RESET%
echo.

REM 显示当前运行的 node.exe 进程
echo %INFO% 当前运行的 Node.js 进程:
echo.
tasklist /fi "imagename eq node.exe" /fo table 2>nul
echo.

REM 检查是否有 node.exe 进程在运行
tasklist /fi "imagename eq node.exe" 2>nul | find /i "node.exe" >nul
if %errorlevel% neq 0 (
    echo %WARN% 没有发现运行中的 node.exe 进程
    goto :end
)

REM 询问用户确认
set /p CONFIRM="%WARN% 确定要终止所有 Node.js 进程吗? [y/N]: "
if /i not "%CONFIRM%"=="y" (
    echo.
    echo %INFO% 操作已取消
    goto :end
)

echo.
echo %INFO% 正在终止进程...

REM 终止所有 node.exe 进程
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv 2^>nul ^| find "node.exe"') do (
    echo 终止 PID: %%i
    taskkill /f /pid %%i 2>nul
)

echo.
echo %INFO% 所有 Node.js 进程已终止
echo.

:end
echo %RESET%
timeout /t 2 /nobreak >nul
exit /b 0
