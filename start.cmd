@echo off
chcp 65001 >nul
title 幼儿园家校沟通系统启动器

echo ====================================
echo    🎈 幼儿园家校沟通系统启动器
echo ====================================
echo.

echo [1] 安装依赖包
echo [2] 启动开发环境
echo [3] 构建生产版本
echo [4] 仅启动后端服务
echo [5] 仅启动前端服务
echo [6] 退出
echo.

set /p choice=请选择操作 (1-6): 

if "%choice%"=="1" goto install
if "%choice%"=="2" goto dev
if "%choice%"=="3" goto build
if "%choice%"=="4" goto backend
if "%choice%"=="5" goto frontend
if "%choice%"=="6" goto exit

echo 无效选择，请重新运行脚本
pause
goto exit

:install
echo.
echo 正在安装依赖包...
call npm run install-all
echo.
echo 依赖包安装完成！
pause
goto exit

:dev
echo.
echo 正在启动开发环境...
echo 后端服务: http://localhost:3000
echo 前端服务: http://localhost:8080
echo.
start cmd /k "cd backend && npm run dev"
timeout /t 3 >nul
start cmd /k "cd frontend && npm run serve"
echo 开发环境启动中，请稍候...
goto exit

:build
echo.
echo 正在构建生产版本...
cd frontend
call npm run build
echo.
echo 构建完成！生产文件位于 frontend/dist 目录
pause
goto exit

:backend
echo.
echo 正在启动后端服务...
cd backend
call npm run dev
pause
goto exit

:frontend
echo.
echo 正在启动前端服务...
cd frontend
call npm run serve
pause
goto exit

:exit
echo.
echo 感谢使用幼儿园家校沟通系统！
exit 